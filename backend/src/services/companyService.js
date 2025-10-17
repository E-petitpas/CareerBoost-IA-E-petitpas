/**
 * Service de gestion des entreprises
 * Gère la création, validation et gestion des entreprises
 */

const { supabase } = require('../config/supabase');
const { validateSIREN } = require('../utils/validation');

class CompanyService {
  /**
   * Crée une nouvelle entreprise
   * @param {Object} companyData - Données de l'entreprise
   * @returns {Promise<Object>} Entreprise créée
   */
  async createCompany(companyData) {
    const { name, siren, domain, sector, size, logo_url } = companyData;

    // Validation des données
    if (!name || name.length < 2 || name.length > 200) {
      throw new Error('Nom d\'entreprise invalide (2-200 caractères)');
    }

    // Valider que le SIREN a 9 chiffres (sans validation Luhn stricte)
    if (siren && !/^\d{9}$/.test(siren)) {
      throw new Error('SIREN invalide (doit contenir 9 chiffres)');
    }

    // Validation du domaine (URL)
    if (domain) {
      try {
        new URL(domain);
      } catch (e) {
        throw new Error('Domaine invalide (doit être une URL valide)');
      }
    }

    // Vérifier si l'entreprise existe déjà
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id, name, status')
      .eq('domain', domain || `${name.toLowerCase().replace(/\s+/g, '-')}.com`)
      .single();

    if (existingCompany) {
      console.log('Entreprise existante trouvée:', existingCompany.id);
      return existingCompany;
    }

    // Créer la nouvelle entreprise avec statut PENDING
    const { data: newCompany, error: createError } = await supabase
      .from('companies')
      .insert({
        name,
        siren: siren || null,
        domain: domain || `${name.toLowerCase().replace(/\s+/g, '-')}.com`,
        sector: sector || null,
        size: size || null,
        logo_url: logo_url || null,
        status: 'PENDING', // Statut initial: en attente de validation
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Erreur création entreprise:', createError);
      throw new Error('Erreur lors de la création de l\'entreprise');
    }

    console.log('Entreprise créée avec succès:', newCompany.id);
    return newCompany;
  }

  /**
   * Récupère une entreprise par ID
   * @param {string} companyId - ID de l'entreprise
   * @returns {Promise<Object>} Entreprise
   */
  async getCompanyById(companyId) {
    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (error) {
      throw new Error('Entreprise non trouvée');
    }

    return company;
  }

  /**
   * Récupère les entreprises d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Liste des entreprises
   */
  async getUserCompanies(userId) {
    const { data: memberships, error } = await supabase
      .from('company_memberships')
      .select(`
        company_id,
        role_in_company,
        is_primary,
        companies (
          id,
          name,
          siren,
          domain,
          status,
          created_at,
          validated_at
        )
      `)
      .eq('user_id', userId)
      .is('removed_at', null);

    if (error) {
      console.error('Erreur récupération entreprises:', error);
      throw new Error('Erreur lors de la récupération des entreprises');
    }

    return memberships || [];
  }

  /**
   * Crée un lien entre un utilisateur et une entreprise
   * @param {string} userId - ID de l'utilisateur
   * @param {string} companyId - ID de l'entreprise
   * @param {string} role - Rôle dans l'entreprise (ADMIN_RH, RH_USER)
   * @param {boolean} isPrimary - Est-ce l'entreprise principale
   * @returns {Promise<Object>} Membership créé
   */
  async createMembership(userId, companyId, role = 'ADMIN_RH', isPrimary = true) {
    // Vérifier si le membership existe déjà
    const { data: existingMembership } = await supabase
      .from('company_memberships')
      .select('id')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .is('removed_at', null)
      .single();

    if (existingMembership) {
      console.log('Membership déjà existant');
      return existingMembership;
    }

    // Créer le membership
    const { data: membership, error } = await supabase
      .from('company_memberships')
      .insert({
        user_id: userId,
        company_id: companyId,
        role_in_company: role,
        is_primary: isPrimary,
        accepted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur création membership:', error);
      throw new Error('Erreur lors de la création du lien entreprise');
    }

    console.log('Membership créé:', membership.id);
    return membership;
  }

  /**
   * Valide une entreprise (Admin)
   * @param {string} companyId - ID de l'entreprise
   * @param {string} status - Nouveau statut (VERIFIED, REJECTED)
   * @param {string} reason - Raison de la validation/rejet
   * @returns {Promise<Object>} Entreprise mise à jour
   */
  async validateCompany(companyId, status, reason = null) {
    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      throw new Error('Statut invalide');
    }

    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    // Ajouter les colonnes de validation si elles existent
    if (reason) {
      updateData.validation_reason = reason;
    }

    const { data: company, error } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', companyId)
      .select()
      .single();

    if (error) {
      console.error('Erreur validation entreprise:', error);
      throw new Error('Erreur lors de la validation de l\'entreprise');
    }

    console.log(`Entreprise ${status === 'VERIFIED' ? 'approuvée' : 'rejetée'}:`, company.id);
    return company;
  }

  /**
   * Récupère les entreprises en attente de validation
   * @param {number} limit - Nombre de résultats
   * @param {number} offset - Décalage
   * @returns {Promise<Object>} Entreprises et total
   */
  async getPendingCompanies(limit = 20, offset = 0) {
    const { data: companies, error: dataError, count } = await supabase
      .from('companies')
      .select('*', { count: 'exact' })
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (dataError) {
      console.error('Erreur récupération entreprises en attente:', dataError);
      throw new Error('Erreur lors de la récupération des entreprises');
    }

    return {
      data: companies || [],
      total: count || 0,
      limit,
      offset
    };
  }

  /**
   * Récupère les statistiques des entreprises
   * @returns {Promise<Object>} Statistiques
   */
  async getCompanyStats() {
    const { data: companies, error } = await supabase
      .from('companies')
      .select('status');

    if (error) {
      console.error('Erreur récupération stats:', error);
      throw new Error('Erreur lors de la récupération des statistiques');
    }

    const companyList = companies || [];
    return {
      total: companyList.length,
      verified: companyList.filter(c => c.status === 'VERIFIED').length,
      pending: companyList.filter(c => c.status === 'PENDING').length,
      rejected: companyList.filter(c => c.status === 'REJECTED').length
    };
  }

  /**
   * Met à jour les informations d'une entreprise
   * @param {string} companyId - ID de l'entreprise
   * @param {Object} updateData - Données à mettre à jour
   * @returns {Promise<Object>} Entreprise mise à jour
   */
  async updateCompany(companyId, updateData) {
    const { data: company, error } = await supabase
      .from('companies')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', companyId)
      .select()
      .single();

    if (error) {
      console.error('Erreur mise à jour entreprise:', error);
      throw new Error('Erreur lors de la mise à jour de l\'entreprise');
    }

    return company;
  }
}

module.exports = new CompanyService();

