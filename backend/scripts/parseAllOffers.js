require('dotenv').config();
const { supabase } = require('../src/config/supabase');
const skillsParsingService = require('../src/services/skillsParsingService');
const fs = require('fs');
const path = require('path');

/**
 * Script pour parser toutes les offres d'emploi et analyser les performances
 * Usage: node scripts/parseAllOffers.js [--force] [--limit=N] [--source=FRANCE_TRAVAIL]
 */

class OfferParsingAnalyzer {
  constructor() {
    this.stats = {
      total: 0,
      processed: 0,
      withSkills: 0,
      withoutSkills: 0,
      errors: 0,
      skillsAdded: 0,
      bySource: {},
      byCategory: {},
      processingTimes: [],
      failedOffers: []
    };
    
    this.logFile = path.join(__dirname, '../logs', `parsing-analysis-${Date.now()}.log`);
    this.ensureLogDir();
  }

  ensureLogDir() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    
    console.log(logMessage);
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  async getAllOffers(limit = null, source = null) {
    this.log('📊 Récupération des offres d\'emploi...');
    
    let query = supabase
      .from('job_offers')
      .select(`
        id,
        title,
        description,
        source,
        created_at,
        france_travail_id,
        job_offer_skills (
          id,
          skill_id,
          is_required,
          weight,
          skills (
            display_name,
            category
          )
        )
      `)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });

    if (source) {
      query = query.eq('source', source);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data: offers, error } = await query;

    if (error) {
      this.log(`❌ Erreur récupération offres: ${error.message}`, 'ERROR');
      throw error;
    }

    this.log(`✅ ${offers.length} offres récupérées`);
    return offers;
  }

  async parseOffer(offer, force = false) {
    const startTime = Date.now();
    
    try {
      // Vérifier si l'offre a déjà des compétences
      const hasSkills = offer.job_offer_skills && offer.job_offer_skills.length > 0;
      
      if (hasSkills && !force) {
        this.log(`⏭️ Offre "${offer.title}" a déjà ${offer.job_offer_skills.length} compétences, ignorée`);
        this.stats.withSkills++;
        return { success: true, skipped: true, skillsCount: offer.job_offer_skills.length };
      }

      this.log(`\n🔍 Parsing offre: "${offer.title}" (${offer.source})`);
      
      // Parser les compétences depuis la description
      const parsedSkills = skillsParsingService.parseSkillsFromDescription(
        offer.description || '',
        offer.title || ''
      );

      if (parsedSkills.length === 0) {
        this.log(`   ❌ Aucune compétence trouvée`, 'WARN');
        this.stats.failedOffers.push({
          id: offer.id,
          title: offer.title,
          source: offer.source,
          reason: 'no_skills_parsed',
          description_length: offer.description?.length || 0
        });
        this.stats.withoutSkills++;
        return { success: true, skillsCount: 0 };
      }

      this.log(`   📋 ${parsedSkills.length} compétences parsées:`);
      parsedSkills.forEach(skill => {
        this.log(`      - ${skill.display_name} (${skill.source || 'unknown'}) - ${skill.is_required ? 'REQUIS' : 'Optionnel'} - Poids: ${skill.weight}`);
      });

      // Associer aux compétences de la base de données
      const matchedSkills = await skillsParsingService.matchSkillsToDatabase(parsedSkills, supabase);

      if (matchedSkills.length === 0) {
        this.log(`   ❌ Aucune compétence matchée en base`, 'WARN');
        this.stats.failedOffers.push({
          id: offer.id,
          title: offer.title,
          source: offer.source,
          reason: 'no_skills_matched',
          parsed_skills: parsedSkills.map(s => s.display_name)
        });
        this.stats.withoutSkills++;
        return { success: true, skillsCount: 0 };
      }

      this.log(`   ✅ ${matchedSkills.length}/${parsedSkills.length} compétences matchées en base`);

      // Mettre à jour l'offre avec les compétences
      await skillsParsingService.updateOfferSkills(offer.id, matchedSkills, supabase);
      
      // Statistiques par catégorie
      matchedSkills.forEach(skill => {
        const category = skill.skills.category || 'Autre';
        this.stats.byCategory[category] = (this.stats.byCategory[category] || 0) + 1;
      });

      const processingTime = Date.now() - startTime;
      this.stats.processingTimes.push(processingTime);
      this.stats.skillsAdded += matchedSkills.length;
      this.stats.withSkills++;

      this.log(`   🎉 Offre mise à jour avec ${matchedSkills.length} compétences (${processingTime}ms)`);
      
      return { 
        success: true, 
        skillsCount: matchedSkills.length,
        processingTime,
        matchedSkills: matchedSkills.map(s => ({
          name: s.skills.display_name,
          category: s.skills.category,
          required: s.is_required,
          weight: s.weight
        }))
      };

    } catch (error) {
      this.log(`   ❌ Erreur parsing offre ${offer.id}: ${error.message}`, 'ERROR');
      this.stats.errors++;
      this.stats.failedOffers.push({
        id: offer.id,
        title: offer.title,
        source: offer.source,
        reason: 'parsing_error',
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  async run(options = {}) {
    const { force = false, limit = null, source = null } = options;
    
    this.log('🚀 Démarrage du parsing des offres d\'emploi');
    this.log(`Options: force=${force}, limit=${limit}, source=${source}`);
    
    try {
      const offers = await this.getAllOffers(limit, source);
      this.stats.total = offers.length;

      this.log(`\n📊 Analyse de ${offers.length} offres...`);

      for (let i = 0; i < offers.length; i++) {
        const offer = offers[i];
        
        // Statistiques par source
        this.stats.bySource[offer.source] = (this.stats.bySource[offer.source] || 0) + 1;
        
        const result = await this.parseOffer(offer, force);
        this.stats.processed++;

        // Pause pour éviter de surcharger la base
        if (i % 10 === 0 && i > 0) {
          this.log(`📈 Progression: ${i}/${offers.length} (${Math.round(i/offers.length*100)}%)`);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      this.generateReport();
      
    } catch (error) {
      this.log(`❌ Erreur fatale: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  generateReport() {
    this.log('\n' + '='.repeat(80));
    this.log('📊 RAPPORT D\'ANALYSE DU PARSING');
    this.log('='.repeat(80));
    
    // Statistiques générales
    this.log(`📈 Statistiques générales:`);
    this.log(`   Total d'offres analysées: ${this.stats.total}`);
    this.log(`   Offres traitées: ${this.stats.processed}`);
    this.log(`   Offres avec compétences: ${this.stats.withSkills} (${Math.round(this.stats.withSkills/this.stats.total*100)}%)`);
    this.log(`   Offres sans compétences: ${this.stats.withoutSkills} (${Math.round(this.stats.withoutSkills/this.stats.total*100)}%)`);
    this.log(`   Erreurs: ${this.stats.errors}`);
    this.log(`   Total compétences ajoutées: ${this.stats.skillsAdded}`);
    
    // Statistiques par source
    this.log(`\n📊 Répartition par source:`);
    Object.entries(this.stats.bySource).forEach(([source, count]) => {
      this.log(`   ${source}: ${count} offres`);
    });
    
    // Statistiques par catégorie de compétences
    this.log(`\n🏷️ Compétences par catégorie:`);
    const sortedCategories = Object.entries(this.stats.byCategory)
      .sort(([,a], [,b]) => b - a);
    sortedCategories.forEach(([category, count]) => {
      this.log(`   ${category}: ${count} compétences`);
    });
    
    // Performance
    if (this.stats.processingTimes.length > 0) {
      const avgTime = this.stats.processingTimes.reduce((a, b) => a + b, 0) / this.stats.processingTimes.length;
      const maxTime = Math.max(...this.stats.processingTimes);
      this.log(`\n⚡ Performance:`);
      this.log(`   Temps moyen par offre: ${Math.round(avgTime)}ms`);
      this.log(`   Temps maximum: ${maxTime}ms`);
    }
    
    // Offres problématiques
    if (this.stats.failedOffers.length > 0) {
      this.log(`\n⚠️ Offres problématiques (${this.stats.failedOffers.length}):`);
      this.stats.failedOffers.slice(0, 10).forEach(offer => {
        this.log(`   - "${offer.title}" (${offer.source}): ${offer.reason}`);
      });
      
      if (this.stats.failedOffers.length > 10) {
        this.log(`   ... et ${this.stats.failedOffers.length - 10} autres`);
      }
    }
    
    this.log(`\n📄 Log détaillé sauvegardé dans: ${this.logFile}`);
    
    // Sauvegarder le rapport JSON
    const reportFile = this.logFile.replace('.log', '-report.json');
    fs.writeFileSync(reportFile, JSON.stringify(this.stats, null, 2));
    this.log(`📊 Rapport JSON sauvegardé dans: ${reportFile}`);
  }
}

// Exécution du script
async function main() {
  const args = process.argv.slice(2);
  const options = {
    force: args.includes('--force'),
    limit: args.find(arg => arg.startsWith('--limit='))?.split('=')[1] ? parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1]) : null,
    source: args.find(arg => arg.startsWith('--source='))?.split('=')[1] || null
  };

  const analyzer = new OfferParsingAnalyzer();
  
  try {
    await analyzer.run(options);
    console.log('\n✅ Parsing terminé avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur lors du parsing:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = OfferParsingAnalyzer;
