// Charger les variables d'environnement
require('dotenv').config();

const franceTravailService = require('../services/franceTravailService');
const offerAggregationService = require('../services/offerAggregationService');
const { supabase } = require('../config/supabase');

async function testFranceTravailIntegration() {
  console.log('🧪 Test de l\'intégration France Travail');
  console.log('=====================================\n');

  try {
    // Test 1: Vérification de la configuration
    console.log('1️⃣ Test de la configuration...');
    if (!process.env.FRANCE_TRAVAIL_CLIENT_ID || !process.env.FRANCE_TRAVAIL_CLIENT_SECRET) {
      throw new Error('Variables d\'environnement France Travail manquantes');
    }
    console.log('✅ Configuration OK\n');

    // Test 2: Test de l'authentification
    console.log('2️⃣ Test de l\'authentification...');
    try {
      const token = await franceTravailService.getAccessToken();
      console.log('✅ Token d\'accès obtenu:', token.substring(0, 20) + '...\n');
    } catch (error) {
      console.error('❌ Erreur d\'authentification:', error.message);
      return;
    }

    // Test 3: Test de recherche d'offres
    console.log('3️⃣ Test de recherche d\'offres...');
    try {
      const searchResult = await franceTravailService.searchOffers({
        domaine: 'M18', // Informatique
        range: '0-4' // Seulement 5 offres pour le test
      });
      
      console.log(`✅ ${searchResult.resultats?.length || 0} offres trouvées`);
      
      if (searchResult.resultats && searchResult.resultats.length > 0) {
        const firstOffer = searchResult.resultats[0];
        console.log(`   Exemple: "${firstOffer.intitule}" - ${firstOffer.entreprise?.nom || 'Entreprise inconnue'}`);
      }
      console.log('');
    } catch (error) {
      console.error('❌ Erreur de recherche:', error.message);
      return;
    }

    // Test 4: Test de normalisation
    console.log('4️⃣ Test de normalisation d\'offre...');
    try {
      const searchResult = await franceTravailService.searchOffers({
        domaine: 'M18',
        range: '0-0' // Une seule offre
      });
      
      if (searchResult.resultats && searchResult.resultats.length > 0) {
        const rawOffer = searchResult.resultats[0];
        const normalizedOffer = franceTravailService.normalizeOffer(rawOffer);
        
        console.log('✅ Offre normalisée:');
        console.log(`   Titre: ${normalizedOffer.title}`);
        console.log(`   Ville: ${normalizedOffer.city || 'Non spécifiée'}`);
        console.log(`   Type contrat: ${normalizedOffer.contract_type}`);
        console.log(`   Source: ${normalizedOffer.source}`);
        console.log(`   Statut admin: ${normalizedOffer.admin_status}`);
        console.log('');
      }
    } catch (error) {
      console.error('❌ Erreur de normalisation:', error.message);
      return;
    }

    // Test 5: Test de création d'entreprise France Travail
    console.log('5️⃣ Test de création d\'entreprise France Travail...');
    try {
      const companyId = await franceTravailService.getOrCreateFranceTravailCompany();
      console.log('✅ Entreprise France Travail créée/trouvée:', companyId);
      console.log('');
    } catch (error) {
      console.error('❌ Erreur création entreprise:', error.message);
      return;
    }

    // Test 6: Test de la base de données
    console.log('6️⃣ Test de la base de données...');
    try {
      // Vérifier que les colonnes France Travail existent
      const { data: testOffer, error } = await supabase
        .from('job_offers')
        .select('id, france_travail_id, france_travail_data, admin_status')
        .limit(1);

      if (error) {
        console.error('❌ Erreur base de données:', error.message);
        console.log('💡 Exécutez la migration: backend/migrations/add_france_travail_integration.sql');
        return;
      }

      console.log('✅ Structure de base de données OK');
      console.log('');
    } catch (error) {
      console.error('❌ Erreur base de données:', error.message);
      return;
    }

    // Test 7: Test du statut du service d'agrégation
    console.log('7️⃣ Test du service d\'agrégation...');
    try {
      const status = offerAggregationService.getStatus();
      console.log('✅ Statut du service d\'agrégation:');
      console.log(`   Activé: ${status.enabled}`);
      console.log(`   En cours: ${status.isRunning}`);
      console.log(`   Intervalle: ${status.syncIntervalHours}h`);
      console.log(`   Max par sync: ${status.maxOffersPerSync}`);
      console.log('');
    } catch (error) {
      console.error('❌ Erreur service d\'agrégation:', error.message);
      return;
    }

    // Test 8: Test de synchronisation (optionnel)
    if (process.argv.includes('--sync')) {
      console.log('8️⃣ Test de synchronisation complète...');
      try {
        console.log('⚠️  Démarrage de la synchronisation (cela peut prendre du temps)...');
        const result = await offerAggregationService.manualSync();
        console.log('✅ Synchronisation terminée:', result);
        console.log('');
      } catch (error) {
        console.error('❌ Erreur synchronisation:', error.message);
        return;
      }
    } else {
      console.log('8️⃣ Test de synchronisation ignoré (utilisez --sync pour l\'activer)\n');
    }

    // Résumé
    console.log('🎉 TOUS LES TESTS SONT PASSÉS !');
    console.log('=====================================');
    console.log('✅ L\'intégration France Travail est fonctionnelle');
    console.log('');
    console.log('📋 Prochaines étapes:');
    console.log('1. Exécuter la migration SQL si ce n\'est pas fait');
    console.log('2. Configurer les variables d\'environnement en production');
    console.log('3. Activer la synchronisation automatique (FRANCE_TRAVAIL_SYNC_ENABLED=true)');
    console.log('4. Tester l\'interface admin sur /admin/france-travail');
    console.log('');

  } catch (error) {
    console.error('💥 ERREUR CRITIQUE:', error.message);
    console.log('\n📋 Vérifications à effectuer:');
    console.log('1. Variables d\'environnement FRANCE_TRAVAIL_CLIENT_ID et FRANCE_TRAVAIL_CLIENT_SECRET');
    console.log('2. Connexion internet pour accéder à l\'API France Travail');
    console.log('3. Migration SQL exécutée');
    console.log('4. Configuration Supabase correcte');
    process.exit(1);
  }
}

// Fonction utilitaire pour afficher l'aide
function showHelp() {
  console.log('🧪 Script de test de l\'intégration France Travail');
  console.log('');
  console.log('Usage:');
  console.log('  node testFranceTravailIntegration.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --sync    Effectuer une synchronisation complète (optionnel)');
  console.log('  --help    Afficher cette aide');
  console.log('');
  console.log('Exemples:');
  console.log('  node testFranceTravailIntegration.js');
  console.log('  node testFranceTravailIntegration.js --sync');
}

// Point d'entrée
if (process.argv.includes('--help')) {
  showHelp();
} else {
  testFranceTravailIntegration();
}
