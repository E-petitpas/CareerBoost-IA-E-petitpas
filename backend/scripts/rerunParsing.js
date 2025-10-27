require('dotenv').config();
const { supabase } = require('../src/config/supabase');
const skillsService = require('../src/services/skillsParsingService');

async function rerunParsing() {
  console.log('🔄 Relance du parsing avec les améliorations...\n');
  
  try {
    // Étape 1: Supprimer toutes les anciennes données
    console.log('🗑️ Suppression des anciennes données...');
    const { error: deleteError } = await supabase
      .from('job_offer_skills')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Supprimer tout
    
    if (deleteError) {
      console.error('❌ Erreur suppression:', deleteError.message);
      return;
    }
    console.log('✅ Anciennes données supprimées\n');
    
    // Étape 2: Récupérer toutes les offres
    console.log('📊 Récupération des offres...');
    const { data: allOffers, error: fetchError } = await supabase
      .from('job_offers')
      .select('id, title, france_travail_data');
    
    if (fetchError) {
      console.error('❌ Erreur récupération:', fetchError.message);
      return;
    }
    
    console.log(`✅ ${allOffers.length} offres récupérées\n`);
    
    // Étape 3: Parser toutes les offres
    let processed = 0;
    let withSkills = 0;
    let totalSkills = 0;
    let errors = 0;
    
    console.log('🚀 Début du parsing...\n');
    
    for (const offer of allOffers) {
      try {
        const progress = ((processed / allOffers.length) * 100).toFixed(1);
        console.log(`[${processed + 1}/${allOffers.length}] (${progress}%) "${offer.title}"`);
        
        const description = offer.france_travail_data?.description || '';
        const title = offer.title || '';
        
        if (!description.trim()) {
          console.log('   ⚠️ Pas de description');
          processed++;
          continue;
        }
        
        // Parser les compétences
        const skills = await skillsService.parseSkillsFromDescription(description, title);
        
        if (skills && skills.length > 0) {
          // Matcher avec la base de données
          const matchedSkills = await skillsService.matchSkillsToDatabase(skills, supabase);
          
          if (matchedSkills.length > 0) {
            // Insérer en base
            await skillsService.updateOfferSkills(offer.id, matchedSkills, supabase);
            
            console.log(`   ✅ ${matchedSkills.length} compétences ajoutées`);
            withSkills++;
            totalSkills += matchedSkills.length;
          } else {
            console.log('   ⚠️ Compétences parsées mais non matchées');
          }
        } else {
          console.log('   ❌ Aucune compétence trouvée');
        }
        
        processed++;
        
        // Affichage du progrès tous les 25 offres
        if (processed % 25 === 0) {
          console.log(`\n📊 Progrès intermédiaire:`);
          console.log(`   Traitées: ${processed}/${allOffers.length} (${((processed/allOffers.length)*100).toFixed(1)}%)`);
          console.log(`   Avec compétences: ${withSkills} (${((withSkills/processed)*100).toFixed(1)}%)`);
          console.log(`   Total compétences: ${totalSkills}`);
          console.log(`   Moyenne: ${withSkills > 0 ? (totalSkills/withSkills).toFixed(1) : 0} compétences/offre\n`);
        }
        
      } catch (error) {
        console.error(`   ❌ Erreur: ${error.message}`);
        errors++;
        processed++;
      }
    }
    
    // Résultats finaux
    console.log('\n🎉 Parsing terminé !');
    console.log('=====================================');
    console.log(`📊 Offres traitées: ${processed}`);
    console.log(`✅ Avec compétences: ${withSkills} (${((withSkills/processed)*100).toFixed(1)}%)`);
    console.log(`❌ Sans compétences: ${processed - withSkills} (${(((processed - withSkills)/processed)*100).toFixed(1)}%)`);
    console.log(`🎯 Total compétences ajoutées: ${totalSkills}`);
    console.log(`📈 Moyenne: ${withSkills > 0 ? (totalSkills/withSkills).toFixed(1) : 0} compétences/offre`);
    console.log(`⚠️ Erreurs: ${errors}`);
    
    // Vérification finale
    console.log('\n🔍 Vérification finale...');
    const { count: finalCount } = await supabase
      .from('job_offer_skills')
      .select('*', { count: 'exact', head: true });
    
    console.log(`✅ ${finalCount} compétences en base de données`);
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

if (require.main === module) {
  rerunParsing().catch(console.error);
}

module.exports = { rerunParsing };
