require('dotenv').config();
const { supabase } = require('../config/supabase');

async function addAdminOfferColumns() {
  console.log('🔧 Ajout des colonnes admin pour les offres...');

  try {
    // Vérifier si les colonnes existent déjà
    const { data: existingColumns, error: checkError } = await supabase
      .from('job_offers')
      .select('admin_status')
      .limit(1);

    if (!checkError) {
      console.log('✅ Les colonnes admin existent déjà !');
      return;
    }

    console.log('📝 Ajout des colonnes admin_status, admin_validated_at, admin_validated_by...');

    // Exécuter les requêtes SQL pour ajouter les colonnes
    const queries = [
      `ALTER TABLE job_offers ADD COLUMN IF NOT EXISTS admin_status VARCHAR(20) DEFAULT 'PENDING';`,
      `ALTER TABLE job_offers ADD COLUMN IF NOT EXISTS admin_validated_at TIMESTAMP WITH TIME ZONE;`,
      `ALTER TABLE job_offers ADD COLUMN IF NOT EXISTS admin_validated_by UUID REFERENCES users(id);`,
      `CREATE INDEX IF NOT EXISTS idx_job_offers_admin_status ON job_offers(admin_status);`,
      `CREATE INDEX IF NOT EXISTS idx_job_offers_admin_validated_at ON job_offers(admin_validated_at);`
    ];

    for (const query of queries) {
      console.log(`Exécution: ${query}`);
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      
      if (error) {
        console.error(`❌ Erreur lors de l'exécution de: ${query}`, error);
        // Continuer avec les autres requêtes
      } else {
        console.log('✅ Requête exécutée avec succès');
      }
    }

    console.log('🎉 Migration terminée !');

    // Vérifier que les colonnes ont été ajoutées
    const { data: testData, error: testError } = await supabase
      .from('job_offers')
      .select('id, admin_status, admin_validated_at, admin_validated_by')
      .limit(1);

    if (testError) {
      console.error('❌ Erreur lors de la vérification:', testError);
    } else {
      console.log('✅ Vérification réussie - Colonnes disponibles');
    }

  } catch (error) {
    console.error('💥 Erreur générale:', error);
  }
}

// Fonction alternative si la RPC ne fonctionne pas
async function addAdminOfferColumnsAlternative() {
  console.log('🔧 Méthode alternative - Mise à jour via Supabase...');

  try {
    // Essayer d'insérer une offre test avec les nouvelles colonnes
    const { data, error } = await supabase
      .from('job_offers')
      .update({
        admin_status: 'PENDING'
      })
      .eq('id', '00000000-0000-0000-0000-000000000000') // ID inexistant
      .select();

    if (error && error.message.includes('column "admin_status" does not exist')) {
      console.log('❌ Les colonnes n\'existent pas encore');
      console.log('📝 Veuillez exécuter ces requêtes SQL manuellement dans Supabase:');
      console.log('');
      console.log('ALTER TABLE job_offers ADD COLUMN admin_status VARCHAR(20) DEFAULT \'PENDING\';');
      console.log('ALTER TABLE job_offers ADD COLUMN admin_validated_at TIMESTAMP WITH TIME ZONE;');
      console.log('ALTER TABLE job_offers ADD COLUMN admin_validated_by UUID REFERENCES users(id);');
      console.log('CREATE INDEX idx_job_offers_admin_status ON job_offers(admin_status);');
      console.log('CREATE INDEX idx_job_offers_admin_validated_at ON job_offers(admin_validated_at);');
      console.log('');
    } else {
      console.log('✅ Les colonnes admin existent déjà !');
    }

  } catch (error) {
    console.error('💥 Erreur:', error);
  }
}

// Exécution
addAdminOfferColumns()
  .then(() => {
    console.log('🎉 Script terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    console.log('🔄 Tentative avec méthode alternative...');
    
    addAdminOfferColumnsAlternative()
      .then(() => {
        process.exit(0);
      })
      .catch((altError) => {
        console.error('💥 Erreur alternative:', altError);
        process.exit(1);
      });
  });
