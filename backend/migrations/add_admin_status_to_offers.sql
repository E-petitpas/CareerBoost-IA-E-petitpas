-- Migration pour ajouter le système de validation admin des offres
-- À exécuter dans l'interface SQL de Supabase

-- 1. Créer l'enum pour le statut admin
CREATE TYPE IF NOT EXISTS admin_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED');

-- 2. Ajouter la colonne admin_status à la table job_offers
ALTER TABLE job_offers 
ADD COLUMN IF NOT EXISTS admin_status admin_status NOT NULL DEFAULT 'PENDING';

-- 3. Créer un index pour les performances
CREATE INDEX IF NOT EXISTS idx_job_offers_admin_status ON job_offers(admin_status);
CREATE INDEX IF NOT EXISTS idx_job_offers_status_admin_status ON job_offers(status, admin_status);

-- 4. Approuver automatiquement toutes les offres existantes (migration)
UPDATE job_offers 
SET admin_status = 'APPROVED' 
WHERE admin_status = 'PENDING';

-- 5. Vérifier les modifications
SELECT 
  'job_offers' as table_name,
  COUNT(*) as total_offers,
  COUNT(CASE WHEN admin_status = 'PENDING' THEN 1 END) as pending_offers,
  COUNT(CASE WHEN admin_status = 'APPROVED' THEN 1 END) as approved_offers,
  COUNT(CASE WHEN admin_status = 'REJECTED' THEN 1 END) as rejected_offers,
  COUNT(CASE WHEN admin_status = 'FLAGGED' THEN 1 END) as flagged_offers,
  COUNT(CASE WHEN status = 'ACTIVE' AND admin_status = 'APPROVED' THEN 1 END) as visible_to_candidates
FROM job_offers;
