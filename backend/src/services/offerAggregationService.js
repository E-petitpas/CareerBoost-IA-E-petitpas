const { supabase } = require('../config/supabase');
const franceTravailService = require('./franceTravailService');
const skillsService = require('./skillsService');

class OfferAggregationService {
  constructor() {
    this.isRunning = false;
    this.lastSyncTime = null;
    this.syncIntervalHours = parseInt(process.env.FRANCE_TRAVAIL_SYNC_INTERVAL_HOURS) || 6;
    this.maxOffersPerSync = parseInt(process.env.FRANCE_TRAVAIL_MAX_OFFERS_PER_SYNC) || 500;
    this.enabled = process.env.FRANCE_TRAVAIL_SYNC_ENABLED === 'true';
  }

  /**
   * Démarrer la synchronisation automatique des offres
   */
  startAutoSync() {
    if (!this.enabled) {
      console.log('Agrégation France Travail: Synchronisation désactivée');
      return;
    }

    console.log(`Agrégation France Travail: Démarrage de la synchronisation automatique (toutes les ${this.syncIntervalHours}h)`);
    
    // Synchronisation immédiate
    this.syncOffers();
    
    // Programmer les synchronisations suivantes
    setInterval(() => {
      this.syncOffers();
    }, this.syncIntervalHours * 60 * 60 * 1000);
  }

  /**
   * Synchroniser les offres depuis France Travail
   */
  async syncOffers() {
    if (this.isRunning) {
      console.log('Agrégation France Travail: Synchronisation déjà en cours, ignorée');
      return;
    }

    this.isRunning = true;
    console.log('Agrégation France Travail: Début de la synchronisation');

    try {
      const startTime = Date.now();
      let totalProcessed = 0;
      let totalCreated = 0;
      let totalSkipped = 0;
      let totalErrors = 0;

      // Obtenir l'ID de l'entreprise France Travail
      const franceTravailCompanyId = await franceTravailService.getOrCreateFranceTravailCompany();

      // Rechercher les offres par domaines d'activité
      // Filtré pour E-Petitpas : uniquement informatique et formations numériques
      const domains = [
        'M18' // Informatique et télécommunications
      ];

      for (const domain of domains) {
        try {
          console.log(`Agrégation France Travail: Traitement du domaine ${domain}`);
          
          const searchResult = await franceTravailService.searchOffers({
            domaine: domain,
            range: `0-${Math.floor(Math.min(this.maxOffersPerSync / domains.length, 149))}`,
            sort: '1', // Tri par date de création
            // Inclure l'alternance pour E-Petitpas (formation)
            typeContrat: 'CDI,CDD,MIS,SAI' // SAI = Contrat d'apprentissage/alternance
            // Temporairement sans mots-clés pour tester l'alternance
            // motsCles: 'développeur,programmeur,informatique,web,logiciel,formation,numérique'
          });

          if (searchResult.resultats && searchResult.resultats.length > 0) {
            const results = await this.processOffers(searchResult.resultats, franceTravailCompanyId);
            totalProcessed += results.processed;
            totalCreated += results.created;
            totalSkipped += results.skipped;
            totalErrors += results.errors;
          }

          // Pause entre les domaines pour éviter le rate limiting
          await this.sleep(1000);
        } catch (error) {
          console.error(`Erreur lors du traitement du domaine ${domain}:`, error);
          totalErrors++;
        }
      }

      const duration = Date.now() - startTime;
      this.lastSyncTime = new Date();

      console.log(`Agrégation France Travail: Synchronisation terminée en ${duration}ms`);
      console.log(`- Offres traitées: ${totalProcessed}`);
      console.log(`- Offres créées: ${totalCreated}`);
      console.log(`- Offres ignorées (doublons): ${totalSkipped}`);
      console.log(`- Erreurs: ${totalErrors}`);

      // Enregistrer les statistiques de synchronisation
      await this.saveSyncStats({
        processed: totalProcessed,
        created: totalCreated,
        skipped: totalSkipped,
        errors: totalErrors,
        duration,
        source: 'FRANCE_TRAVAIL'
      });

    } catch (error) {
      console.error('Erreur lors de la synchronisation France Travail:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Traiter une liste d'offres France Travail
   */
  async processOffers(offers, companyId) {
    let processed = 0;
    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const franceTravailOffer of offers) {
      try {
        processed++;
        
        // Normaliser l'offre
        const normalizedOffer = franceTravailService.normalizeOffer(franceTravailOffer);
        normalizedOffer.company_id = companyId;

        // Vérifier si l'offre existe déjà (déduplication)
        const { data: existingOffer } = await supabase
          .from('job_offers')
          .select('id')
          .eq('dedup_hash', normalizedOffer.dedup_hash)
          .single();

        if (existingOffer) {
          skipped++;
          continue;
        }

        // Créer l'offre
        const { data: createdOffer, error: offerError } = await supabase
          .from('job_offers')
          .insert(normalizedOffer)
          .select('id')
          .single();

        if (offerError) {
          console.error('Erreur création offre:', offerError);
          errors++;
          continue;
        }

        // Extraire et associer les compétences
        await this.extractAndAssociateSkills(franceTravailOffer, createdOffer.id);

        created++;
        console.log(`Offre créée: ${normalizedOffer.title} (ID: ${createdOffer.id})`);

      } catch (error) {
        console.error('Erreur lors du traitement de l\'offre:', error);
        errors++;
      }
    }

    return { processed, created, skipped, errors };
  }

  /**
   * Extraire et associer les compétences depuis une offre France Travail
   */
  async extractAndAssociateSkills(franceTravailOffer, offerId) {
    try {
      const skills = [];

      // Extraire les compétences depuis la description et le titre
      const text = `${franceTravailOffer.intitule} ${franceTravailOffer.description}`;
      const extractedSkills = await skillsService.extractSkillsFromText(text) || [];
      
      // Ajouter les compétences spécifiques France Travail si disponibles
      if (franceTravailOffer.competences) {
        for (const competence of franceTravailOffer.competences) {
          if (competence.libelle) {
            skills.push({
              name: competence.libelle,
              is_required: competence.exigence === 'E' // E = Exigé, S = Souhaité
            });
          }
        }
      }

      // Combiner avec les compétences extraites automatiquement
      const allSkills = [...extractedSkills, ...skills];
      
      // Associer les compétences à l'offre
      for (const skill of allSkills) {
        try {
          // Trouver ou créer la compétence
          const { data: existingSkill } = await supabase
            .from('skills')
            .select('id')
            .ilike('name', skill.name)
            .single();

          let skillId;
          if (existingSkill) {
            skillId = existingSkill.id;
          } else {
            // Créer la compétence si elle n'existe pas
            const { data: newSkill } = await supabase
              .from('skills')
              .insert({
                name: skill.name,
                slug: skill.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                display_name: skill.name,
                category: 'Technique'
              })
              .select('id')
              .single();
            
            if (newSkill) {
              skillId = newSkill.id;
            }
          }

          if (skillId) {
            // Associer la compétence à l'offre
            await supabase
              .from('job_offer_skills')
              .insert({
                job_offer_id: offerId,
                skill_id: skillId,
                is_required: skill.is_required || false,
                weight: skill.is_required ? 3 : 1
              });
          }
        } catch (skillError) {
          console.error('Erreur lors de l\'association de la compétence:', skillError);
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'extraction des compétences:', error);
    }
  }

  /**
   * Enregistrer les statistiques de synchronisation
   */
  async saveSyncStats(stats) {
    try {
      await supabase
        .from('sync_stats')
        .insert({
          ...stats,
          sync_date: new Date().toISOString()
        });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des statistiques:', error);
    }
  }

  /**
   * Obtenir les statistiques de synchronisation
   */
  async getSyncStats(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('sync_stats')
        .select('*')
        .order('sync_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return [];
    }
  }

  /**
   * Synchronisation manuelle (pour l'admin)
   */
  async manualSync() {
    if (this.isRunning) {
      throw new Error('Une synchronisation est déjà en cours');
    }

    console.log('Agrégation France Travail: Synchronisation manuelle démarrée');
    await this.syncOffers();
    return {
      success: true,
      message: 'Synchronisation terminée',
      lastSyncTime: this.lastSyncTime
    };
  }

  /**
   * Obtenir le statut de la synchronisation
   */
  getStatus() {
    return {
      enabled: this.enabled,
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      syncIntervalHours: this.syncIntervalHours,
      maxOffersPerSync: this.maxOffersPerSync
    };
  }

  /**
   * Synchronisation manuelle (pour les tests)
   */
  async manualSync() {
    return await this.syncOffers();
  }

  /**
   * Utilitaire pour faire une pause
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new OfferAggregationService();
