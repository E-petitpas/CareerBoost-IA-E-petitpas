const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function migrateCvUrls() {
  try {
    console.log('🚀 Début de la migration des CV URLs...');

    // Récupérer tous les profils candidats qui n'ont pas de cv_url
    const { data: profiles, error: profilesError } = await supabase
      .from('candidate_profiles')
      .select('user_id, cv_url')
      .is('cv_url', null);

    if (profilesError) {
      console.error('❌ Erreur récupération profils:', profilesError);
      return;
    }

    console.log(`📊 ${profiles.length} profils sans cv_url trouvés`);

    if (profiles.length === 0) {
      console.log('✅ Tous les profils ont déjà un cv_url');
      return;
    }

    let updated = 0;
    let errors = 0;

    for (const profile of profiles) {
      try {
        // Récupérer le CV pour ce candidat - prioriser les CVs uploadés
        let cv_url = null;

        // D'abord chercher un CV uploadé (PDF)
        const { data: uploadedCvs, error: uploadError } = await supabase
          .from('documents')
          .select(`
            id,
            created_at,
            title,
            document_versions (
              file_url,
              version
            )
          `)
          .eq('user_id', profile.user_id)
          .eq('type', 'CV')
          .like('title', '%uploadé%')
          .order('created_at', { ascending: false })
          .limit(1);

        if (uploadError) {
          console.error(`❌ Erreur récupération CV uploadé pour ${profile.user_id}:`, uploadError);
          errors++;
          continue;
        }

        if (uploadedCvs?.length > 0 && uploadedCvs[0].document_versions?.length > 0) {
          cv_url = uploadedCvs[0].document_versions[0].file_url;
          console.log(`📄 CV uploadé trouvé pour ${profile.user_id}: ${cv_url}`);
        } else {
          // Si pas de CV uploadé, prendre le plus récent (généré ou autre)
          const { data: cvDocuments, error: cvError } = await supabase
            .from('documents')
            .select(`
              id,
              created_at,
              document_versions (
                file_url,
                version
              )
            `)
            .eq('user_id', profile.user_id)
            .eq('type', 'CV')
            .order('created_at', { ascending: false })
            .limit(1);

          if (cvError) {
            console.error(`❌ Erreur récupération CV pour ${profile.user_id}:`, cvError);
            errors++;
            continue;
          }

          if (cvDocuments?.length > 0 && cvDocuments[0].document_versions?.length > 0) {
            cv_url = cvDocuments[0].document_versions[0].file_url;
            console.log(`🤖 CV généré trouvé pour ${profile.user_id}: ${cv_url}`);
          }
        }

        if (cv_url) {
          
          // Mettre à jour le profil avec l'URL du CV
          const { error: updateError } = await supabase
            .from('candidate_profiles')
            .update({ cv_url })
            .eq('user_id', profile.user_id);

          if (updateError) {
            console.error(`❌ Erreur mise à jour profil ${profile.user_id}:`, updateError);
            errors++;
          } else {
            console.log(`✅ Profil ${profile.user_id} mis à jour avec CV: ${cv_url}`);
            updated++;
          }
        } else {
          console.log(`⚠️ Aucun CV trouvé pour le profil ${profile.user_id}`);
        }

      } catch (error) {
        console.error(`❌ Erreur traitement profil ${profile.user_id}:`, error);
        errors++;
      }
    }

    console.log('🎉 Migration terminée !');
    console.log(`✅ ${updated} profils mis à jour`);
    console.log(`❌ ${errors} erreurs`);

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter la migration si le script est appelé directement
if (require.main === module) {
  migrateCvUrls()
    .then(() => {
      console.log('✅ Script terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { migrateCvUrls };
