require('dotenv').config();
const { supabaseAdmin } = require('../config/supabase');

async function activateAdmin() {
  try {
    console.log('🔧 Activation du compte administrateur...\n');

    const email = 'admin@gmail.com';

    // Mettre à jour le compte admin pour l'activer
    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update({ 
        is_active: true,
        verified: true 
      })
      .eq('email', email)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur lors de l\'activation:', error);
      return;
    }

    if (!updatedUser) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }

    console.log('✅ Compte admin activé avec succès !');
    console.log('📧 Email:', updatedUser.email);
    console.log('👤 Nom:', updatedUser.name);
    console.log('🎯 Rôle:', updatedUser.role);
    console.log('✅ Actif:', updatedUser.is_active);
    console.log('✅ Vérifié:', updatedUser.verified);

    console.log('\n🎉 Vous pouvez maintenant vous connecter avec:');
    console.log('📧 Email: admin@gmail.com');
    console.log('🔑 Mot de passe: adminpassword');

  } catch (error) {
    console.error('❌ Erreur lors de l\'activation:', error);
  }
}

// Exécuter le script
activateAdmin()
  .then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
