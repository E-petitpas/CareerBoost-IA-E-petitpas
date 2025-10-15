require('dotenv').config();
const axios = require('axios');

async function testAdminOffersAPI() {
  console.log('🧪 Test de l\'API admin des offres...');

  try {
    // D'abord, se connecter en tant qu'admin pour obtenir le token
    console.log('1. Connexion admin...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@careerboost.fr',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Connexion réussie, token obtenu');

    // Tester l'API des statistiques
    console.log('2. Test API statistiques...');
    const statsResponse = await axios.get('http://localhost:3001/api/admin/offers/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Statistiques:', statsResponse.data);

    // Tester l'API de récupération des offres
    console.log('3. Test API liste des offres...');
    const offersResponse = await axios.get('http://localhost:3001/api/admin/offers', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        page: 1,
        limit: 20
      }
    });

    console.log('✅ Offres récupérées:', {
      count: offersResponse.data.pagination?.total || 0,
      offersLength: offersResponse.data.data?.length || 0,
      firstOffer: offersResponse.data.data?.[0]?.title || 'aucune'
    });

    if (offersResponse.data.data && offersResponse.data.data.length > 0) {
      console.log('📋 Détails des offres:');
      offersResponse.data.data.forEach((offer, index) => {
        console.log(`${index + 1}. "${offer.title}" - ${offer.companies.name} (${offer.status})`);
      });
    } else {
      console.log('❌ Aucune offre trouvée dans la réponse API');
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Problème d\'authentification - vérifiez les identifiants admin');
    } else if (error.response?.status === 403) {
      console.log('💡 Problème d\'autorisation - vérifiez que l\'utilisateur est bien admin');
    } else if (error.response?.status === 404) {
      console.log('💡 Route non trouvée - vérifiez que le serveur backend est démarré');
    }
  }
}

testAdminOffersAPI()
  .then(() => {
    console.log('🎉 Test terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
