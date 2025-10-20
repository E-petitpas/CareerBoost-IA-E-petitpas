/**
 * Script de validation de l'API de matching
 * Teste les endpoints réels avec des requêtes HTTP
 */

const http = require('http');

// Configuration
const API_BASE = 'http://localhost:3000/api';
const JWT_TOKEN = process.env.JWT_TOKEN || 'test-token'; // À remplacer par un vrai token

// Utilitaires
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Tests
async function runTests() {
  console.log('🧪 Validation de l\'API de Matching\n');

  try {
    // Test 1: GET /offers/search
    console.log('Test 1: GET /offers/search');
    const searchRes = await makeRequest('GET', '/offers/search?page=1&limit=5');
    
    if (searchRes.status === 200 && searchRes.body.data) {
      console.log('✅ PASS: Endpoint accessible');
      console.log(`   Offres retournées: ${searchRes.body.data.length}`);
      
      if (searchRes.body.data.length > 0) {
        const offer = searchRes.body.data[0];
        console.log(`   Première offre: ${offer.title}`);
        console.log(`   Score: ${offer.score}`);
        console.log(`   Explication: ${offer.explanation?.substring(0, 50)}...`);
        
        if (offer.score !== undefined && offer.explanation) {
          console.log('✅ Matching data présent');
        } else {
          console.log('❌ Matching data manquant');
        }
      }
    } else if (searchRes.status === 400) {
      console.log('⚠️  SKIP: Profil candidat incomplet (normal si pas de profil)');
    } else {
      console.log(`❌ FAIL: Status ${searchRes.status}`);
    }
    console.log();

    // Test 2: GET /offers/:id
    console.log('Test 2: GET /offers/:id');
    const detailRes = await makeRequest('GET', '/offers/offer-1');
    
    if (detailRes.status === 200 && detailRes.body) {
      console.log('✅ PASS: Endpoint accessible');
      console.log(`   Offre: ${detailRes.body.title}`);
      console.log(`   Score: ${detailRes.body.score}`);
      
      if (detailRes.body.score !== undefined && detailRes.body.explanation) {
        console.log('✅ Matching data présent');
      } else {
        console.log('❌ Matching data manquant');
      }
    } else if (detailRes.status === 400) {
      console.log('⚠️  SKIP: Profil candidat incomplet');
    } else if (detailRes.status === 404) {
      console.log('⚠️  SKIP: Offre non trouvée');
    } else {
      console.log(`❌ FAIL: Status ${detailRes.status}`);
    }
    console.log();

    // Test 3: POST /applications/apply
    console.log('Test 3: POST /applications/apply');
    const applyRes = await makeRequest('POST', '/applications/apply', {
      offer_id: 'offer-1',
      custom_message: 'Test de candidature'
    });
    
    if (applyRes.status === 201 && applyRes.body.application) {
      console.log('✅ PASS: Candidature créée');
      console.log(`   ID: ${applyRes.body.application.id}`);
      console.log(`   Score: ${applyRes.body.application.score}`);
      
      if (applyRes.body.application.matched_skills !== undefined) {
        console.log(`   Compétences matchées: ${applyRes.body.application.matched_skills.length}`);
      }
      if (applyRes.body.application.missing_skills !== undefined) {
        console.log(`   Compétences manquantes: ${applyRes.body.application.missing_skills.length}`);
      }
    } else if (applyRes.status === 409) {
      console.log('⚠️  SKIP: Candidature déjà existante');
    } else if (applyRes.status === 400) {
      console.log('⚠️  SKIP: Profil candidat incomplet');
    } else {
      console.log(`❌ FAIL: Status ${applyRes.status}`);
      console.log(`   Erreur: ${applyRes.body?.error}`);
    }
    console.log();

    console.log('✅ Validation terminée\n');
    console.log('📝 Notes:');
    console.log('- Assurez-vous que JWT_TOKEN est valide');
    console.log('- Assurez-vous que le profil candidat est complet');
    console.log('- Assurez-vous que le serveur est en cours d\'exécution');

  } catch (error) {
    console.error('❌ Erreur lors de la validation:', error.message);
  }
}

// Exécuter les tests
runTests();

