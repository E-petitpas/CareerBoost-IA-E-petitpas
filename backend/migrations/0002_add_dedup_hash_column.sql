-- Migration pour ajouter la colonne dedup_hash à la table job_offers
-- Cette colonne est nécessaire pour la déduplication des offres externes

-- Ajouter la colonne dedup_hash
ALTER TABLE job_offers 
ADD COLUMN IF NOT EXISTS dedup_hash TEXT;

-- Créer un index pour les performances de déduplication
CREATE INDEX IF NOT EXISTS idx_job_offers_dedup_hash ON job_offers(dedup_hash);

-- Ajouter une contrainte unique pour éviter les doublons
ALTER TABLE job_offers 
ADD CONSTRAINT unique_dedup_hash 
UNIQUE (dedup_hash) 
DEFERRABLE INITIALLY DEFERRED;
