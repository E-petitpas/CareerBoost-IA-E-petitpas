-- Migration pour ajouter le champ photo_url à la table users
-- À exécuter dans l'interface SQL de Supabase

-- Ajouter la colonne photo_url
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN users.photo_url IS 'URL de la photo de profil du candidat';

-- Créer un index pour les performances (optionnel)
CREATE INDEX IF NOT EXISTS idx_users_photo_url ON users(photo_url);

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'photo_url';

