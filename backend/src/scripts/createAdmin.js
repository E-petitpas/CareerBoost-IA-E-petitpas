const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function createAdmin() {
  try {
    console.log('Création de l\'administrateur...');

    // Données de l'admin
    const adminData = {
      email: 'admin@gmail.com',
      password: 'adminpassword',
      name: 'Administrateur',
      role: 'ADMIN',
      city: 'Paris'
    };

    // Vérifier si l'admin existe déjà
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', adminData.email)
      .single();

    if (existingAdmin) {
      console.log('❌ Un administrateur avec cet email existe déjà:', existingAdmin.email);
      return;
    }

    // Hasher le mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);

    // Insérer l'administrateur dans la base de données
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .insert({
        email: adminData.email,
        password_hash: hashedPassword,
        name: adminData.name,
        role: adminData.role,
        city: adminData.city,
        verified: true, // L'admin est automatiquement vérifié
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (adminError) {
      console.error('❌ Erreur lors de la création de l\'administrateur:', adminError);
      return;
    }

    console.log('✅ Administrateur créé avec succès !');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Mot de passe:', adminData.password);
    console.log('👤 ID:', admin.id);
    console.log('🎯 Rôle:', admin.role);
    console.log('✅ Vérifié:', admin.verified);

    console.log('\n🎉 Vous pouvez maintenant vous connecter avec ces identifiants !');

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'administrateur:', error);
  }
}

// Exécuter le script
createAdmin()
  .then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
