-- Script pour nettoyer les compétences temporaires créées par le système de gestion des catégories
-- Ces compétences ont un display_name qui commence par "_temp_"

-- Afficher d'abord les compétences temporaires à supprimer
SELECT 
  id, 
  slug, 
  display_name, 
  category, 
  created_at
FROM skills
WHERE display_name LIKE '_temp_%'
ORDER BY created_at DESC;

-- Supprimer les compétences temporaires
-- ATTENTION : Décommentez la ligne suivante pour exécuter la suppression
-- DELETE FROM skills WHERE display_name LIKE '_temp_%';

-- Vérifier qu'il n'en reste plus
-- SELECT COUNT(*) as remaining_temp_skills FROM skills WHERE display_name LIKE '_temp_%';

