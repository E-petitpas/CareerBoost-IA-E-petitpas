require('dotenv').config();
const { supabase } = require('../config/supabase');

async function checkLBAOffers() {
  console.log('🔍 Vérification des offres LBA dans la base de données...');
  
  try {
    // Vérifier toutes les offres
    const { data: allOffers, error: allError } = await supabase
      .from('job_offers')
      .select('id, title, source, admin_status, status, created_at')
      .order('created_at', { ascending: false });
      
    if (allError) {
      console.error('❌ Erreur récupération offres:', allError);
      return;
    }
    
    console.log('📊 Total des offres:', allOffers?.length || 0);
    
    // Grouper par source
    const bySource = (allOffers || []).reduce((acc, offer) => {
      acc[offer.source] = (acc[offer.source] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📈 Répartition par source:', bySource);
    
    // Grouper par admin_status
    const byAdminStatus = (allOffers || []).reduce((acc, offer) => {
      acc[offer.admin_status] = (acc[offer.admin_status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('🔐 Répartition par admin_status:', byAdminStatus);
    
    // Vérifier les offres externes spécifiquement
    const { data: externalOffers, error: extError } = await supabase
      .from('job_offers')
      .select('id, title, source, admin_status, status, france_travail_id, created_at')
      .eq('source', 'EXTERNAL')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (extError) {
      console.error('❌ Erreur récupération offres externes:', extError);
      return;
    }
    
    console.log('🌐 Offres externes (10 premières):', externalOffers?.length || 0);
    if (externalOffers && externalOffers.length > 0) {
      externalOffers.forEach(offer => {
        console.log('  -', offer.title, '| Source:', offer.source, '| Admin:', offer.admin_status, '| Status:', offer.status, '| FT_ID:', offer.france_travail_id ? 'OUI' : 'NON');
      });
    } else {
      console.log('❌ Aucune offre externe trouvée !');
    }
    
    // Vérifier les offres avec france_travail_id
    const { data: ftOffers, error: ftError } = await supabase
      .from('job_offers')
      .select('id, title, source, admin_status, status, france_travail_id')
      .not('france_travail_id', 'is', null)
      .limit(5);
      
    if (!ftError && ftOffers) {
      console.log('🇫🇷 Offres avec france_travail_id:', ftOffers.length);
      ftOffers.forEach(offer => {
        console.log('  -', offer.title, '| FT_ID:', offer.france_travail_id);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

checkLBAOffers().then(() => process.exit(0)).catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
