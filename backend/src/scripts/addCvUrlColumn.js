const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function addCvUrlColumn() {
  try {
    console.log('🚀 Début de la migration pour ajouter cv_url à candidate_profiles...');

    // Essayons d'abord de faire une requête simple pour tester la connexion
    const { data: testConnection, error: connectionError } = await supabase
      .from('candidate_profiles')
      .select('user_id')
      .limit(1);

    if (connectionError) {
      console.error('❌ Erreur de connexion à Supabase:', connectionError);
      return;
    }

    console.log('✅ Connexion à Supabase réussie');

    // Vérifier si la colonne existe déjà en essayant de la sélectionner
    const { data: testColumn, error: testColumnError } = await supabase
      .from('candidate_profiles')
      .select('cv_url')
      .limit(1);

    if (!testColumnError) {
      console.log('✅ La colonne cv_url existe déjà dans candidate_profiles');
      return;
    }

    if (testColumnError && !testColumnError.message.includes('column "cv_url" does not exist')) {
      console.error('❌ Erreur inattendue:', testColumnError);
      return;
    }

    console.log('📝 La colonne cv_url n\'existe pas, elle doit être ajoutée manuellement...');
    console.log('');
    console.log('🔧 Veuillez exécuter cette requête SQL dans l\'interface Supabase:');
    console.log('');
    console.log('ALTER TABLE candidate_profiles ADD COLUMN cv_url TEXT;');
    console.log('');
    console.log('📍 Allez sur: https://supabase.com/dashboard/project/gdxgcucctsntufkpvwzv/sql');
    console.log('');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la migration si le script est appelé directement
if (require.main === module) {
  addCvUrlColumn()
    .then(() => {
      console.log('✅ Script terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { addCvUrlColumn };
