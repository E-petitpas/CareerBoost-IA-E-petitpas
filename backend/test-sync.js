// Charger les variables d'environnement
require('dotenv').config();

const offerAggregationService = require('./src/services/offerAggregationService');

async function testSync() {
  console.log('🧪 Test de synchronisation France Travail');
  console.log('==========================================');
  
  try {
    console.log('⚠️  Démarrage de la synchronisation (cela peut prendre du temps)...');
    const result = await offerAggregationService.manualSync();
    console.log('✅ Synchronisation terminée:', result);
  } catch (error) {
    console.error('❌ Erreur synchronisation:', error.message);
  }
}

testSync();
