require('dotenv').config();
const { supabase } = require('../config/supabase');

async function updateOffersToPending() {
  console.log('🔄 Mise à jour des offres existantes vers PENDING...');

  try {
    // Mettre toutes les offres ACTIVE en PENDING pour respecter le workflow de validation
    const { data: updatedOffers, error } = await supabase
      .from('job_offers')
      .update({ status: 'PENDING' })
      .eq('status', 'ACTIVE')
      .select('id, title, companies(name)');

    if (error) {
      console.error('❌ Erreur lors de la mise à jour:', error);
      return;
    }

    console.log(`✅ ${updatedOffers.length} offre(s) mise(s) à jour vers PENDING`);
    
    updatedOffers.forEach((offer, index) => {
      console.log(`${index + 1}. "${offer.title}" - ${offer.companies.name}`);
    });

    console.log('');
    console.log('📋 Workflow de validation maintenant actif:');
    console.log('   1. Recruteur publie → Statut PENDING (invisible aux candidats)');
    console.log('   2. Admin valide → Statut ACTIVE (visible aux candidats)');
    console.log('   3. Admin rejette → Statut REJECTED (invisible aux candidats)');

  } catch (error) {
    console.error('💥 Erreur générale:', error);
  }
}

updateOffersToPending()
  .then(() => {
    console.log('🎉 Mise à jour terminée !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
