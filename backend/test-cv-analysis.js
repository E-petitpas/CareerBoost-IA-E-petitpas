require('dotenv').config();

const textExtractionService = require('./src/services/textExtractionService');
const cvAnalysisService = require('./src/services/cvAnalysisService');
const path = require('path');
const fs = require('fs');

/**
 * Script de test pour la fonctionnalité d'analyse de CV
 */

async function testTextExtraction() {
  console.log('🧪 Test d\'extraction de texte...');
  
  // Test avec un fichier PDF fictif (vous devrez créer un vrai fichier pour tester)
  const testFilePath = path.join(__dirname, 'test-cv.pdf');
  
  if (!fs.existsSync(testFilePath)) {
    console.log('⚠️ Fichier de test non trouvé. Créez un fichier test-cv.pdf pour tester l\'extraction.');
    return false;
  }
  
  try {
    const extractedText = await textExtractionService.extractText(testFilePath, 'application/pdf');
    console.log('✅ Extraction réussie:', extractedText.substring(0, 200) + '...');
    
    const stats = textExtractionService.getTextStats(extractedText);
    console.log('📊 Statistiques:', stats);
    
    return extractedText;
  } catch (error) {
    console.error('❌ Erreur extraction:', error.message);
    return false;
  }
}

async function testCVAnalysis() {
  console.log('🤖 Test d\'analyse IA...');
  
  const sampleCVText = `
    Jean Dupont
    Développeur Full Stack
    Email: jean.dupont@email.com
    Téléphone: 06 12 34 56 78
    Paris, France
    
    RÉSUMÉ PROFESSIONNEL
    Développeur passionné avec 5 ans d'expérience dans le développement web moderne.
    Spécialisé en React, Node.js et bases de données relationnelles.
    
    COMPÉTENCES
    - JavaScript (Expert)
    - React (Avancé)
    - Node.js (Avancé)
    - PostgreSQL (Intermédiaire)
    - Docker (Intermédiaire)
    - Communication (Avancé)
    - Gestion de projet (Intermédiaire)
    
    EXPÉRIENCE PROFESSIONNELLE
    
    Développeur Senior - TechCorp (2021 - En cours)
    • Développement d'applications web avec React et Node.js
    • Encadrement d'une équipe de 3 développeurs juniors
    • Mise en place de l'architecture microservices
    
    Développeur Full Stack - StartupXYZ (2019 - 2021)
    • Création d'une plateforme e-commerce complète
    • Intégration d'APIs tierces (Stripe, PayPal)
    • Optimisation des performances et SEO
    
    FORMATION
    
    Master en Informatique - École Supérieure d'Informatique (2017 - 2019)
    Spécialisation en développement web et bases de données
    
    Licence en Informatique - Université Paris Tech (2014 - 2017)
    Formation générale en informatique et mathématiques
  `;
  
  try {
    const analysisResult = await cvAnalysisService.analyzeCVContent(sampleCVText);
    console.log('✅ Analyse réussie:');
    console.log('👤 Infos personnelles:', analysisResult.personal_info);
    console.log('💼 Expérience:', analysisResult.experience_years, 'années');
    console.log('🎯 Compétences:', analysisResult.skills.length);
    console.log('🏢 Expériences:', analysisResult.experiences.length);
    console.log('🎓 Formations:', analysisResult.educations.length);
    
    return analysisResult;
  } catch (error) {
    console.error('❌ Erreur analyse:', error.message);
    return false;
  }
}

async function testValidation() {
  console.log('🔍 Test de validation...');
  
  const { isValidMimeType, isValidFileSize } = require('./src/middleware/uploadValidation');
  
  // Test types MIME
  console.log('PDF valide:', isValidMimeType('application/pdf', 'CV'));
  console.log('DOC valide:', isValidMimeType('application/msword', 'CV'));
  console.log('DOCX valide:', isValidMimeType('application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'CV'));
  console.log('JPG invalide:', isValidMimeType('image/jpeg', 'CV'));
  
  // Test tailles
  console.log('5MB valide:', isValidFileSize(5 * 1024 * 1024, 'CV'));
  console.log('15MB invalide:', isValidFileSize(15 * 1024 * 1024, 'CV'));
  
  return true;
}

async function testDatabaseConnection() {
  console.log('🗄️ Test de connexion base de données...');
  
  try {
    const { supabase } = require('./src/config/supabase');
    
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erreur DB:', error.message);
      return false;
    }
    
    console.log('✅ Connexion DB réussie');
    return true;
  } catch (error) {
    console.error('❌ Erreur connexion DB:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Démarrage des tests de la fonctionnalité CV Analysis...\n');
  
  const results = {
    validation: await testValidation(),
    database: await testDatabaseConnection(),
    textExtraction: await testTextExtraction(),
    cvAnalysis: await testCVAnalysis()
  };
  
  console.log('\n📋 Résultats des tests:');
  console.log('✅ Validation:', results.validation ? 'PASS' : 'FAIL');
  console.log('✅ Base de données:', results.database ? 'PASS' : 'FAIL');
  console.log('✅ Extraction de texte:', results.textExtraction ? 'PASS' : 'FAIL');
  console.log('✅ Analyse IA:', results.cvAnalysis ? 'PASS' : 'FAIL');
  
  const allPassed = Object.values(results).every(result => result !== false);
  
  if (allPassed) {
    console.log('\n🎉 Tous les tests sont passés ! La fonctionnalité est prête.');
  } else {
    console.log('\n⚠️ Certains tests ont échoué. Vérifiez la configuration.');
  }
  
  return allPassed;
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = {
  testTextExtraction,
  testCVAnalysis,
  testValidation,
  testDatabaseConnection,
  runAllTests
};
