require('dotenv').config();
const { supabase } = require('../config/supabase');

async function checkOffers() {
  console.log('🔍 Vérification des offres dans la base de données...');

  try {
    const { data: offers, error } = await supabase
      .from('job_offers')
      .select(`
        id,
        title,
        status,
        created_at,
        companies (
          name,
          status
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur lors de la récupération des offres:', error);
      return;
    }

    console.log(`📊 Total offres trouvées: ${offers.length}`);
    console.log('');

    if (offers.length === 0) {
      console.log('❌ Aucune offre trouvée dans la base de données');
      console.log('💡 Cela peut signifier que:');
      console.log('   - Aucune offre n\'a été créée');
      console.log('   - Il y a un problème avec la création d\'offres');
      console.log('   - Les offres sont dans une autre table');
    } else {
      console.log('📋 Liste des offres:');
      offers.forEach((offer, index) => {
        console.log(`${index + 1}. "${offer.title}"`);
        console.log(`   Entreprise: ${offer.companies.name} (${offer.companies.status})`);
        console.log(`   Statut offre: ${offer.status}`);
        console.log(`   Créée le: ${new Date(offer.created_at).toLocaleDateString('fr-FR')}`);
        console.log(`   ID: ${offer.id}`);
        console.log('');
      });
    }

    // Vérifier aussi les entreprises
    console.log('🏢 Vérification des entreprises...');
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('id, name, status')
      .order('created_at', { ascending: false });

    if (compError) {
      console.error('❌ Erreur lors de la récupération des entreprises:', compError);
    } else {
      console.log(`📊 Total entreprises: ${companies.length}`);
      companies.forEach((company, index) => {
        console.log(`${index + 1}. ${company.name} (${company.status})`);
      });
    }

  } catch (error) {
    console.error('💥 Erreur générale:', error);
  }
}

checkOffers()
  .then(() => {
    console.log('🎉 Vérification terminée !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
