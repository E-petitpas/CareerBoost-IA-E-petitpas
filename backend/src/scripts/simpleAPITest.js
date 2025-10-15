require('dotenv').config();
const { supabase } = require('../config/supabase');

async function simpleAPITest() {
  console.log('🧪 Test simple de l\'API...');

  try {
    // Test direct de la base de données
    console.log('1. Test direct base de données...');
    const { data: offers, error } = await supabase
      .from('job_offers')
      .select(`
        id,
        title,
        status,
        companies (
          name
        )
      `)
      .limit(5);

    if (error) {
      console.error('❌ Erreur base de données:', error);
      return;
    }

    console.log(`✅ ${offers.length} offre(s) trouvée(s) dans la base:`);
    offers.forEach((offer, index) => {
      console.log(`${index + 1}. "${offer.title}" - ${offer.companies.name} (${offer.status})`);
    });

    // Test de l'API admin
    console.log('\n2. Test de l\'endpoint admin...');
    
    // Simuler une requête HTTP
    const http = require('http');
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/admin/offers/stats',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: Il faudrait un vrai token JWT ici
        'Authorization': 'Bearer fake-token-for-test'
      }
    };

    const req = http.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Réponse:', data);
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erreur requête HTTP:', error.message);
    });

    req.end();

  } catch (error) {
    console.error('💥 Erreur générale:', error);
  }
}

simpleAPITest()
  .then(() => {
    console.log('\n🎉 Test terminé !');
    setTimeout(() => process.exit(0), 1000); // Attendre 1 seconde pour la requête HTTP
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
