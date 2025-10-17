/**
 * Script de test du flux complet
 * Teste: Création entreprise → Validation → Notification
 */

const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`)
};

let recruiterToken = '';
let adminToken = '';
let companyId = '';

async function testFlow() {
  try {
    log.info('=== Début du test du flux complet ===\n');

    // 1. Inscription recruteur
    log.info('1. Inscription du recruteur...');
    const recruiterRes = await axios.post(`${API_URL}/auth/register`, {
      role: 'RECRUITER',
      name: 'Test Recruiter',
      email: `recruiter-${Date.now()}@test.com`,
      password: 'TestPassword123!',
      companyName: 'Test Company',
      companySiren: '123456789'
    });

    if (recruiterRes.data.success) {
      recruiterToken = recruiterRes.data.token;
      log.success('Recruteur inscrit avec succès');
      log.info(`Email: ${recruiterRes.data.user.email}`);
    } else {
      throw new Error('Erreur inscription recruteur');
    }

    // 2. Inscription admin
    log.info('\n2. Inscription de l\'admin...');
    const adminRes = await axios.post(`${API_URL}/auth/register`, {
      role: 'ADMIN',
      name: 'Test Admin',
      email: `admin-${Date.now()}@test.com`,
      password: 'AdminPassword123!'
    });

    if (adminRes.data.success) {
      adminToken = adminRes.data.token;
      log.success('Admin inscrit avec succès');
    } else {
      throw new Error('Erreur inscription admin');
    }

    // 3. Récupérer les entreprises en attente
    log.info('\n3. Récupération des entreprises en attente...');
    const companiesRes = await axios.get(`${API_URL}/admin/companies/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (companiesRes.data.success && companiesRes.data.data.length > 0) {
      companyId = companiesRes.data.data[0].id;
      log.success(`Entreprise trouvée: ${companiesRes.data.data[0].name}`);
      log.info(`ID: ${companyId}`);
      log.info(`Statut: ${companiesRes.data.data[0].status}`);
    } else {
      throw new Error('Aucune entreprise en attente');
    }

    // 4. Approuver l'entreprise
    log.info('\n4. Approbation de l\'entreprise...');
    const approveRes = await axios.patch(
      `${API_URL}/admin/companies/${companyId}/approve`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    if (approveRes.data.success) {
      log.success('Entreprise approuvée avec succès');
      log.info(`Nouveau statut: ${approveRes.data.data.status}`);
    } else {
      throw new Error('Erreur approbation');
    }

    // 5. Vérifier le statut
    log.info('\n5. Vérification du statut...');
    const statusRes = await axios.get(
      `${API_URL}/companies/${companyId}/status`,
      { headers: { Authorization: `Bearer ${recruiterToken}` } }
    );

    if (statusRes.data.success) {
      log.success('Statut récupéré');
      log.info(`Statut: ${statusRes.data.data.status}`);
    } else {
      throw new Error('Erreur récupération statut');
    }

    // 6. Tester le rejet
    log.info('\n6. Test du rejet d\'une entreprise...');
    
    // Créer une nouvelle entreprise
    const recruiter2Res = await axios.post(`${API_URL}/auth/register`, {
      role: 'RECRUITER',
      name: 'Test Recruiter 2',
      email: `recruiter2-${Date.now()}@test.com`,
      password: 'TestPassword123!',
      companyName: 'Test Company 2',
      companySiren: '987654321'
    });

    const companies2Res = await axios.get(`${API_URL}/admin/companies/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (companies2Res.data.data.length > 0) {
      const company2Id = companies2Res.data.data[0].id;
      
      const rejectRes = await axios.patch(
        `${API_URL}/admin/companies/${company2Id}/reject`,
        { reason: 'Informations incomplètes' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (rejectRes.data.success) {
        log.success('Entreprise rejetée avec succès');
        log.info(`Nouveau statut: ${rejectRes.data.data.status}`);
      } else {
        throw new Error('Erreur rejet');
      }
    }

    log.info('\n=== Test du flux complet réussi! ===\n');
    log.success('Tous les tests sont passés');

  } catch (error) {
    log.error(`Erreur: ${error.message}`);
    if (error.response?.data) {
      log.error(`Détails: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    process.exit(1);
  }
}

// Lancer le test
testFlow();

