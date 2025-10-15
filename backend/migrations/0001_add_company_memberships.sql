-- Migration pour ajouter la table company_memberships
-- Cette table gère les relations entre utilisateurs et entreprises

-- Créer la table company_memberships (utilise TEXT au lieu d'ENUM pour éviter les problèmes)
CREATE TABLE IF NOT EXISTS company_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role_in_company TEXT NOT NULL DEFAULT 'EMPLOYEE',
  is_primary boolean NOT NULL DEFAULT false,
  accepted_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Ajouter une contrainte pour valider les valeurs de role_in_company
-- Note: Cette contrainte échouera si elle existe déjà, mais c'est normal
ALTER TABLE company_memberships
ADD CONSTRAINT chk_company_memberships_role
CHECK (role_in_company IN ('ADMIN_RH', 'RH', 'MANAGER', 'EMPLOYEE'));

-- Index pour les performances
CREATE INDEX idx_company_memberships_user_id ON company_memberships(user_id);
CREATE INDEX idx_company_memberships_company_id ON company_memberships(company_id);
CREATE INDEX idx_company_memberships_role ON company_memberships(role_in_company);
CREATE INDEX idx_company_memberships_active ON company_memberships(user_id, company_id) WHERE removed_at IS NULL;
