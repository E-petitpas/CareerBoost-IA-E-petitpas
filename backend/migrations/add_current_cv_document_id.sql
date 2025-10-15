-- Ajouter la colonne current_cv_document_id à la table candidate_profiles
ALTER TABLE candidate_profiles 
ADD COLUMN current_cv_document_id UUID REFERENCES documents(id);

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN candidate_profiles.current_cv_document_id IS 'ID du document CV actuellement actif pour ce candidat';
