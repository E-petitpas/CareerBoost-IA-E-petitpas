require('dotenv').config();
const { supabaseAdmin } = require('../config/supabase');

async function checkDatabase() {
  try {
    console.log('🔍 Vérification de l\'état de la base de données...\n');

    // Vérifier les tables importantes directement
    const tablesToCheck = ['users', 'companies', 'job_offers', 'candidate_profiles', 'company_memberships', 'applications'];
    console.log('📋 Vérification des tables importantes:');

    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabaseAdmin
          .from(tableName)
          .select('*', { count: 'exact' })
          .limit(0);

        if (error) {
          console.log(`  ❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`  ✅ ${tableName}: ${data?.length || 0} enregistrements`);
        }
      } catch (err) {
        console.log(`  ❌ ${tableName}: ${err.message}`);
      }
    }

    // Vérifier les types enum
    const { data: types, error: typesError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        SELECT typname 
        FROM pg_type 
        WHERE typtype = 'e' 
        ORDER BY typname;
      `
    });

    if (!typesError && types) {
      console.log('\n🏷️  Types enum existants:');
      if (types.length > 0) {
        types.forEach(type => {
          console.log(`  - ${type.typname}`);
        });
      } else {
        console.log('  Aucun type enum trouvé');
      }
    }

    // Vérifier s'il y a des utilisateurs
    const { data: userCount, error: userError } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact' });

    if (!userError) {
      console.log(`\n👥 Nombre d'utilisateurs: ${userCount?.length || 0}`);
      
      if (userCount && userCount.length > 0) {
        // Afficher quelques utilisateurs
        const { data: users, error: usersError } = await supabaseAdmin
          .from('users')
          .select('email, role, name')
          .limit(5);
        
        if (!usersError && users) {
          console.log('   Exemples d\'utilisateurs:');
          users.forEach(user => {
            console.log(`   - ${user.email} (${user.role}) - ${user.name}`);
          });
        }
      }
    }

    // Vérifier les migrations appliquées
    const { data: migrations, error: migrationsError } = await supabaseAdmin
      .from('schema_migrations')
      .select('filename, executed_at')
      .order('executed_at', { ascending: true });

    if (!migrationsError) {
      console.log(`\n📊 Migrations appliquées: ${migrations?.length || 0}`);
      if (migrations && migrations.length > 0) {
        migrations.forEach(migration => {
          const date = new Date(migration.executed_at).toLocaleString('fr-FR');
          console.log(`   - ${migration.filename} (${date})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

// Exécuter le script
checkDatabase()
  .then(() => {
    console.log('\n✅ Vérification terminée');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
