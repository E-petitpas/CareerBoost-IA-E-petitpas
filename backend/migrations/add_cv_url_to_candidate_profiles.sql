-- Migration pour ajouter la colonne cv_url à la table candidate_profiles
-- À exécuter dans l'interface SQL de Supabase

-- Ajouter la colonne cv_url
ALTER TABLE candidate_profiles 
ADD COLUMN IF NOT EXISTS cv_url TEXT;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN candidate_profiles.cv_url IS 'URL du CV actuellement actif pour ce candidat';

-- Créer un index pour les performances (optionnel)
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_cv_url ON candidate_profiles(cv_url);

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'candidate_profiles' 
AND column_name = 'cv_url';
