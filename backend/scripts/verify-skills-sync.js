require('dotenv').config();
const { supabase } = require('../src/config/supabase');
const skillsService = require('../src/services/skillsParsingService');

/**
 * Script de vérification de la synchronisation entre :
 * - Le dictionnaire de parsing (skillsParsingService.js)
 * - La base de données (table skills)
 */

async function verifySkillsSync() {
  console.log('🔍 Vérification de la synchronisation des compétences...\n');
  
  try {
    // 1. Récupérer toutes les compétences de la base de données
    console.log('📊 Récupération des compétences en base...');
    const { data: dbSkills, error: dbError } = await supabase
      .from('skills')
      .select('slug, display_name, category');
    
    if (dbError) {
      console.error('❌ Erreur récupération DB:', dbError.message);
      return;
    }
    
    console.log(`✅ ${dbSkills.length} compétences trouvées en base\n`);
    
    // 2. Récupérer le dictionnaire de parsing
    console.log('📖 Analyse du dictionnaire de parsing...');
    const parsingSkills = skillsService.skillsKeywords;
    
    console.log(`✅ ${Object.keys(parsingSkills).length} compétences dans le dictionnaire\n`);
    
    // 3. Créer des maps pour la comparaison
    const dbSkillsMap = new Map();
    dbSkills.forEach(skill => {
      dbSkillsMap.set(skill.slug, skill);
    });
    
    const parsingSkillsMap = new Map();
    Object.entries(parsingSkills).forEach(([keyword, skillInfo]) => {
      parsingSkillsMap.set(skillInfo.slug, {
        keyword,
        ...skillInfo
      });
    });
    
    // 4. Trouver les compétences manquantes en base
    console.log('🔍 Recherche des compétences manquantes en base...');
    const missingInDb = [];
    
    parsingSkillsMap.forEach((skillInfo, slug) => {
      if (!dbSkillsMap.has(slug)) {
        missingInDb.push({
          slug,
          display_name: skillInfo.display_name,
          category: skillInfo.category,
          keyword: skillInfo.keyword
        });
      }
    });
    
    if (missingInDb.length > 0) {
      console.log(`❌ ${missingInDb.length} compétences manquantes en base :`);
      missingInDb.forEach(skill => {
        console.log(`   - ${skill.display_name} (${skill.slug}) - Catégorie: ${skill.category}`);
      });
      console.log();
    } else {
      console.log('✅ Toutes les compétences du dictionnaire sont en base\n');
    }
    
    // 5. Trouver les compétences en base mais pas dans le dictionnaire
    console.log('🔍 Recherche des compétences en base non référencées...');
    const notInParsing = [];
    
    dbSkills.forEach(dbSkill => {
      if (!parsingSkillsMap.has(dbSkill.slug)) {
        notInParsing.push(dbSkill);
      }
    });
    
    if (notInParsing.length > 0) {
      console.log(`⚠️ ${notInParsing.length} compétences en base non référencées dans le parsing :`);
      notInParsing.slice(0, 20).forEach(skill => {
        console.log(`   - ${skill.display_name} (${skill.slug}) - Catégorie: ${skill.category}`);
      });
      if (notInParsing.length > 20) {
        console.log(`   ... et ${notInParsing.length - 20} autres`);
      }
      console.log();
    } else {
      console.log('✅ Toutes les compétences en base sont référencées dans le parsing\n');
    }
    
    // 6. Vérifier les incohérences de noms/catégories
    console.log('🔍 Vérification des incohérences...');
    const inconsistencies = [];
    
    parsingSkillsMap.forEach((skillInfo, slug) => {
      const dbSkill = dbSkillsMap.get(slug);
      if (dbSkill) {
        if (dbSkill.display_name !== skillInfo.display_name) {
          inconsistencies.push({
            slug,
            type: 'display_name',
            db: dbSkill.display_name,
            parsing: skillInfo.display_name
          });
        }
        if (dbSkill.category !== skillInfo.category) {
          inconsistencies.push({
            slug,
            type: 'category',
            db: dbSkill.category,
            parsing: skillInfo.category
          });
        }
      }
    });
    
    if (inconsistencies.length > 0) {
      console.log(`⚠️ ${inconsistencies.length} incohérences détectées :`);
      inconsistencies.forEach(inc => {
        console.log(`   - ${inc.slug} (${inc.type}): DB="${inc.db}" vs Parsing="${inc.parsing}"`);
      });
      console.log();
    } else {
      console.log('✅ Aucune incohérence détectée\n');
    }
    
    // 7. Statistiques par catégorie
    console.log('📊 Statistiques par catégorie (Base de données) :');
    const categoryStats = {};
    dbSkills.forEach(skill => {
      if (skill.category) {
        categoryStats[skill.category] = (categoryStats[skill.category] || 0) + 1;
      }
    });
    
    Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15)
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count} compétences`);
      });
    
    // 8. Résumé final
    console.log('\n🎯 RÉSUMÉ DE LA SYNCHRONISATION');
    console.log('=====================================');
    console.log(`📊 Compétences en base: ${dbSkills.length}`);
    console.log(`📖 Compétences dans le parsing: ${parsingSkillsMap.size}`);
    console.log(`❌ Manquantes en base: ${missingInDb.length}`);
    console.log(`⚠️ Non référencées dans le parsing: ${notInParsing.length}`);
    console.log(`🔧 Incohérences: ${inconsistencies.length}`);
    
    const syncRate = ((parsingSkillsMap.size - missingInDb.length) / parsingSkillsMap.size * 100).toFixed(1);
    console.log(`📈 Taux de synchronisation: ${syncRate}%`);
    
    if (missingInDb.length === 0 && inconsistencies.length === 0) {
      console.log('\n🎉 Synchronisation parfaite ! Le système est prêt.');
    } else if (missingInDb.length > 0) {
      console.log('\n⚠️ Action requise: Ajoutez les compétences manquantes en base.');
      console.log('💡 Utilisez le script production-skills-seed.js pour les ajouter.');
    }
    
    // 9. Générer un script SQL pour les compétences manquantes
    if (missingInDb.length > 0) {
      console.log('\n📝 Script SQL pour ajouter les compétences manquantes :');
      console.log('-- Copiez et exécutez ce script dans votre base de données');
      console.log('INSERT INTO skills (slug, display_name, category) VALUES');
      
      const sqlValues = missingInDb.map(skill => 
        `  ('${skill.slug}', '${skill.display_name.replace(/'/g, "''")}', '${skill.category}')`
      ).join(',\n');
      
      console.log(sqlValues);
      console.log('ON CONFLICT (slug) DO NOTHING;');
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error(error);
  }
}

if (require.main === module) {
  verifySkillsSync().catch(console.error);
}

module.exports = { verifySkillsSync };
