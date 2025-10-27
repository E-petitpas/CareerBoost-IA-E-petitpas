/**
 * Tests du système de matching
 * Valide que le calcul du score de matching fonctionne correctement
 */

const { MatchingService } = require('../services/matchingService');

const matchingService = new MatchingService();

// Données de test
const mockCandidate = {
  users: {
    id: 'candidate-1',
    name: 'Jean Dupont',
    city: 'Paris',
    latitude: 48.8566,
    longitude: 2.3522
  },
  experience_years: 3,
  mobility_km: 50,
  preferred_contracts: ['CDI', 'CDD'],
  candidate_skills: [
    {
      skills: { id: 'skill-1', slug: 'react', display_name: 'React' },
      proficiency_level: 3
    },
    {
      skills: { id: 'skill-2', slug: 'nodejs', display_name: 'Node.js' },
      proficiency_level: 3
    },
    {
      skills: { id: 'skill-3', slug: 'postgresql', display_name: 'PostgreSQL' },
      proficiency_level: 2
    }
  ]
};

const mockOfferGood = {
  id: 'offer-1',
  title: 'Développeur Full Stack React/Node.js',
  city: 'Paris',
  latitude: 48.8566,
  longitude: 2.3522,
  contract_type: 'CDI',
  experience_min: 2,
  salary_min: 45000,
  salary_max: 65000,
  companies: { id: 'company-1', name: 'TechCorp', sector: 'Technologie' },
  job_offer_skills: [
    {
      skills: { id: 'skill-1', slug: 'react', display_name: 'React' },
      is_required: true
    },
    {
      skills: { id: 'skill-2', slug: 'nodejs', display_name: 'Node.js' },
      is_required: true
    },
    {
      skills: { id: 'skill-3', slug: 'postgresql', display_name: 'PostgreSQL' },
      is_required: false
    }
  ]
};

const mockOfferBad = {
  id: 'offer-2',
  title: 'Développeur Python/Django',
  city: 'Lyon',
  latitude: 45.7640,
  longitude: 4.8357,
  contract_type: 'STAGE',
  experience_min: 5,
  salary_min: 30000,
  salary_max: 40000,
  companies: { id: 'company-2', name: 'DataCorp', sector: 'Data' },
  job_offer_skills: [
    {
      skills: { id: 'skill-4', slug: 'python', display_name: 'Python' },
      is_required: true
    },
    {
      skills: { id: 'skill-5', slug: 'django', display_name: 'Django' },
      is_required: true
    },
    {
      skills: { id: 'skill-6', slug: 'docker', display_name: 'Docker' },
      is_required: true
    }
  ]
};

// Tests
async function runTests() {
  console.log('🧪 Démarrage des tests du matching\n');

  try {
    // Test 1: Cohérence des scores
    console.log('Test 1: Cohérence des scores');
    const result1a = await matchingService.calculateMatchingScore(mockCandidate, mockOfferGood);
    const result1b = await matchingService.calculateMatchingScore(mockCandidate, mockOfferGood);
    
    if (result1a.score === result1b.score) {
      console.log('✅ PASS: Scores cohérents');
      console.log(`   Score: ${result1a.score}`);
    } else {
      console.log('❌ FAIL: Scores différents');
      console.log(`   Run 1: ${result1a.score}, Run 2: ${result1b.score}`);
    }
    console.log();

    // Test 2: Offre avec bon matching
    console.log('Test 2: Offre avec bon matching');
    const result2 = await matchingService.calculateMatchingScore(mockCandidate, mockOfferGood);
    
    if (result2.score > 60) {
      console.log('✅ PASS: Score élevé pour bon matching');
      console.log(`   Score: ${result2.score}`);
      console.log(`   Compétences matchées: ${result2.matchedSkills.length}`);
      console.log(`   Compétences manquantes: ${result2.missingSkills.length}`);
      console.log(`   Explication: ${result2.explanation}`);
    } else {
      console.log('❌ FAIL: Score trop bas');
      console.log(`   Score: ${result2.score}`);
    }
    console.log();

    // Test 3: Offre avec mauvais matching
    console.log('Test 3: Offre avec mauvais matching');
    const result3 = await matchingService.calculateMatchingScore(mockCandidate, mockOfferBad);
    
    if (result3.score < 40) {
      console.log('✅ PASS: Score bas pour mauvais matching');
      console.log(`   Score: ${result3.score}`);
      console.log(`   Raison: ${result3.explanation}`);
    } else {
      console.log('❌ FAIL: Score trop élevé');
      console.log(`   Score: ${result3.score}`);
    }
    console.log();

    // Test 4: Filtres durs - Type de contrat
    console.log('Test 4: Filtres durs - Type de contrat incompatible');
    const candidateNoCDD = {
      ...mockCandidate,
      preferred_contracts: ['CDI']  // Refuse CDD
    };
    const offerCDD = {
      ...mockOfferGood,
      contract_type: 'CDD'
    };
    const result4 = await matchingService.calculateMatchingScore(candidateNoCDD, offerCDD);
    
    if (result4.score === 0) {
      console.log('✅ PASS: Score 0 pour contrat incompatible');
      console.log(`   Explication: ${result4.explanation}`);
    } else {
      console.log('❌ FAIL: Score non nul');
      console.log(`   Score: ${result4.score}`);
    }
    console.log();

    // Test 5: Distance hors rayon
    console.log('Test 5: Distance hors rayon');
    const candidateParis = {
      ...mockCandidate,
      mobility_km: 10  // Rayon 10km
    };
    const offerLyon = {
      ...mockOfferGood,
      city: 'Lyon',
      latitude: 45.7640,
      longitude: 4.8357  // ~390km de Paris
    };
    const result5 = await matchingService.calculateMatchingScore(candidateParis, offerLyon);
    
    if (result5.score < 30) {
      console.log('✅ PASS: Score très bas pour distance excessive');
      console.log(`   Score: ${result5.score}`);
      console.log(`   Distance: ${Math.round(result5.distanceKm)} km`);
      console.log(`   Explication: ${result5.explanation}`);
    } else {
      console.log('❌ FAIL: Score trop élevé');
      console.log(`   Score: ${result5.score}`);
    }
    console.log();

    // Test 6: Compétences manquantes
    console.log('Test 6: Compétences manquantes');
    const result6 = await matchingService.calculateMatchingScore(mockCandidate, mockOfferBad);
    
    if (result6.missingSkills.length > 0) {
      console.log('✅ PASS: Compétences manquantes détectées');
      console.log(`   Manquantes: ${result6.missingSkills.map(s => s.skill).join(', ')}`);
    } else {
      console.log('❌ FAIL: Pas de compétences manquantes détectées');
    }
    console.log();

    // Test 7: Expérience suffisante
    console.log('Test 7: Expérience suffisante');
    const result7 = await matchingService.calculateMatchingScore(mockCandidate, mockOfferGood);
    
    if (result7.score > 50) {
      console.log('✅ PASS: Bonus pour expérience suffisante');
      console.log(`   Score: ${result7.score}`);
    } else {
      console.log('❌ FAIL: Score trop bas');
      console.log(`   Score: ${result7.score}`);
    }
    console.log();

    // Test 8: Traçabilité - Hash des inputs
    console.log('Test 8: Traçabilité - Hash des inputs');
    const result8 = await matchingService.calculateMatchingScore(mockCandidate, mockOfferGood);
    
    if (result8.inputsHash && result8.inputsHash.length === 32) {
      console.log('✅ PASS: Hash des inputs généré');
      console.log(`   Hash: ${result8.inputsHash}`);
    } else {
      console.log('❌ FAIL: Hash invalide');
      console.log(`   Hash: ${result8.inputsHash}`);
    }
    console.log();

    console.log('✅ Tests terminés\n');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
}

// Exécuter les tests
runTests();

