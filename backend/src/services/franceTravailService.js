const axios = require('axios');
const { supabase } = require('../config/supabase');

class FranceTravailService {
  constructor() {
    this.baseURL = 'https://api.francetravail.io';
    this.tokenURL = 'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire';
    this.clientId = process.env.FRANCE_TRAVAIL_CLIENT_ID;
    this.clientSecret = process.env.FRANCE_TRAVAIL_CLIENT_SECRET;
    this.scope = 'api_offresdemploiv2 o2dsoffre';
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Obtenir un token d'accès OAuth2
   */
  async getAccessToken() {
    try {
      // Vérifier si le token actuel est encore valide
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      console.log('France Travail Service: Demande de nouveau token d\'accès');

      const response = await axios.post(this.tokenURL, 
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: this.scope
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      // Définir l'expiration avec une marge de sécurité de 5 minutes
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

      console.log('France Travail Service: Token d\'accès obtenu avec succès');
      return this.accessToken;
    } catch (error) {
      console.error('Erreur lors de l\'obtention du token France Travail:', error.response?.data || error.message);
      throw new Error('Impossible d\'obtenir le token d\'accès France Travail');
    }
  }

  /**
   * Effectuer une requête authentifiée à l'API France Travail
   */
  async makeAuthenticatedRequest(endpoint, params = {}) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        params
      });

      return response.data;
    } catch (error) {
      console.error('Erreur requête France Travail:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Rechercher des offres d'emploi
   */
  async searchOffers(filters = {}) {
    try {
      console.log('France Travail Service: Recherche d\'offres avec filtres:', filters);

      const params = {
        range: filters.range || '0-149', // Par défaut, récupérer 150 offres
        sort: filters.sort || '0', // 0 = pertinence, 1 = date de création, 2 = date de modification
        domaine: filters.domaine || 'M18', // M18 = Informatique par défaut
        typeContrat: filters.typeContrat || 'CDI,CDD,MIS', // Types de contrats
        experienceExigee: filters.experienceExigee || 'D,S,E', // D=Débutant, S=Expérimenté, E=Expert
        ...filters
      };

      const data = await this.makeAuthenticatedRequest('/partenaire/offresdemploi/v2/offres/search', params);
      
      console.log(`France Travail Service: ${data.resultats?.length || 0} offres trouvées`);
      return data;
    } catch (error) {
      console.error('Erreur lors de la recherche d\'offres France Travail:', error);
      throw error;
    }
  }

  /**
   * Obtenir les détails d'une offre spécifique
   */
  async getOfferDetails(offerId) {
    try {
      console.log('France Travail Service: Récupération détails offre:', offerId);
      
      const data = await this.makeAuthenticatedRequest(`/partenaire/offresdemploi/v2/offres/${offerId}`);
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des détails de l\'offre:', error);
      throw error;
    }
  }

  /**
   * Normaliser une offre France Travail vers le format de la base de données
   */
  normalizeOffer(franceTravailOffer) {
    try {
      const offer = {
        title: franceTravailOffer.intitule || 'Offre sans titre',
        description: franceTravailOffer.description || '',
        city: franceTravailOffer.lieuTravail?.libelle || null,
        latitude: franceTravailOffer.lieuTravail?.latitude || null,
        longitude: franceTravailOffer.lieuTravail?.longitude || null,
        contract_type: this.mapContractType(franceTravailOffer.typeContrat),
        experience_min: this.mapExperienceLevel(franceTravailOffer.experienceExige),
        salary_min: franceTravailOffer.salaire?.libelle ? this.extractSalary(franceTravailOffer.salaire.libelle).min : null,
        salary_max: franceTravailOffer.salaire?.libelle ? this.extractSalary(franceTravailOffer.salaire.libelle).max : null,
        currency: 'EUR',
        source: 'EXTERNAL',
        source_url: franceTravailOffer.origineOffre?.urlOrigine || null,
        status: 'ACTIVE',
        admin_status: 'PENDING', // Toutes les offres externes nécessitent validation admin
        published_at: franceTravailOffer.dateCreation || new Date().toISOString(),
        dedup_hash: this.generateDedupHash(franceTravailOffer),
        // Métadonnées spécifiques France Travail
        france_travail_id: franceTravailOffer.id,
        france_travail_data: franceTravailOffer
      };

      return offer;
    } catch (error) {
      console.error('Erreur lors de la normalisation de l\'offre:', error);
      throw error;
    }
  }

  /**
   * Mapper le type de contrat France Travail vers notre enum
   */
  mapContractType(franceTravailType) {
    const mapping = {
      'CDI': 'CDI',
      'CDD': 'CDD',
      'MIS': 'INTERIM',
      'SAI': 'ALTERNANCE', // Contrat d'apprentissage/alternance
      'LIB': 'FREELANCE',
      'APP': 'ALTERNANCE', // Apprentissage
      'PRO': 'ALTERNANCE'  // Contrat de professionnalisation
    };
    return mapping[franceTravailType] || 'CDD';
  }

  /**
   * Mapper le niveau d'expérience
   */
  mapExperienceLevel(experienceCode) {
    const mapping = {
      'D': 0, // Débutant
      'S': 2, // Expérimenté (2-5 ans)
      'E': 5  // Expert (5+ ans)
    };
    return mapping[experienceCode] || 0;
  }

  /**
   * Extraire le salaire min/max depuis une chaîne de caractères
   */
  extractSalary(salaryString) {
    // Exemples: "25000 - 35000 Euros par an", "2500 Euros par mois"
    const numbers = salaryString.match(/\d+/g);
    if (!numbers) return { min: null, max: null };

    if (numbers.length === 1) {
      const salary = parseInt(numbers[0]);
      return { min: salary, max: salary };
    } else if (numbers.length >= 2) {
      return {
        min: parseInt(numbers[0]),
        max: parseInt(numbers[1])
      };
    }

    return { min: null, max: null };
  }

  /**
   * Générer un hash de déduplication
   */
  generateDedupHash(offer) {
    const crypto = require('crypto');

    // Normaliser les données pour éviter les variations mineures
    const title = (offer.intitule || '').toLowerCase().trim();
    const company = (offer.entreprise?.nom || 'unknown').toLowerCase().trim();
    const location = (offer.lieuTravail?.libelle || 'unknown').toLowerCase().trim();
    const offerId = offer.id || '';

    // Créer une clé unique basée sur les éléments essentiels
    const key = `${title}|${company}|${location}|${offerId}`;

    // Utiliser SHA-256 pour une meilleure distribution et éviter les collisions
    const hash = crypto.createHash('sha256').update(key, 'utf8').digest('hex');

    console.log(`Hash généré pour "${title}": ${hash.substring(0, 16)}...`);
    return hash;
  }

  /**
   * Créer une entreprise virtuelle pour France Travail si elle n'existe pas
   */
  async getOrCreateFranceTravailCompany() {
    try {
      // Vérifier si l'entreprise France Travail existe déjà
      const { data: existingCompany, error } = await supabase
        .from('companies')
        .select('id')
        .eq('name', 'France Travail')
        .eq('domain', 'francetravail.io')
        .single();

      if (existingCompany) {
        return existingCompany.id;
      }

      // Créer l'entreprise France Travail
      const { data: newCompany, error: createError } = await supabase
        .from('companies')
        .insert({
          name: 'France Travail',
          domain: 'francetravail.io',
          status: 'VERIFIED',
          sector: 'Services publics'
        })
        .select('id')
        .single();

      if (createError) {
        throw createError;
      }

      console.log('France Travail Service: Entreprise France Travail créée:', newCompany.id);
      return newCompany.id;
    } catch (error) {
      console.error('Erreur lors de la création de l\'entreprise France Travail:', error);
      throw error;
    }
  }
}

module.exports = new FranceTravailService();
