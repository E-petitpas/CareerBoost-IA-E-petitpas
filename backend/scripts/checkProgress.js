require('dotenv').config();
const { supabase } = require('../src/config/supabase');

async function checkProgress() {
  console.log('🔍 Vérification du progrès du parsing...\n');
  
  try {
    // Compter le total d'offres
    const { count: totalOffers } = await supabase
      .from('job_offers')
      .select('*', { count: 'exact', head: true });
    
    // Compter les offres avec compétences
    const { count: offersWithSkills } = await supabase
      .from('job_offer_skills')
      .select('offer_id', { count: 'exact', head: true });
    
    // Compter les offres uniques avec compétences
    const { data: uniqueOffers } = await supabase
      .from('job_offer_skills')
      .select('offer_id');

    const uniqueOfferIds = uniqueOffers ? [...new Set(uniqueOffers.map(o => o.offer_id))] : [];
    const uniqueOffersCount = uniqueOfferIds.length;
    
    // Compter le total de compétences ajoutées
    const { count: totalSkills } = await supabase
      .from('job_offer_skills')
      .select('*', { count: 'exact', head: true });
    
    // Statistiques par catégorie
    const { data: skillsWithCategory } = await supabase
      .from('job_offer_skills')
      .select(`
        skills!inner(category)
      `);

    const skillsByCategory = skillsWithCategory ?
      skillsWithCategory.reduce((acc, item) => {
        const category = item.skills.category;
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {}) : {};
    
    console.log('📊 **PROGRÈS DU PARSING**');
    console.log('========================');
    console.log(`📈 Offres totales: ${totalOffers}`);
    console.log(`✅ Offres avec compétences: ${uniqueOffersCount} (${((uniqueOffersCount/totalOffers)*100).toFixed(1)}%)`);
    console.log(`❌ Offres sans compétences: ${totalOffers - uniqueOffersCount} (${(((totalOffers - uniqueOffersCount)/totalOffers)*100).toFixed(1)}%)`);
    console.log(`🎯 Total compétences ajoutées: ${totalSkills}`);
    console.log(`📊 Moyenne compétences/offre: ${(totalSkills/uniqueOffersCount).toFixed(1)}`);
    
    console.log('\n🏷️ **RÉPARTITION PAR CATÉGORIE**');
    if (skillsByCategory && Object.keys(skillsByCategory).length > 0) {
      Object.entries(skillsByCategory)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, count]) => {
          console.log(`   ${category}: ${count} compétences`);
        });
    }
    
    // Dernières offres traitées
    const { data: recentOffers } = await supabase
      .from('job_offer_skills')
      .select(`
        job_offers!inner(title, created_at),
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recentOffers && recentOffers.length > 0) {
      console.log('\n🕒 **DERNIÈRES OFFRES TRAITÉES**');
      recentOffers.forEach(offer => {
        const time = new Date(offer.created_at).toLocaleTimeString('fr-FR');
        console.log(`   ${time} - "${offer.job_offers.title}"`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

if (require.main === module) {
  checkProgress();
}

module.exports = { checkProgress };
