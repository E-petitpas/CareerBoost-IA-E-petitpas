const express = require('express');
const multer = require('multer');
const path = require('path');
const { supabase } = require('../config/supabase');
const { candidateSchemas, validate } = require('../utils/validation');
const { requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

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
  const { data: experiences } = await supabase
    .from('experiences')
    .select('*')
    .eq('user_id', req.user.id)
    .order('start_date', { ascending: false });

  // Pour l'instant, on ne récupère pas les compétences pour éviter l'erreur de relation
  // TODO: Récupérer les compétences une fois que la relation est correctement configurée

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
        title,
        document_versions (
          file_url,
          version
        )
      `)
      .eq('user_id', req.user.id)
      .eq('type', 'CV')
      .like('title', '%uploadé%')
      .order('created_at', { ascending: false })
      .limit(1);

    if (uploadedCvs?.length > 0 && uploadedCvs[0].document_versions?.length > 0) {
      cv_url = uploadedCvs[0].document_versions[0].file_url;
      console.log('CV uploadé trouvé depuis documents:', cv_url);
    } else {
      // Si pas de CV uploadé, prendre le plus récent (généré ou autre)
      const { data: cvDocuments } = await supabase
        .from('documents')
        .select(`
          id,
          created_at,
          document_versions (
            file_url,
            version
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
      candidate_skills: []
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
  const { data: experience, error } = await supabase
    .from('experiences')
    .insert({
      ...req.body,
      user_id: req.user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur ajout expérience:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'expérience' });
  }

  res.status(201).json({
    experience,
    message: 'Expérience ajoutée avec succès'
  });
}));

// Mettre à jour une expérience
router.put('/experiences/:id', validate(candidateSchemas.experience), asyncHandler(async (req, res) => {
  const { data: experience, error } = await supabase
    .from('experiences')
    .update(req.body)
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

  res.json({
    experience,
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
    .eq('candidate_user_id', req.user.id);

  // Ajouter les nouvelles compétences
  if (req.body.length > 0) {
    const skillsToInsert = req.body.map(skill => ({
      ...skill,
      candidate_user_id: req.user.id
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

// Route pour les offres sauvegardées
router.get('/saved-offers', asyncHandler(async (req, res) => {
  try {
    // Pour l'instant, retourner une liste vide
    // TODO: Implémenter la sauvegarde d'offres
    res.json({ savedOffers: [] });
  } catch (error) {
    console.error('Erreur récupération offres sauvegardées:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des offres sauvegardées' });
  }
}));

// Générer un CV avec IA
router.post('/cv/generate', asyncHandler(async (req, res) => {
  try {
    const candidateId = req.user.id;

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
    const { data: educations, error: educationsError } = await supabase
      .from('candidate_educations')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('start_date', { ascending: false });

    // Récupérer les expériences
    const { data: experiences, error: experiencesError } = await supabase
      .from('candidate_experiences')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('start_date', { ascending: false });

    // Récupérer les compétences
    const { data: skills, error: skillsError } = await supabase
      .from('candidate_skills')
      .select(`
        *,
        skills (
          id,
          name,
          display_name,
          category
        )
      `)
      .eq('candidate_id', candidateId);

    const candidateData = {
      user,
      profile,
      educations: educations || [],
      experiences: experiences || [],
      skills: skills || []
    };

    // Générer le CV avec IA
    const { generateCVService } = require('../services/documentService');
    const result = await generateCVService(candidateData);

    // Créer un document dans la table documents
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: candidateId,
        type: 'CV',
        title: 'CV généré automatiquement'
      })
      .select()
      .single();

    if (docError) {
      console.warn('Erreur création document:', docError);
    } else {
      // Créer une version du document
      const { error: versionError } = await supabase
        .from('document_versions')
        .insert({
          document_id: document.id,
          version: 1,
          file_url: result.url
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

    res.json({
      cv_url: result.url,
      message: 'CV généré avec succès'
    });

  } catch (error) {
    console.error('Erreur génération CV:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du CV' });
  }
}));

// Générer une lettre de motivation avec IA
router.post('/lm/generate', asyncHandler(async (req, res) => {
  try {
    const candidateId = req.user.id;
    const { offer_id, custom_message } = req.body;

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
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('candidate_profiles')
      .select('*')
      .eq('user_id', candidateId)
      .single();

    if (profileError) {
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
      return res.status(404).json({ error: 'Offre non trouvée' });
    }

    const data = {
      user,
      profile,
      offer,
      customMessage: custom_message
    };

    // Générer la LM avec IA
    const { generateCoverLetterService } = require('../services/documentService');
    const result = await generateCoverLetterService(data);

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

    // TODO: Ici on pourrait ajouter l'extraction de données du CV avec une bibliothèque comme pdf-parse
    // Pour l'instant, on sauvegarde juste l'URL du fichier

    // Créer un document dans la table documents
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: candidateId,
        type: 'CV',
        title: `CV uploadé - ${req.file.originalname}`
      })
      .select()
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
        version: 1,
        file_url: fileUrl
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

    res.json({
      cv_url: fileUrl,
      message: 'CV uploadé avec succès',
      filename: req.file.originalname
    });

  } catch (error) {
    console.error('Erreur upload CV:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload du CV' });
  }
}));

module.exports = router;
