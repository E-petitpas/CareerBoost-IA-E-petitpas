require('dotenv').config();
const { supabase } = require('../config/supabase');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function applySingleMigration(filename) {
  console.log(`🚀 Application de la migration: ${filename}`);
  
  try {
    const migrationPath = path.join(__dirname, '../../migrations', filename);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Fichier de migration non trouvé: ${migrationPath}`);
    }
    
    const sql = fs.readFileSync(migrationPath, 'utf8');
    const checksum = crypto.createHash('md5').update(sql).digest('hex');
    
    console.log(`📄 Lecture du fichier: ${filename}`);
    console.log(`🔍 Checksum: ${checksum}`);
    
    // Vérifier si la migration est déjà appliquée
    const { data: existingMigration } = await supabase
      .from('schema_migrations')
      .select('*')
      .eq('filename', filename)
      .single();
      
    if (existingMigration) {
      console.log(`⚠️  Migration ${filename} déjà appliquée`);
      return;
    }
    
    // Exécuter la migration
    console.log(`⚡ Exécution de la migration...`);
    const { error: execError } = await supabase.rpc('exec_sql', { sql });
    
    if (execError) {
      console.error('❌ Erreur lors de l\'exécution:', execError);
      throw execError;
    }
    
    // Enregistrer la migration
    const { error: insertError } = await supabase
      .from('schema_migrations')
      .insert({
        filename,
        checksum,
        applied_at: new Date().toISOString()
      });
      
    if (insertError) {
      console.error('❌ Erreur lors de l\'enregistrement:', insertError);
      throw insertError;
    }
    
    console.log(`✅ Migration ${filename} appliquée avec succès`);
    
  } catch (error) {
    console.error(`❌ Échec de la migration ${filename}:`, error.message);
    throw error;
  }
}

// Utilisation
const filename = process.argv[2];
if (!filename) {
  console.error('Usage: node applySingleMigration.js <filename>');
  process.exit(1);
}

applySingleMigration(filename)
  .then(() => {
    console.log('🎉 Migration terminée avec succès');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Échec de la migration:', error.message);
    process.exit(1);
  });
