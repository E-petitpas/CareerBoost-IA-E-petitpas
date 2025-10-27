const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { supabase } = require('../config/supabase');
const textExtractionService = require('../services/textExtractionService');
const cvAnalysisService = require('../services/cvAnalysisService');
const {
  validateCVUpload,
  validateUpload,
  handleMulterError,
  generateSecureFilename
} = require('../middleware/uploadValidation');

// Fonction utilitaire pour convertir le niveau de compétence textuel en numérique
const convertSkillLevel = (levelText) => {
  if (!levelText) return 3;

  const level = levelText.toLowerCase().trim();
  switch (level) {
    case 'débutant':
    case 'beginner':
    case 'novice':
      return 1;
    case 'intermédiaire':
    case 'intermediate':
    case 'moyen':
      return 2;
    case 'confirmé':
    case 'confirmed':
    case 'bon':
      return 3;
    case 'avancé':
    case 'advanced':
    case 'expert':
      return 4;
    case 'maître':
    case 'master':
    case 'expert+':
      return 5;
    default:
      return 3; // Niveau par défaut
  }
};

// Fonction utilitaire pour normaliser les dates
const normalizeDate = (dateString) => {
  if (!dateString || dateString === 'En cours') return null;

  // Si c'est déjà au format YYYY-MM-DD, on le garde
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  // Format YYYY-MM -> YYYY-MM-01
  if (/^\d{4}-\d{2}$/.test(dateString)) {
    return `${dateString}-01`;
  }

  // Format YYYY -> YYYY-01-01
  if (/^\d{4}$/.test(dateString)) {
    return `${dateString}-01-01`;
  }

  // Essayer de parser d'autres formats
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (error) {
    console.warn('Format de date non reconnu:', dateString);
  }

  return null;
};

const router = express.Router();

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/cv');

    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Utiliser le générateur de nom sécurisé
    const secureFilename = generateSecureFilename(file.originalname, req.user.id, 'cv');
    cb(null, secureFilename);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: validateCVUpload,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

/**
 * POST /api/cv-analysis/upload-and-analyze
 * Upload et analyse d'un CV
 */
router.post('/upload-and-analyze',
  upload.single('cv'),
  validateUpload({ fileType: 'CV', required: true, fieldName: 'cv' }),
  async (req, res) => {
  let filePath = null;
  
  try {
    console.log('📤 Début upload et analyse CV pour utilisateur:', req.user.id);
    
    if (!req.file) {
      return res.status(400).json({ 
        error: 'Aucun fichier fourni',
        details: 'Veuillez sélectionner un fichier CV au format PDF, DOC ou DOCX'
      });
    }

    filePath = req.file.path;
    console.log('📁 Fichier uploadé:', filePath);

    // Étape 1: Extraction du texte
    console.log('🔍 Extraction du texte...');
    const extractedText = await textExtractionService.extractText(filePath, req.file.mimetype);
    
    if (!extractedText || extractedText.length < 50) {
      throw new Error('Le contenu extrait du CV est insuffisant pour l\'analyse');
    }

    // Statistiques du texte
    const textStats = textExtractionService.getTextStats(extractedText);
    console.log('📊 Statistiques texte:', textStats);

    // Étape 2: Analyse avec OpenAI
    console.log('🤖 Analyse avec IA...');
    const analysisResult = await cvAnalysisService.analyzeCVContent(extractedText);

    // Étape 3: Sauvegarder le fichier en base
    const relativePath = `/uploads/cv/${path.basename(filePath)}`;
    
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: req.user.id,
        type: 'CV',
        original_name: req.file.originalname,
        file_path: relativePath,
        file_size: req.file.size,
        mime_type: req.file.mimetype
      })
      .select()
      .single();

    if (docError) {
      console.error('❌ Erreur sauvegarde document:', docError);
      throw new Error('Erreur lors de la sauvegarde du document');
    }

    console.log('✅ Document sauvegardé:', document.id);

    // Réponse avec toutes les informations
    res.json({
      success: true,
      message: 'CV analysé avec succès',
      data: {
        document_id: document.id,
        file_url: relativePath,
        original_name: req.file.originalname,
        file_size: req.file.size,
        text_stats: textStats,
        analysis: analysisResult,
        extracted_text: extractedText.substring(0, 500) + '...' // Aperçu du texte
      }
    });

  } catch (error) {
    console.error('❌ Erreur upload/analyse CV:', error);
    
    // Nettoyer le fichier en cas d'erreur
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log('🗑️ Fichier temporaire supprimé');
      } catch (cleanupError) {
        console.error('❌ Erreur suppression fichier:', cleanupError);
      }
    }

    // Gestion des erreurs spécifiques
    if (error.message.includes('Type de fichier')) {
      return res.status(400).json({ 
        error: 'Type de fichier non supporté',
        details: 'Seuls les fichiers PDF, DOC et DOCX sont acceptés'
      });
    }

    if (error.message.includes('File too large')) {
      return res.status(400).json({ 
        error: 'Fichier trop volumineux',
        details: 'La taille maximale autorisée est de 10MB'
      });
    }

    res.status(500).json({ 
      error: 'Erreur lors de l\'analyse du CV',
      details: error.message
    });
  }
});

/**
 * POST /api/cv-analysis/save-profile
 * Sauvegarde les informations extraites dans le profil candidat
 */
router.post('/save-profile', async (req, res) => {
  try {
    console.log('💾 Sauvegarde profil candidat pour utilisateur:', req.user.id);
    
    const {
      personal_info,
      professional_summary,
      experience_years,
      skills,
      experiences,
      educations,
      document_id
    } = req.body;

    if (!personal_info && !professional_summary && !skills && !experiences && !educations) {
      return res.status(400).json({ 
        error: 'Aucune donnée à sauvegarder',
        details: 'Veuillez fournir au moins une section à mettre à jour'
      });
    }

    // Étape 1: Mettre à jour le profil candidat
    const profileUpdate = {};

    if (personal_info?.title) profileUpdate.title = personal_info.title;
    if (professional_summary) profileUpdate.summary = professional_summary;
    if (experience_years !== undefined) profileUpdate.experience_years = parseInt(experience_years) || 0;
    if (document_id) profileUpdate.current_cv_document_id = document_id;

    // Ajouter l'URL du CV uploadé au profil
    if (document_id) {
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', document_id)
        .single();

      if (!docError && document) {
        profileUpdate.cv_url = document.file_path;
        console.log('📄 CV URL ajoutée au profil:', document.file_path);
      }
    }

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await supabase
        .from('candidate_profiles')
        .upsert({
          user_id: req.user.id,
          ...profileUpdate,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('❌ Erreur mise à jour profil:', profileError);
        throw new Error('Erreur lors de la mise à jour du profil');
      }
      
      console.log('✅ Profil candidat mis à jour');
    }

    // Étape 2: Sauvegarder les expériences
    if (experiences && experiences.length > 0) {
      const experiencesToInsert = experiences
        .filter(exp => exp.company && exp.position)
        .map(exp => ({
          user_id: req.user.id,
          company: exp.company,
          position: exp.position,
          start_date: normalizeDate(exp.start_date),
          end_date: normalizeDate(exp.end_date),
          description: exp.description || null
        }));

      if (experiencesToInsert.length > 0) {
        const { error: expError } = await supabase
          .from('experiences')
          .insert(experiencesToInsert);

        if (expError) {
          console.error('❌ Erreur sauvegarde expériences:', expError);
          // Ne pas faire échouer toute l'opération pour les expériences
        } else {
          console.log(`✅ ${experiencesToInsert.length} expériences sauvegardées`);
        }
      }
    }

    // Étape 3: Sauvegarder les formations
    if (educations && educations.length > 0) {
      const educationsToInsert = educations
        .filter(edu => edu.school)
        .map(edu => ({
          user_id: req.user.id,
          school: edu.school,
          degree: edu.degree || null,
          field: edu.field || null,
          start_date: normalizeDate(edu.start_date),
          end_date: normalizeDate(edu.end_date),
          description: edu.description || null
        }));

      if (educationsToInsert.length > 0) {
        const { error: eduError } = await supabase
          .from('educations')
          .insert(educationsToInsert);

        if (eduError) {
          console.error('❌ Erreur sauvegarde formations:', eduError);
          // Ne pas faire échouer toute l'opération pour les formations
        } else {
          console.log(`✅ ${educationsToInsert.length} formations sauvegardées`);
        }
      }
    }

    // Étape 4: Sauvegarder les compétences (optimisé)
    if (skills && skills.length > 0) {
      console.log(`💡 Traitement optimisé de ${skills.length} compétences...`);
      console.log('📋 Liste des compétences à traiter:', skills);

      let skillsAdded = 0;
      let skillsSkipped = 0;
      let skillsErrors = 0;

      // Étape 4.1: Parser et valider toutes les compétences
      const validSkills = [];
      for (const skillData of skills) {
        let skillName, skillCategory, skillLevel;

        if (typeof skillData === 'string') {
          skillName = skillData;
          skillCategory = 'Autre';
          skillLevel = 3;
        } else if (skillData && typeof skillData === 'object' && skillData.name) {
          skillName = skillData.name;
          skillCategory = skillData.category || 'Autre';
          skillLevel = convertSkillLevel(skillData.level) || 3;
        } else {
          console.log(`⚠️ Compétence ignorée (format invalide):`, skillData);
          skillsSkipped++;
          continue;
        }

        if (!skillName || !skillName.trim()) {
          console.log(`⚠️ Compétence ignorée (nom vide):`, skillData);
          skillsSkipped++;
          continue;
        }

        // Générer un slug unique et sûr
        const baseSlug = skillName.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '') // Supprimer caractères spéciaux
          .replace(/\s+/g, '-') // Remplacer espaces par tirets
          .replace(/-+/g, '-') // Éviter tirets multiples
          .replace(/^-|-$/g, ''); // Supprimer tirets début/fin

        validSkills.push({
          name: skillName.trim(),
          category: skillCategory,
          level: skillLevel,
          slug: baseSlug || skillName.toLowerCase().replace(/[^a-z0-9]/g, '')
        });
      }

      if (validSkills.length === 0) {
        console.log('⚠️ Aucune compétence valide à traiter');
      } else {
        console.log(`✅ ${validSkills.length} compétences valides à traiter`);

        // Étape 4.2: Rechercher toutes les compétences existantes en une seule requête
        const skillNames = validSkills.map(s => s.name);
        const { data: existingSkills, error: searchError } = await supabase
          .from('skills')
          .select('id, display_name')
          .in('display_name', skillNames);

        if (searchError) {
          console.error('❌ Erreur recherche compétences existantes:', searchError);
          skillsErrors += validSkills.length;
        } else {
          console.log(`🔍 ${existingSkills?.length || 0} compétences trouvées en base`);

          // Étape 4.3: Identifier les compétences à créer
          const existingSkillNames = new Set(existingSkills?.map(s => s.display_name.toLowerCase()) || []);
          const skillsToCreate = validSkills.filter(s => !existingSkillNames.has(s.name.toLowerCase()));

          // Étape 4.4: Créer les nouvelles compétences une par une (pour gérer les conflits de slug)
          let newSkills = [];
          if (skillsToCreate.length > 0) {
            console.log(`🆕 Création de ${skillsToCreate.length} nouvelles compétences...`);

            for (const skillToCreate of skillsToCreate) {
              try {
                // Générer un slug unique en cas de conflit
                let finalSlug = skillToCreate.slug;
                let counter = 1;

                while (true) {
                  const { data: existingSlug } = await supabase
                    .from('skills')
                    .select('id')
                    .eq('slug', finalSlug)
                    .single();

                  if (!existingSlug) break; // Slug disponible

                  finalSlug = `${skillToCreate.slug}-${counter}`;
                  counter++;
                }

                const { data: createdSkill, error: createError } = await supabase
                  .from('skills')
                  .insert({
                    display_name: skillToCreate.name,
                    slug: finalSlug,
                    category: skillToCreate.category
                  })
                  .select('id, display_name')
                  .single();

                if (createError) {
                  console.error(`❌ Erreur création compétence "${skillToCreate.name}":`, createError);
                  skillsErrors++;
                } else {
                  newSkills.push(createdSkill);
                  console.log(`✅ Compétence créée: "${skillToCreate.name}" (slug: ${finalSlug})`);
                }
              } catch (error) {
                console.error(`❌ Erreur création compétence "${skillToCreate.name}":`, error);
                skillsErrors++;
              }
            }

            console.log(`✅ ${newSkills.length} nouvelles compétences créées sur ${skillsToCreate.length} tentatives`);
          }

          // Étape 4.5: Combiner toutes les compétences (existantes + nouvelles)
          const allSkills = [...(existingSkills || []), ...newSkills];
          const skillMap = new Map(allSkills.map(s => [s.display_name.toLowerCase(), s.id]));

          // Étape 4.6: Récupérer les associations candidat-compétences existantes
          const skillIds = allSkills.map(s => s.id);
          const { data: existingCandidateSkills } = await supabase
            .from('candidate_skills')
            .select('skill_id')
            .eq('user_id', req.user.id)
            .in('skill_id', skillIds);

          const existingSkillIds = new Set(existingCandidateSkills?.map(cs => cs.skill_id) || []);

          // Étape 4.7: Préparer les associations à créer
          const candidateSkillsToInsert = [];
          for (const validSkill of validSkills) {
            const skillId = skillMap.get(validSkill.name.toLowerCase());
            if (skillId && !existingSkillIds.has(skillId)) {
              candidateSkillsToInsert.push({
                user_id: req.user.id,
                skill_id: skillId,
                level: validSkill.level,
                years_experience: 1
              });
            } else if (skillId && existingSkillIds.has(skillId)) {
              skillsSkipped++;
            } else {
              skillsErrors++;
            }
          }

          // Étape 4.8: Insérer toutes les associations en batch
          if (candidateSkillsToInsert.length > 0) {
            console.log(`🔗 Ajout de ${candidateSkillsToInsert.length} associations candidat-compétences...`);
            const { error: linkError } = await supabase
              .from('candidate_skills')
              .insert(candidateSkillsToInsert);

            if (linkError) {
              console.error('❌ Erreur ajout associations:', linkError);
              skillsErrors += candidateSkillsToInsert.length;
            } else {
              skillsAdded = candidateSkillsToInsert.length;
              console.log(`✅ ${skillsAdded} compétences ajoutées au candidat`);
            }
          }
        }
      }

      console.log(`📊 Résumé traitement compétences: ${skillsAdded} ajoutées, ${skillsSkipped} ignorées, ${skillsErrors} erreurs`);
    }

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: {
        profile_updated: Object.keys(profileUpdate).length > 0,
        experiences_added: experiences?.length || 0,
        educations_added: educations?.length || 0,
        skills_added: skills?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ Erreur sauvegarde profil:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la sauvegarde',
      details: error.message
    });
  }
});

/**
 * GET /api/cv-analysis/supported-formats
 * Retourne les formats de fichiers supportés
 */
router.get('/supported-formats', (req, res) => {
  res.json({
    success: true,
    data: {
      formats: [
        { extension: '.pdf', mime_type: 'application/pdf', description: 'Document PDF' },
        { extension: '.doc', mime_type: 'application/msword', description: 'Document Word 97-2003' },
        { extension: '.docx', mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', description: 'Document Word moderne' }
      ],
      max_file_size: '10MB',
      recommendations: [
        'Utilisez des fichiers avec du texte sélectionnable (évitez les images scannées)',
        'Assurez-vous que votre CV contient vos informations personnelles et professionnelles',
        'Les CV structurés donnent de meilleurs résultats d\'analyse'
      ]
    }
  });
});

// Middleware de gestion d'erreurs pour les uploads
router.use(handleMulterError);

// Gestionnaire d'erreurs global pour cette route
router.use((error, req, res, next) => {
  console.error('Erreur dans cvAnalysis routes:', error);

  // Nettoyer les fichiers temporaires en cas d'erreur
  if (req.file && req.file.path && fs.existsSync(req.file.path)) {
    try {
      fs.unlinkSync(req.file.path);
      console.log('🗑️ Fichier temporaire nettoyé après erreur');
    } catch (cleanupError) {
      console.error('❌ Erreur nettoyage fichier:', cleanupError);
    }
  }

  res.status(500).json({
    error: 'Erreur interne du serveur',
    details: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur inattendue s\'est produite',
    code: 'INTERNAL_ERROR'
  });
});

module.exports = router;
