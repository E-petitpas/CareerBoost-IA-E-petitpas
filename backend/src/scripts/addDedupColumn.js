require('dotenv').config();
const { supabase } = require('../config/supabase');

async function addDedupColumn() {
  console.log('🔧 Ajout de la colonne dedup_hash...');
  
  const sql = `
    -- Ajouter la colonne dedup_hash
    ALTER TABLE job_offers 
    ADD COLUMN IF NOT EXISTS dedup_hash TEXT;
    
    -- Créer un index pour les performances de déduplication
    CREATE INDEX IF NOT EXISTS idx_job_offers_dedup_hash ON job_offers(dedup_hash);
  `;
  
  const { error } = await supabase.rpc('exec_sql', { sql });
  
  if (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } else {
    console.log('✅ Colonne dedup_hash ajoutée avec succès');
  }
}

addDedupColumn().then(() => process.exit(0)).catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
