/**
 * Script pour parser automatiquement les compétences des offres existantes
 */

const { createClient } = require('@supabase/supabase-js');
const skillsParsingService = require('../src/services/skillsParsingService');

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function parseAllOfferSkills() {
  console.log('🚀 Début du parsing des compétences des offres...');
  
  try {
    // Récupérer toutes les offres actives sans compétences
    const { data: offers, error } = await supabase
      .from('job_offers')
      .select(`
        id,
        title,
        description,
        job_offer_skills (id)
      `)
      .eq('status', 'ACTIVE');
    
    if (error) {
      console.error('Erreur récupération offres:', error);
      return;
    }
    
    console.log(`📊 ${offers.length} offres trouvées`);
    
    let processedCount = 0;
    let skillsAddedCount = 0;
    
    for (const offer of offers) {
      // Vérifier si l'offre a déjà des compétences
      const hasSkills = offer.job_offer_skills && offer.job_offer_skills.length > 0;
      
      if (hasSkills) {
        console.log(`⏭️ Offre "${offer.title}" a déjà des compétences, ignorée`);
        continue;
      }
      
      console.log(`\n🔍 Parsing offre: "${offer.title}"`);
      
      // Parser les compétences depuis la description
      const parsedSkills = skillsParsingService.parseSkillsFromDescription(
        offer.description || '',
        offer.title || ''
      );
      
      if (parsedSkills.length === 0) {
        console.log(`   ❌ Aucune compétence trouvée`);
        continue;
      }
      
      console.log(`   📋 ${parsedSkills.length} compétences parsées:`, 
        parsedSkills.map(s => `${s.display_name}${s.is_required ? ' (requis)' : ''}`).join(', ')
      );
      
      // Associer aux compétences de la base de données
      const matchedSkills = await skillsParsingService.matchSkillsToDatabase(parsedSkills, supabase);
      
      if (matchedSkills.length === 0) {
        console.log(`   ❌ Aucune compétence matchée en base`);
        continue;
      }
      
      console.log(`   ✅ ${matchedSkills.length} compétences matchées en base`);
      
      // Mettre à jour l'offre avec les compétences
      await skillsParsingService.updateOfferSkills(offer.id, matchedSkills, supabase);
      
      processedCount++;
      skillsAddedCount += matchedSkills.length;
      
      // Pause pour éviter de surcharger la base
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n🎉 Parsing terminé !`);
    console.log(`📊 Statistiques:`);
    console.log(`   - Offres traitées: ${processedCount}`);
    console.log(`   - Compétences ajoutées: ${skillsAddedCount}`);
    console.log(`   - Moyenne: ${processedCount > 0 ? (skillsAddedCount / processedCount).toFixed(1) : 0} compétences/offre`);
    
  } catch (error) {
    console.error('Erreur lors du parsing:', error);
  }
}

// Fonction pour parser une offre spécifique (pour les tests)
async function parseSpecificOffer(offerId) {
  console.log(`🔍 Parsing de l'offre ${offerId}...`);
  
  try {
    const { data: offer, error } = await supabase
      .from('job_offers')
      .select('id, title, description')
      .eq('id', offerId)
      .single();
    
    if (error || !offer) {
      console.error('Offre non trouvée:', error);
      return;
    }
    
    console.log(`📄 Offre: "${offer.title}"`);
    console.log(`📝 Description (extrait):`, offer.description?.substring(0, 200) + '...');
    
    const parsedSkills = skillsParsingService.parseSkillsFromDescription(
      offer.description || '',
      offer.title || ''
    );
    
    console.log(`\n📋 Compétences parsées (${parsedSkills.length}):`);
    parsedSkills.forEach(skill => {
      console.log(`   - ${skill.display_name} (${skill.slug}) - ${skill.is_required ? 'REQUIS' : 'Optionnel'} - Poids: ${skill.weight}`);
    });
    
    const matchedSkills = await skillsParsingService.matchSkillsToDatabase(parsedSkills, supabase);
    
    console.log(`\n✅ Compétences matchées en base (${matchedSkills.length}):`);
    matchedSkills.forEach(skill => {
      console.log(`   - ${skill.skills.display_name} - ${skill.is_required ? 'REQUIS' : 'Optionnel'}`);
    });
    
    // Demander confirmation avant mise à jour
    console.log(`\n❓ Voulez-vous mettre à jour cette offre avec ces compétences ? (y/N)`);
    
    // En mode script, on met à jour automatiquement
    if (process.argv.includes('--auto')) {
      await skillsParsingService.updateOfferSkills(offer.id, matchedSkills, supabase);
      console.log(`✅ Offre mise à jour avec ${matchedSkills.length} compétences`);
    }
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

// Exécution du script
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
Usage:
  node parseOfferSkills.js                    # Parser toutes les offres
  node parseOfferSkills.js --offer <id>       # Parser une offre spécifique
  node parseOfferSkills.js --offer <id> --auto # Parser et mettre à jour automatiquement
    `);
    return;
  }
  
  const offerIdIndex = args.indexOf('--offer');
  if (offerIdIndex !== -1 && args[offerIdIndex + 1]) {
    const offerId = args[offerIdIndex + 1];
    await parseSpecificOffer(offerId);
  } else {
    await parseAllOfferSkills();
  }
  
  process.exit(0);
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { parseAllOfferSkills, parseSpecificOffer };
