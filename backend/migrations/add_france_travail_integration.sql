-- Migration pour l'intégration France Travail
-- À exécuter dans l'interface SQL de Supabase

-- 1. Ajouter les colonnes pour les données France Travail dans job_offers
ALTER TABLE job_offers 
ADD COLUMN IF NOT EXISTS france_travail_id text,
ADD COLUMN IF NOT EXISTS france_travail_data jsonb;

-- 2. Créer un index pour les recherches par ID France Travail
CREATE INDEX IF NOT EXISTS idx_job_offers_france_travail_id ON job_offers(france_travail_id);

-- 3. Créer la table pour les statistiques de synchronisation
CREATE TABLE IF NOT EXISTS sync_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  processed integer NOT NULL DEFAULT 0,
  created integer NOT NULL DEFAULT 0,
  skipped integer NOT NULL DEFAULT 0,
  errors integer NOT NULL DEFAULT 0,
  duration integer NOT NULL DEFAULT 0, -- en millisecondes
  sync_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Créer un index pour les statistiques par source et date
CREATE INDEX IF NOT EXISTS idx_sync_stats_source_date ON sync_stats(source, sync_date DESC);

-- 5. Ajouter une contrainte unique pour éviter les doublons d'ID France Travail
ALTER TABLE job_offers 
ADD CONSTRAINT unique_france_travail_id 
UNIQUE (france_travail_id) 
DEFERRABLE INITIALLY DEFERRED;

-- 6. Mettre à jour les offres existantes pour avoir un admin_status par défaut si nécessaire
UPDATE job_offers 
SET admin_status = 'PENDING' 
WHERE admin_status IS NULL AND source = 'EXTERNAL';

-- 7. Créer une vue pour les offres France Travail en attente de validation
CREATE OR REPLACE VIEW france_travail_pending_offers AS
SELECT 
  jo.*,
  c.name as company_name,
  c.status as company_status,
  (
    SELECT COUNT(*) 
    FROM applications a 
    WHERE a.offer_id = jo.id
  ) as applications_count
FROM job_offers jo
LEFT JOIN companies c ON jo.company_id = c.id
WHERE jo.source = 'EXTERNAL' 
  AND jo.france_travail_id IS NOT NULL
  AND jo.admin_status = 'PENDING'
ORDER BY jo.created_at DESC;

-- 8. Créer une fonction pour nettoyer les anciennes offres France Travail
CREATE OR REPLACE FUNCTION cleanup_old_france_travail_offers()
RETURNS void AS $$
BEGIN
  -- Supprimer les offres France Travail de plus de 90 jours non approuvées
  DELETE FROM job_offers 
  WHERE source = 'EXTERNAL' 
    AND france_travail_id IS NOT NULL
    AND admin_status = 'PENDING'
    AND created_at < NOW() - INTERVAL '90 days';
    
  -- Archiver les offres France Travail approuvées de plus de 6 mois
  UPDATE job_offers 
  SET status = 'ARCHIVED'
  WHERE source = 'EXTERNAL' 
    AND france_travail_id IS NOT NULL
    AND admin_status = 'APPROVED'
    AND status = 'ACTIVE'
    AND created_at < NOW() - INTERVAL '6 months';
END;
$$ LANGUAGE plpgsql;

-- 9. Créer une fonction pour obtenir les statistiques France Travail
CREATE OR REPLACE FUNCTION get_france_travail_stats()
RETURNS TABLE (
  total_offers bigint,
  pending_offers bigint,
  approved_offers bigint,
  rejected_offers bigint,
  last_sync_date timestamptz,
  avg_daily_offers numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM job_offers WHERE source = 'EXTERNAL' AND france_travail_id IS NOT NULL) as total_offers,
    (SELECT COUNT(*) FROM job_offers WHERE source = 'EXTERNAL' AND france_travail_id IS NOT NULL AND admin_status = 'PENDING') as pending_offers,
    (SELECT COUNT(*) FROM job_offers WHERE source = 'EXTERNAL' AND france_travail_id IS NOT NULL AND admin_status = 'APPROVED') as approved_offers,
    (SELECT COUNT(*) FROM job_offers WHERE source = 'EXTERNAL' AND france_travail_id IS NOT NULL AND admin_status = 'REJECTED') as rejected_offers,
    (SELECT MAX(sync_date) FROM sync_stats WHERE source = 'FRANCE_TRAVAIL') as last_sync_date,
    (
      SELECT ROUND(AVG(created), 2) 
      FROM sync_stats 
      WHERE source = 'FRANCE_TRAVAIL' 
        AND sync_date > NOW() - INTERVAL '30 days'
    ) as avg_daily_offers;
END;
$$ LANGUAGE plpgsql;

-- 10. Commentaires pour la documentation
COMMENT ON TABLE sync_stats IS 'Statistiques de synchronisation des offres externes';
COMMENT ON COLUMN job_offers.france_travail_id IS 'ID unique de l''offre dans l''API France Travail';
COMMENT ON COLUMN job_offers.france_travail_data IS 'Données brutes de l''offre France Travail pour référence';
COMMENT ON VIEW france_travail_pending_offers IS 'Vue des offres France Travail en attente de validation admin';
COMMENT ON FUNCTION cleanup_old_france_travail_offers() IS 'Fonction de nettoyage des anciennes offres France Travail';
COMMENT ON FUNCTION get_france_travail_stats() IS 'Fonction pour obtenir les statistiques des offres France Travail';
