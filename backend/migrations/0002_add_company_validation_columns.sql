-- Migration pour ajouter les colonnes de validation à la table companies
-- Ajoute les colonnes validated_at et validation_reason

-- Ajouter la colonne validated_at
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS validated_at timestamptz;

-- Ajouter la colonne validation_reason
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS validation_reason text;

-- Ajouter la colonne size (taille de l'entreprise)
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS size text;

-- Créer un index sur le statut pour les performances
CREATE INDEX IF NOT EXISTS idx_companies_status_validated ON companies(status, validated_at);

-- Message de confirmation
SELECT 'Migration: Colonnes de validation ajoutées à la table companies ✅' as status;

