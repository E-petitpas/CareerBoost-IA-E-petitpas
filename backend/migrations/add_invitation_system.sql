-- Migration pour ajouter le système d'invitation par email
-- À exécuter dans l'interface SQL de Supabase

-- 1. Modifier la table users pour rendre password_hash nullable et ajouter is_active
ALTER TABLE users 
ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false;

-- 2. Créer la table user_invitations
CREATE TABLE IF NOT EXISTS user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Créer un index sur le token pour les performances
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_user_id ON user_invitations(user_id);

-- 4. Activer tous les utilisateurs existants (migration)
UPDATE users 
SET is_active = true 
WHERE password_hash IS NOT NULL;

-- 5. Vérifier les modifications
SELECT 
  'users' as table_name,
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_active THEN 1 END) as active_users,
  COUNT(CASE WHEN password_hash IS NOT NULL THEN 1 END) as users_with_password
FROM users

UNION ALL

SELECT 
  'user_invitations' as table_name,
  COUNT(*) as total_invitations,
  COUNT(CASE WHEN used_at IS NOT NULL THEN 1 END) as used_invitations,
  COUNT(CASE WHEN expires_at > now() THEN 1 END) as valid_invitations
FROM user_invitations;
