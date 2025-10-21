const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { supabase } = require('../config/supabase');
const { candidateSchemas, validate } = require('../utils/validation');
const { requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Créer les répertoires d'upload s'ils n'existent pas
const uploadDirs = ['uploads', 'uploads/cv', 'uploads/lm'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configuration multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/cv/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'uploaded-cv-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté. Utilisez PDF, DOC ou DOCX.'));
    }
  }
});

// Middleware pour vérifier le rôle candidat
router.use(requireRole('CANDIDATE'));

// Récupérer le profil complet du candidat
router.get('/profile', asyncHandler(async (req, res) => {
  // Essayer de récupérer le profil existant
  let { data: profile, error } = await supabase
    .from('candidate_profiles')
    .select(`
      *,
      users (
        id,
        name,
        email,
        phone,
        city,
        latitude,
        longitude
      )
    `)
    .eq('user_id', req.user.id)
    .maybeSingle();

  // Si le profil n'existe pas, le créer
  if (!profile && !error) {
    console.log('Création du profil candidat pour l\'utilisateur:', req.user.id);

    const { data: newProfile, error: createError } = await supabase
      .from('candidate_profiles')
      .insert({
        user_id: req.user.id,
        mobility_km: 25,
        preferred_contracts: []
      })
      .select(`
        *,
        users (
          id,
          name,
          email,
          phone,
          city,
          latitude,
          longitude
        )
      `)
      .single();

    if (createError) {
      console.error('Erreur création profil:', createError);
      return res.status(500).json({ error: 'Erreur lors de la création du profil' });
    }

    profile = newProfile;
  } else if (error) {
    console.error('Erreur récupération profil:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }

  // Récupérer les formations
  const { data: educations } = await supabase
    .from('educations')
    .select('*')
    .eq('user_id', req.user.id)
    .order('start_date', { ascending: false });

  // Récupérer les expériences
  const { data: experiencesRaw } = await supabase
    .from('experiences')
    .select('*')
    .eq('user_id', req.user.id)
    .order('start_date', { ascending: false });

  // Remapper position vers role_title pour la compatibilité frontend
  const experiences = experiencesRaw?.map(exp => ({
    ...exp,
    role_title: exp.position
  })) || [];

  // Récupérer les compétences du candidat
  const { data: candidate_skills_raw } = await supabase
    .from('candidate_skills')
    .select(`
      id,
      user_id,
      skill_id,
      level,
      years_experience,
      skills (
        id,
        slug,
        display_name,
        category
      )
    `)
    .eq('user_id', req.user.id);

  // Mapper les colonnes pour la compatibilité frontend
  const candidate_skills = candidate_skills_raw?.map(skill => ({
    ...skill,
    proficiency_level: skill.level,
    last_used_on: null // La colonne n'existe pas dans la base de données
  })) || [];

  // Récupérer l'URL du CV - d'abord depuis le profil, sinon depuis la table documents
  let cv_url = profile.cv_url; // Utiliser d'abord la colonne cv_url du profil

  if (!cv_url) {
    // Si pas de cv_url dans le profil, récupérer depuis la table documents (pour la compatibilité)
    // Prioriser les CVs uploadés (PDF) par rapport aux CVs générés (HTML)

    // D'abord chercher un CV uploadé (PDF)
    const { data: uploadedCvs } = await supabase
      .from('documents')
      .select(`
        id,
        created_at,
        original_name,
        document_versions (
          file_url,
          version_number
        )
      `)
      .eq('user_id', req.user.id)
      .eq('type', 'CV')
      .order('created_at', { ascending: false })
      .limit(1);

    if (uploadedCvs?.length > 0 && uploadedCvs[0].document_versions?.length > 0) {
      cv_url = uploadedCvs[0].document_versions[0].file_url;
      console.log('CV trouvé depuis documents:', cv_url);
    } else {
      // Si pas de CV, prendre le plus récent (généré ou autre)
      const { data: cvDocuments } = await supabase
        .from('documents')
        .select(`
          id,
          created_at,
          document_versions (
            file_url,
            version_number
          )
        `)
        .eq('user_id', req.user.id)
        .eq('type', 'CV')
        .order('created_at', { ascending: false })
        .limit(1);

      if (cvDocuments?.length > 0 && cvDocuments[0].document_versions?.length > 0) {
        cv_url = cvDocuments[0].document_versions[0].file_url;
        console.log('CV (généré) trouvé depuis documents:', cv_url);
      } else {
        console.log('Aucun CV trouvé pour l\'utilisateur:', req.user.id);
      }
    }
  } else {
    console.log('CV trouvé depuis profil:', cv_url);
  }

  const responseData = {
    profile: {
      ...profile,
      cv_url, // Ajouter l'URL du CV pour la compatibilité avec le frontend
      educations: educations || [],
      experiences: experiences || [],
      candidate_skills: candidate_skills || []
    }
  };

  console.log('Réponse envoyée au frontend:', JSON.stringify(responseData, null, 2));
  res.json(responseData);
}));

// Mettre à jour le profil candidat
router.put('/profile', validate(candidateSchemas.profile), asyncHandler(async (req, res) => {
  const { data: profile, error } = await supabase
    .from('candidate_profiles')
    .update({
      ...req.body,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) {
    console.error('Erreur mise à jour profil:', error);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
  }

  res.json({ profile });
}));

// Ajouter une formation
router.post('/educations', validate(candidateSchemas.education), asyncHandler(async (req, res) => {
  const { data: education, error } = await supabase
    .from('educations')
    .insert({
      ...req.body,
      user_id: req.user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur ajout formation:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'ajout de la formation' });
  }

  res.status(201).json({
    education,
    message: 'Formation ajoutée avec succès'
  });
}));

// Mettre à jour une formation
router.put('/educations/:id', validate(candidateSchemas.education), asyncHandler(async (req, res) => {
  const { data: education, error } = await supabase
    .from('educations')
    .update(req.body)
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) {
    console.error('Erreur mise à jour formation:', error);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour de la formation' });
  }

  if (!education) {
    return res.status(404).json({ error: 'Formation non trouvée' });
  }

  res.json({
    education,
    message: 'Formation mise à jour avec succès'
  });
}));

// Supprimer une formation
router.delete('/educations/:id', asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('educations')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);

  if (error) {
    console.error('Erreur suppression formation:', error);
    return res.status(500).json({ error: 'Erreur lors de la suppression de la formation' });
  }

  res.json({ message: 'Formation supprimée avec succès' });
}));

// Ajouter une expérience
router.post('/experiences', validate(candidateSchemas.experience), asyncHandler(async (req, res) => {
  // Mapper role_title vers position pour la base de données
  const experienceData = {
    user_id: req.user.id,
    company: req.body.company,
    position: req.body.role_title, // Mapper role_title vers position
    start_date: req.body.start_date,
    end_date: req.body.end_date,
    description: req.body.description
  };

  const { data: experience, error } = await supabase
    .from('experiences')
    .insert(experienceData)
    .select()
    .single();

  if (error) {
    console.error('Erreur ajout expérience:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'expérience' });
  }

  // Remapper position vers role_title pour la réponse
  const responseExperience = {
    ...experience,
    role_title: experience.position
  };

  res.status(201).json({
    experience: responseExperience,
    message: 'Expérience ajoutée avec succès'
  });
}));

// Mettre à jour une expérience
router.put('/experiences/:id', validate(candidateSchemas.experience), asyncHandler(async (req, res) => {
  // Mapper role_title vers position pour la base de données
  const experienceData = {
    company: req.body.company,
    position: req.body.role_title, // Mapper role_title vers position
    start_date: req.body.start_date,
    end_date: req.body.end_date,
    description: req.body.description
  };

  const { data: experience, error } = await supabase
    .from('experiences')
    .update(experienceData)
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) {
    console.error('Erreur mise à jour expérience:', error);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'expérience' });
  }

  if (!experience) {
    return res.status(404).json({ error: 'Expérience non trouvée' });
  }

  // Remapper position vers role_title pour la réponse
  const responseExperience = {
    ...experience,
    role_title: experience.position
  };

  res.json({
    experience: responseExperience,
    message: 'Expérience mise à jour avec succès'
  });
}));

// Supprimer une expérience
router.delete('/experiences/:id', asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('experiences')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);

  if (error) {
    console.error('Erreur suppression expérience:', error);
    return res.status(500).json({ error: 'Erreur lors de la suppression de l\'expérience' });
  }

  res.json({ message: 'Expérience supprimée avec succès' });
}));

// Mettre à jour les compétences
router.put('/skills', validate(candidateSchemas.skills), asyncHandler(async (req, res) => {
  // Supprimer les anciennes compétences
  await supabase
    .from('candidate_skills')
    .delete()
    .eq('user_id', req.user.id);

  // Ajouter les nouvelles compétences
  if (req.body.length > 0) {
    const skillsToInsert = req.body.map(skill => ({
      user_id: req.user.id,
      skill_id: skill.skill_id,
      level: skill.proficiency_level || 3
    }));

    const { error } = await supabase
      .from('candidate_skills')
      .insert(skillsToInsert);

    if (error) {
      console.error('Erreur mise à jour compétences:', error);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour des compétences' });
    }
  }

  res.json({ message: 'Compétences mises à jour avec succès' });
}));

// Ajouter une compétence
router.post('/skills', validate(candidateSchemas.skill), asyncHandler(async (req, res) => {
  try {
    const { skill_name, proficiency_level } = req.body;
    console.log('POST /skills - Données reçues:', { skill_name, proficiency_level });

    if (!skill_name || !skill_name.trim()) {
      return res.status(400).json({ error: 'Le nom de la compétence est requis' });
    }

    // Chercher la compétence existante (case-insensitive)
    let { data: skill, error: skillError } = await supabase
      .from('skills')
      .select('id, display_name, slug, category')
      .ilike('display_name', skill_name.trim())
      .single();

    console.log('Recherche compétence:', { skill_name: skill_name.trim(), found: !!skill, error: skillError?.code });

    // PGRST116 = pas de résultats trouvés (c'est normal)
    if (skillError && skillError.code !== 'PGRST116') {
      console.error('Erreur recherche compétence:', skillError);
      return res.status(500).json({ error: 'Erreur lors de la recherche de la compétence' });
    }

    // Si la compétence n'existe pas, la créer
    if (!skill) {
      const slug = skill_name
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      console.log('Création nouvelle compétence:', { slug, display_name: skill_name.trim() });

      const { data: newSkill, error: createError } = await supabase
        .from('skills')
        .insert({
          slug,
          display_name: skill_name.trim(),
          category: 'Autre'
        })
        .select('id, display_name, slug, category')
        .single();

      if (createError) {
        console.error('Erreur création compétence:', createError);
        return res.status(500).json({ error: 'Erreur lors de la création de la compétence' });
      }

      console.log('Compétence créée:', newSkill);
      skill = newSkill;
    }

    // Vérifier si la compétence est déjà ajoutée
    const { data: existingSkill } = await supabase
      .from('candidate_skills')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('skill_id', skill.id)
      .single();

    if (existingSkill) {
      console.log('Compétence déjà ajoutée:', skill.id);
      return res.status(400).json({ error: 'Cette compétence est déjà ajoutée' });
    }

    console.log('Ajout compétence au candidat:', { user_id: req.user.id, skill_id: skill.id, level: proficiency_level || 3 });

    // Ajouter la compétence au candidat
    // Note: La table candidate_skills utilise 'level' au lieu de 'proficiency_level'
    const { data: candidateSkill, error: addError } = await supabase
      .from('candidate_skills')
      .insert({
        user_id: req.user.id,
        skill_id: skill.id,
        level: proficiency_level || 3
      })
      .select(`
        id,
        user_id,
        skill_id,
        level,
        years_experience,
        skills (
          id,
          slug,
          display_name,
          category
        )
      `)
      .single();

    if (addError) {
      console.error('Erreur ajout compétence candidat:', addError);
      return res.status(500).json({ error: 'Erreur lors de l\'ajout de la compétence' });
    }

    console.log('Compétence ajoutée avec succès:', candidateSkill);

    res.status(201).json({
      skill: candidateSkill,
      message: 'Compétence ajoutée avec succès'
    });

  } catch (error) {
    console.error('Erreur ajout compétence:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de l\'ajout de la compétence' });
  }
}));

// Modifier une compétence
router.put('/skills/:skillId', validate(candidateSchemas.skill), asyncHandler(async (req, res) => {
  try {
    const { skillId } = req.params;
    const { proficiency_level } = req.body;

    const { data: candidateSkill, error } = await supabase
      .from('candidate_skills')
      .update({
        level: proficiency_level || 3
      })
      .eq('id', skillId)
      .eq('user_id', req.user.id)
      .select(`
        *,
        skills (
          id,
          slug,
          display_name,
          category
        )
      `)
      .single();

    if (error) {
      console.error('Erreur modification compétence:', error);
      return res.status(500).json({ error: 'Erreur lors de la modification de la compétence' });
    }

    if (!candidateSkill) {
      return res.status(404).json({ error: 'Compétence non trouvée' });
    }

    res.json({
      skill: candidateSkill,
      message: 'Compétence modifiée avec succès'
    });

  } catch (error) {
    console.error('Erreur modification compétence:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de la compétence' });
  }
}));

// Supprimer une compétence
router.delete('/skills/:skillId', asyncHandler(async (req, res) => {
  try {
    const { skillId } = req.params;

    const { error } = await supabase
      .from('candidate_skills')
      .delete()
      .eq('id', skillId)
      .eq('user_id', req.user.id);

    if (error) {
      console.error('Erreur suppression compétence:', error);
      return res.status(500).json({ error: 'Erreur lors de la suppression de la compétence' });
    }

    res.json({ message: 'Compétence supprimée avec succès' });

  } catch (error) {
    console.error('Erreur suppression compétence:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la compétence' });
  }
}));

// Route pour les offres sauvegardées
router.get('/saved-offers', asyncHandler(async (req, res) => {
  try {
    const candidateId = req.user.id;

    // Récupérer les offres sauvegardées du candidat
    const { data: savedOffers } = await supabase
      .from('saved_offers')
      .select(`
        *,
        offers (
          id,
          title,
          description,
          location,
          salary_min,
          salary_max,
          contract_type
        )
      `)
      .eq('user_id', candidateId)
      .order('created_at', { ascending: false });

    res.json({ savedOffers: savedOffers || [] });
  } catch (error) {
    console.error('Erreur récupération offres sauvegardées:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des offres sauvegardées' });
  }
}));

// Générer un CV avec IA
router.post('/cv/generate', asyncHandler(async (req, res) => {
  try {
    const candidateId = req.user.id;
    console.log('POST /cv/generate - Candidat ID:', candidateId);

    // Récupérer les données complètes du candidat
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', candidateId)
      .single();

    if (userError) {
      console.error('Erreur récupération utilisateur:', userError);
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    console.log('Utilisateur trouvé:', user?.name);

    const { data: profile, error: profileError } = await supabase
      .from('candidate_profiles')
      .select('*')
      .eq('user_id', candidateId)
      .single();

    if (profileError) {
      console.error('Erreur récupération profil:', profileError);
      return res.status(404).json({ error: 'Profil candidat non trouvé' });
    }

    // Récupérer les formations
    const { data: educations } = await supabase
      .from('educations')
      .select('*')
      .eq('user_id', candidateId)
      .order('start_date', { ascending: false });

    // Récupérer les expériences
    const { data: experiencesRaw } = await supabase
      .from('experiences')
      .select('*')
      .eq('user_id', candidateId)
      .order('start_date', { ascending: false });

    // Remapper position vers role_title pour la compatibilité
    const experiences = experiencesRaw?.map(exp => ({
      ...exp,
      role_title: exp.position
    })) || [];

    // Récupérer les compétences
    const { data: skills } = await supabase
      .from('candidate_skills')
      .select(`
        *,
        skills (
          id,
          slug,
          display_name,
          category
        )
      `)
      .eq('user_id', candidateId);

    const candidateData = {
      user,
      profile,
      educations: educations || [],
      experiences: experiences || [],
      skills: skills || []
    };

    // Générer le CV avec IA
    console.log('Génération du CV avec IA...');
    const DocumentService = require('../services/documentService');
    const documentService = new DocumentService();
    const result = await documentService.generateCV(candidateData);
    console.log('CV généré:', result);

    // Créer un document dans la table documents
    console.log('Création du document dans la base de données...');
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: candidateId,
        type: 'CV',
        original_name: `CV_${user.name || 'candidat'}_${Date.now()}.html`,
        file_path: result.filepath
      })
      .select('id')
      .single();

    if (docError) {
      console.warn('Erreur création document:', docError);
    } else {
      console.log('Document créé:', document);
      // Créer une version du document
      const { error: versionError } = await supabase
        .from('document_versions')
        .insert({
          document_id: document.id,
          version_number: 1,
          file_url: result.url,
          file_path: result.filepath
        });

      if (versionError) {
        console.warn('Erreur création version document:', versionError);
      } else {
        // Mettre à jour le profil avec l'URL du CV et l'ID du document
        const { error: updateError } = await supabase
          .from('candidate_profiles')
          .update({
            current_cv_document_id: document.id,
            cv_url: result.url
          })
          .eq('user_id', candidateId);

        if (updateError) {
          console.warn('Erreur mise à jour profil avec CV:', updateError);
        }
      }
    }

    console.log('Envoi de la réponse:', { cv_url: result.url });
    res.json({
      cv_url: result.url,
      message: 'CV généré avec succès'
    });

  } catch (error) {
    console.error('Erreur génération CV:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du CV: ' + error.message });
  }
}));

// Générer une lettre de motivation avec IA
router.post('/lm/generate', asyncHandler(async (req, res) => {
  try {
    const candidateId = req.user.id;
    const { offer_id, custom_message } = req.body;

    console.log('POST /lm/generate - Candidat ID:', candidateId, 'Offre ID:', offer_id);

    if (!offer_id) {
      return res.status(400).json({ error: 'ID de l\'offre requis' });
    }

    // Récupérer les données du candidat
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', candidateId)
      .single();

    if (userError) {
      console.error('Erreur récupération utilisateur:', userError);
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('candidate_profiles')
      .select('*')
      .eq('user_id', candidateId)
      .single();

    if (profileError) {
      console.error('Erreur récupération profil:', profileError);
      return res.status(404).json({ error: 'Profil candidat non trouvé' });
    }

    // Récupérer l'offre
    const { data: offer, error: offerError } = await supabase
      .from('job_offers')
      .select(`
        *,
        companies (
          name,
          domain
        )
      `)
      .eq('id', offer_id)
      .single();

    if (offerError) {
      console.error('Erreur récupération offre:', offerError);
      return res.status(404).json({ error: 'Offre non trouvée' });
    }

    console.log('Données récupérées - User:', user?.name, 'Offre:', offer?.title);

    const data = {
      user,
      profile,
      offer,
      customMessage: custom_message
    };

    // Générer la LM avec IA
    console.log('Génération de la lettre de motivation...');
    const DocumentService = require('../services/documentService');
    const documentService = new DocumentService();
    const result = await documentService.generateCoverLetter(data);
    console.log('LM générée:', result);

    // Créer un document dans la table documents
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: candidateId,
        type: 'COVER_LETTER',
        original_name: `LM_${user.name || 'candidat'}_${offer.title || 'offre'}_${Date.now()}.html`,
        file_path: result.filepath
      })
      .select('id')
      .single();

    if (docError) {
      console.warn('Erreur création document LM:', docError);
    } else {
      // Créer une version du document
      const { error: versionError } = await supabase
        .from('document_versions')
        .insert({
          document_id: document.id,
          version_number: 1,
          file_url: result.url,
          file_path: result.filepath
        });

      if (versionError) {
        console.warn('Erreur création version document LM:', versionError);
      } else {
        // Mettre à jour le profil avec l'URL de la LM
        const { error: updateError } = await supabase
          .from('candidate_profiles')
          .update({
            lm_url: result.url
          })
          .eq('user_id', candidateId);

        if (updateError) {
          console.warn('Erreur mise à jour profil avec LM:', updateError);
        }
      }
    }

    res.json({
      lm_url: result.url,
      message: 'Lettre de motivation générée avec succès'
    });

  } catch (error) {
    console.error('Erreur génération LM:', error);
    res.status(500).json({ error: 'Erreur lors de la génération de la lettre de motivation' });
  }
}));

// Upload de CV existant
router.post('/cv/upload', upload.single('cv'), asyncHandler(async (req, res) => {
  try {
    const candidateId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const fileUrl = `/uploads/cv/${req.file.filename}`;
    const filePath = `uploads/cv/${req.file.filename}`;

    // Créer un document dans la table documents
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: candidateId,
        type: 'CV',
        original_name: req.file.originalname,
        file_path: filePath,
        file_size: req.file.size,
        mime_type: req.file.mimetype
      })
      .select('id')
      .single();

    if (docError) {
      console.error('Erreur création document:', docError);
      return res.status(500).json({ error: 'Erreur lors de la sauvegarde du document' });
    }

    // Créer une version du document
    const { error: versionError } = await supabase
      .from('document_versions')
      .insert({
        document_id: document.id,
        version_number: 1,
        file_url: fileUrl,
        file_path: filePath
      });

    if (versionError) {
      console.error('Erreur création version document:', versionError);
      return res.status(500).json({ error: 'Erreur lors de la sauvegarde de la version' });
    }

    // Mettre à jour le profil avec l'URL du CV et l'ID du document
    const { error: updateError } = await supabase
      .from('candidate_profiles')
      .update({
        current_cv_document_id: document.id,
        cv_url: fileUrl
      })
      .eq('user_id', candidateId);

    if (updateError) {
      console.warn('Erreur mise à jour profil avec CV:', updateError);
    }

    // Extraction automatique des compétences et expériences
    try {
      console.log('🔍 Début extraction compétences et expériences depuis le CV...');

      const DocumentParsingService = require('../services/documentParsingService');
      const AIService = require('../services/aiService');

      const documentParser = new DocumentParsingService();
      const aiService = new AIService();

      // Extraire le texte du CV
      const cvText = await documentParser.extractTextFromDocument(filePath, req.file.mimetype);
      const cleanedText = documentParser.cleanExtractedText(cvText);

      if (cleanedText.length > 100) { // Vérifier qu'il y a du contenu
        // Extraire les compétences et expériences avec l'IA
        const { skills, experiences } = await aiService.extractSkillsAndExperiencesFromCV(cleanedText);

        // Sauvegarder les compétences
        if (skills && skills.length > 0) {
          console.log(`💡 Sauvegarde de ${skills.length} compétences extraites...`);

          for (const skill of skills) {
            if (skill.name && skill.name.trim()) {
              // Vérifier si la compétence existe déjà
              const { data: existingSkill } = await supabase
                .from('candidate_skills')
                .select('id')
                .eq('user_id', candidateId)
                .eq('skill_name', skill.name.trim())
                .single();

              if (!existingSkill) {
                await supabase
                  .from('candidate_skills')
                  .insert({
                    user_id: candidateId,
                    skill_name: skill.name.trim(),
                    skill_level: skill.level || 3,
                    skill_category: skill.category || 'autre',
                    source: 'cv_extraction'
                  });
              }
            }
          }
        }

        // Sauvegarder les expériences
        if (experiences && experiences.length > 0) {
          console.log(`💼 Sauvegarde de ${experiences.length} expériences extraites...`);

          for (const exp of experiences) {
            if (exp.company && exp.position) {
              // Vérifier si l'expérience existe déjà
              const { data: existingExp } = await supabase
                .from('experiences')
                .select('id')
                .eq('user_id', candidateId)
                .eq('company', exp.company.trim())
                .eq('position', exp.position.trim())
                .single();

              if (!existingExp) {
                await supabase
                  .from('experiences')
                  .insert({
                    user_id: candidateId,
                    company: exp.company.trim(),
                    position: exp.position.trim(),
                    start_date: exp.start_date || null,
                    end_date: exp.end_date || null,
                    description: exp.description || '',
                    location: exp.location || null,
                    source: 'cv_extraction'
                  });
              }
            }
          }
        }

        console.log('✅ Extraction terminée avec succès');
      } else {
        console.log('⚠️ Pas assez de contenu textuel extrait pour l\'analyse');
      }
    } catch (extractionError) {
      console.error('❌ Erreur lors de l\'extraction:', extractionError);
      // Ne pas faire échouer l'upload si l'extraction échoue
    }

    res.json({
      cv_url: fileUrl,
      message: 'CV uploadé avec succès',
      filename: req.file.originalname
    });

  } catch (error) {
    console.error('Erreur upload CV:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de l\'upload du CV' });
  }
}));

module.exports = router;
