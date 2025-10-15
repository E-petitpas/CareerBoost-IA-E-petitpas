const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Utiliser la configuration Supabase existante du projet
const { supabaseAdmin } = require('../config/supabase');

// Configuration
const MIGRATIONS_DIR = path.join(__dirname, '../../migrations');
const MIGRATIONS_TABLE = 'schema_migrations';

/**
 * Classe pour gérer les migrations de base de données
 */
class MigrationManager {
  constructor() {
    if (!supabaseAdmin) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY manquante dans les variables d\'environnement');
    }
    this.supabase = supabaseAdmin;
  }

  /**
   * Assure que la table de suivi des migrations existe
   */
  async ensureMigrationsTable() {
    console.log('🔍 Vérification de la table de suivi des migrations...');
    
    try {
      // Créer la table de migrations si elle n'existe pas
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
          id SERIAL PRIMARY KEY,
          filename TEXT UNIQUE NOT NULL,
          checksum TEXT NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          execution_time_ms INTEGER,
          success BOOLEAN DEFAULT TRUE
        );
        
        CREATE INDEX IF NOT EXISTS idx_schema_migrations_filename ON ${MIGRATIONS_TABLE}(filename);
        CREATE INDEX IF NOT EXISTS idx_schema_migrations_executed_at ON ${MIGRATIONS_TABLE}(executed_at);
      `;

      const { error } = await this.supabase.rpc('exec_sql', { sql: createTableSQL });
      
      if (error) {
        console.error('❌ Erreur lors de la création de la table de migrations:', error);
        throw error;
      }
      
      console.log('✅ Table de suivi des migrations prête');
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de la table de migrations:', error);
      throw error;
    }
  }

  /**
   * Calcule le checksum d'un fichier SQL
   */
  calculateChecksum(content) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
  }

  /**
   * Récupère la liste des migrations déjà appliquées
   */
  async getAppliedMigrations() {
    try {
      const { data, error } = await this.supabase
        .from(MIGRATIONS_TABLE)
        .select('filename, checksum, executed_at, success')
        .eq('success', true)
        .order('executed_at', { ascending: true });

      if (error) {
        console.error('❌ Erreur lors de la récupération des migrations appliquées:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des migrations:', error);
      throw error;
    }
  }

  /**
   * Récupère la liste des fichiers de migration
   */
  getMigrationFiles() {
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      console.log(`📁 Création du dossier migrations: ${MIGRATIONS_DIR}`);
      fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
      return [];
    }

    return fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Tri alphabétique pour assurer l'ordre
  }

  /**
   * Valide qu'une migration n'a pas été modifiée
   */
  validateMigrationIntegrity(filename, currentContent, appliedMigrations) {
    const appliedMigration = appliedMigrations.find(m => m.filename === filename);
    
    if (!appliedMigration) {
      return true; // Nouvelle migration
    }

    const currentChecksum = this.calculateChecksum(currentContent);
    
    if (appliedMigration.checksum !== currentChecksum) {
      throw new Error(
        `❌ La migration ${filename} a été modifiée après son application!\n` +
        `   Checksum attendu: ${appliedMigration.checksum}\n` +
        `   Checksum actuel: ${currentChecksum}\n` +
        `   Appliquée le: ${appliedMigration.executed_at}`
      );
    }

    return false; // Migration déjà appliquée et valide
  }

  /**
   * Exécute une migration
   */
  async executeMigration(filename, sql) {
    console.log(`🚀 Exécution de la migration: ${filename}`);
    
    const startTime = Date.now();
    const checksum = this.calculateChecksum(sql);

    try {
      // Exécuter la migration dans une transaction
      const { error } = await this.supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.error(`❌ Erreur lors de l'exécution de ${filename}:`, error);
        
        // Enregistrer l'échec
        await this.supabase
          .from(MIGRATIONS_TABLE)
          .insert({
            filename,
            checksum,
            execution_time_ms: Date.now() - startTime,
            success: false
          });
        
        throw error;
      }

      const executionTime = Date.now() - startTime;

      // Enregistrer le succès
      const { error: insertError } = await this.supabase
        .from(MIGRATIONS_TABLE)
        .insert({
          filename,
          checksum,
          execution_time_ms: executionTime,
          success: true
        });

      if (insertError) {
        console.error('❌ Erreur lors de l\'enregistrement de la migration:', insertError);
        throw insertError;
      }

      console.log(`✅ Migration ${filename} appliquée avec succès (${executionTime}ms)`);
      
    } catch (error) {
      console.error(`❌ Échec de la migration ${filename}:`, error.message);
      throw error;
    }
  }

  /**
   * Exécute toutes les migrations en attente
   */
  async runMigrations() {
    try {
      console.log('🚀 Démarrage du processus de migration...\n');

      // Vérifier la table de migrations
      await this.ensureMigrationsTable();

      // Récupérer les migrations appliquées
      const appliedMigrations = await this.getAppliedMigrations();
      console.log(`📋 ${appliedMigrations.length} migration(s) déjà appliquée(s)`);

      // Récupérer les fichiers de migration
      const migrationFiles = this.getMigrationFiles();
      console.log(`📁 ${migrationFiles.length} fichier(s) de migration trouvé(s)\n`);

      if (migrationFiles.length === 0) {
        console.log('ℹ️  Aucun fichier de migration trouvé , les migrations se trouvent dans le dossier migrations/file.sql');
        return;
      }

      let pendingCount = 0;

      // Traiter chaque fichier de migration
      for (const filename of migrationFiles) {
        const filePath = path.join(MIGRATIONS_DIR, filename);
        const sql = fs.readFileSync(filePath, 'utf-8').trim();

        if (!sql) {
          console.log(`⚠️  Migration vide ignorée: ${filename}`);
          continue;
        }

        try {
          // Valider l'intégrité et vérifier si déjà appliquée
          const needsExecution = this.validateMigrationIntegrity(filename, sql, appliedMigrations);

          if (!needsExecution) {
            console.log(`⏩ Migration déjà appliquée: ${filename}`);
            continue;
          }

          // Exécuter la migration
          await this.executeMigration(filename, sql);
          pendingCount++;

        } catch (error) {
          console.error(`💥 Arrêt du processus de migration à cause de: ${filename}`);
          throw error;
        }
      }

      console.log('\n🎉 Processus de migration terminé avec succès!');
      console.log(`📊 Résumé: ${pendingCount} nouvelle(s) migration(s) appliquée(s)`);

    } catch (error) {
      console.error('\n💥 Échec du processus de migration:', error.message);
      process.exit(1);
    }
  }

  /**
   * Affiche le statut des migrations
   */
  async status() {
    try {
      console.log('📊 Statut des migrations\n');

      await this.ensureMigrationsTable();
      
      const appliedMigrations = await this.getAppliedMigrations();
      const migrationFiles = this.getMigrationFiles();

      console.log('Migrations appliquées:');
      if (appliedMigrations.length === 0) {
        console.log('  Aucune migration appliquée');
      } else {
        appliedMigrations.forEach(migration => {
          const date = new Date(migration.executed_at).toLocaleString('fr-FR');
          console.log(`  ✅ ${migration.filename} (${date})`);
        });
      }

      console.log('\nMigrations en attente:');
      const appliedFilenames = appliedMigrations.map(m => m.filename);
      const pendingFiles = migrationFiles.filter(f => !appliedFilenames.includes(f));
      
      if (pendingFiles.length === 0) {
        console.log('  Aucune migration en attente');
      } else {
        pendingFiles.forEach(filename => {
          console.log(`  ⏳ ${filename}`);
        });
      }

      console.log(`\n📈 Total: ${appliedMigrations.length} appliquées, ${pendingFiles.length} en attente`);

    } catch (error) {
      console.error('❌ Erreur lors de la récupération du statut:', error.message);
      process.exit(1);
    }
  }
}

/**
 * Point d'entrée principal
 */
async function main() {
  const command = process.argv[2] || 'migrate';
  const migrationManager = new MigrationManager();

  switch (command) {
    case 'migrate':
    case 'up':
      await migrationManager.runMigrations();
      break;
    
    case 'status':
      await migrationManager.status();
      break;
    
    default:
      console.log('Usage: node migrate.js [migrate|status]');
      console.log('  migrate (défaut) - Applique toutes les migrations en attente');
      console.log('  status          - Affiche le statut des migrations');
      process.exit(1);
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Erreur fatale:', error.message);
    process.exit(1);
  });
}

module.exports = { MigrationManager };
