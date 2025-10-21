const express = require('express');
const { supabase } = require('../config/supabase');
const { offerSchemas, validate } = require('../utils/validation');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Rechercher des offres (accessible à tous les utilisateurs authentifiés)
router.get('/search', authenticateToken, validate(offerSchemas.search), asyncHandler(async (req, res) => {
  const { near, radius, minScore, contract_type, experience_min, salary_min, source, page, limit } = req.query;

  console.log('Recherche offres candidats - Paramètres:', { near, radius, minScore, contract_type, experience_min, salary_min, source, page, limit });

  let query = supabase
    .from('job_offers')
    .select(`
      id,
      title,
      description,
      city,
      latitude,
      longitude,
      contract_type,
      experience_min,
      salary_min,
      salary_max,
      currency,
      source,
      source_url,
      premium_until,
      published_at,
      admin_status,
      companies (
        id,
        name,
        logo_url,
        sector
      ),
      job_offer_skills (
        is_required,
        weight,
        skills (
          id,
          slug,
          display_name
        )
      )
    `)
    .eq('status', 'ACTIVE') // Offres actives
    .eq('admin_status', 'APPROVED') // ✅ SEULEMENT les offres approuvées par l'admin
    .gte('published_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()) // Offres des 90 derniers jours
    .order('premium_until', { ascending: false, nullsLast: true })
    .order('published_at', { ascending: false });

  console.log('Recherche offres candidats - Filtres appliqués: status=ACTIVE, admin_status=APPROVED');

  // Filtres optionnels
  if (contract_type) {
    query = query.eq('contract_type', contract_type);
  }

  if (experience_min !== undefined) {
    query = query.lte('experience_min', experience_min);
  }

  if (salary_min !== undefined) {
    query = query.gte('salary_min', salary_min);
  }

  if (source) {
    query = query.eq('source', source);
  }

  // Pagination
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data: offers, error, count } = await query;

  if (error) {
    console.error('Erreur recherche offres:', error);
    return res.status(500).json({ error: 'Erreur lors de la recherche d\'offres' });
  }

  // Récupérer le profil candidat complet pour le matching (optionnel)
  const { data: candidateProfile, error: profileError } = await supabase
    .from('candidate_profiles')
    .select(`
      *,
      users (id, name, email, city, latitude, longitude)
    `)
    .eq('user_id', req.user.id)
    .maybeSingle();

  // Récupérer les compétences du candidat séparément
  let candidateSkills = [];
  if (candidateProfile) {
    const { data: skillsData, error: skillsError } = await supabase
      .from('candidate_skills')
      .select(`
        *,
        skills (id, slug, display_name)
      `)
      .eq('user_id', req.user.id);

    if (!skillsError && skillsData) {
      candidateSkills = skillsData;
    }
  }

  // Ajouter les compétences au profil
  if (candidateProfile) {
    candidateProfile.candidate_skills = candidateSkills;
  }

  // DEBUG: Afficher les informations du profil
  console.log('=== DEBUG GET /offers/search ===');
  console.log('User ID:', req.user.id);
  console.log('Profile Error:', profileError);
  console.log('Profile exists:', !!candidateProfile);
  if (candidateProfile) {
    console.log('Profile skills count:', candidateProfile.candidate_skills?.length || 0);
    console.log('Profile skills:', candidateProfile.candidate_skills);
  }
  console.log('================================');

  // Calculer les scores de matching pour chaque offre
  const { calculateMatchingScore } = require('../services/matchingService');
  const offersWithScore = await Promise.all(offers.map(async (offer) => {
    try {
      // Vérifier si le profil est complet
      // Un profil est complet s'il existe ET a au moins une compétence
      const isProfileComplete = !profileError && candidateProfile &&
                                candidateProfile.candidate_skills &&
                                candidateProfile.candidate_skills.length > 0;

      if (isProfileComplete) {
        const matchResult = await calculateMatchingScore(candidateProfile, offer);
        return {
          ...offer,
          score: matchResult.score,
          explanation: matchResult.explanation,
          matched_skills: matchResult.matchedSkills,
          missing_skills: matchResult.missingSkills,
          distance_km: matchResult.distanceKm
        };
      } else {
        // Sinon, retourner l'offre sans score
        if (!candidateProfile) {
          console.warn('⚠️ Profil candidat inexistant pour:', req.user.id);
        } else if (!candidateProfile.candidate_skills || candidateProfile.candidate_skills.length === 0) {
          console.warn('⚠️ Profil candidat sans compétences pour:', req.user.id);
        }
        return {
          ...offer,
          score: null,
          explanation: 'Complétez votre profil (ajoutez vos compétences) pour voir le score de matching',
          matched_skills: [],
          missing_skills: [],
          distance_km: null
        };
      }
    } catch (error) {
      console.error('❌ Erreur calcul matching pour offre', offer.id, ':', error);
      return {
        ...offer,
        score: null,
        explanation: 'Erreur lors du calcul du score de matching',
        matched_skills: [],
        missing_skills: [],
        distance_km: null
      };
    }
  }));

  res.json({
    data: offersWithScore,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
}));

// Récupérer une offre spécifique
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { data: offer, error } = await supabase
    .from('job_offers')
    .select(`
      *,
      companies (
        id,
        name,
        logo_url,
        sector,
        size_employees
      ),
      job_offer_skills (
        is_required,
        weight,
        skills (
          id,
          slug,
          display_name
        )
      )
    `)
    .eq('id', req.params.id)
    .eq('status', 'ACTIVE')
    .single();

  if (error || !offer) {
    return res.status(404).json({ error: 'Offre non trouvée' });
  }

  // Calculer le score de matching pour cette offre spécifique (optionnel)
  const { data: candidateProfile, error: profileError } = await supabase
    .from('candidate_profiles')
    .select(`
      *,
      users (id, name, email, city, latitude, longitude)
    `)
    .eq('user_id', req.user.id)
    .maybeSingle();

  // Récupérer les compétences du candidat séparément
  let candidateSkills = [];
  if (candidateProfile) {
    const { data: skillsData, error: skillsError } = await supabase
      .from('candidate_skills')
      .select(`
        *,
        skills (id, slug, display_name)
      `)
      .eq('user_id', req.user.id);

    if (!skillsError && skillsData) {
      candidateSkills = skillsData;
    }
  }

  // Ajouter les compétences au profil
  if (candidateProfile) {
    candidateProfile.candidate_skills = candidateSkills;
  }

  // DEBUG: Afficher les informations du profil
  console.log('=== DEBUG GET /offers/:id ===');
  console.log('User ID:', req.user.id);
  console.log('Offer ID:', offer.id);
  console.log('Profile Error:', profileError);
  console.log('Profile exists:', !!candidateProfile);
  if (candidateProfile) {
    console.log('Profile skills count:', candidateProfile.candidate_skills?.length || 0);
    console.log('Profile skills:', candidateProfile.candidate_skills);
  }
  console.log('============================');

  // Vérifier si le profil est complet
  const isProfileComplete = !profileError && candidateProfile &&
                            candidateProfile.candidate_skills &&
                            candidateProfile.candidate_skills.length > 0;

  if (isProfileComplete) {
    const { calculateMatchingScore } = require('../services/matchingService');
    try {
      const matchResult = await calculateMatchingScore(candidateProfile, offer);
      offer.score = matchResult.score;
      offer.explanation = matchResult.explanation;
      offer.matched_skills = matchResult.matchedSkills;
      offer.missing_skills = matchResult.missingSkills;
      offer.distance_km = matchResult.distanceKm;
    } catch (error) {
      console.error('❌ Erreur calcul matching:', error);
      offer.score = null;
      offer.explanation = 'Erreur lors du calcul du score de matching';
      offer.matched_skills = [];
      offer.missing_skills = [];
    }
  } else {
    if (!candidateProfile) {
      console.warn('⚠️ Profil candidat inexistant pour:', req.user.id);
    } else if (!candidateProfile.candidate_skills || candidateProfile.candidate_skills.length === 0) {
      console.warn('⚠️ Profil candidat sans compétences pour:', req.user.id);
    }
    offer.score = null;
    offer.explanation = 'Complétez votre profil (ajoutez vos compétences) pour voir le score de matching';
    offer.matched_skills = [];
    offer.missing_skills = [];
  }

  res.json({ offer });
}));

// Créer une nouvelle offre (recruteurs uniquement)
router.post('/', authenticateToken, requireRole('RECRUITER'), validate(offerSchemas.create), asyncHandler(async (req, res) => {
  const { required_skills, optional_skills, ...offerData } = req.body;

  console.log('Création offre - Données reçues:', {
    offerData,
    required_skills,
    optional_skills,
    user: req.user.email
  });

  // Vérifier que l'utilisateur appartient à une entreprise validée
  const userCompany = req.user.company_memberships?.find(
    membership => membership.companies.status === 'VERIFIED'
  );

  console.log('Création offre - Entreprise utilisateur:', userCompany);

  if (!userCompany) {
    console.log('Création offre - Erreur: Entreprise non validée');
    return res.status(403).json({ error: 'Votre entreprise doit être validée pour publier des offres' });
  }

  // Générer un hash de déduplication pour les offres internes
  const crypto = require('crypto');
  const generateInternalDedupHash = (offerData, companyId) => {
    const title = (offerData.title || '').toLowerCase().trim();
    const company = companyId || '';
    const location = (offerData.city || 'unknown').toLowerCase().trim();
    const description = (offerData.description || '').toLowerCase().trim().substring(0, 100); // Premiers 100 caractères

    const key = `internal|${title}|${company}|${location}|${description}`;
    return crypto.createHash('sha256').update(key, 'utf8').digest('hex');
  };

  // Créer l'offre (ACTIVE mais en attente de validation admin selon cahier des charges)
  const offerToInsert = {
    ...offerData,
    company_id: userCompany.company_id,
    source: 'INTERNAL',
    status: 'ACTIVE',
    admin_status: 'PENDING', // ✅ Nouvelles offres en attente de validation admin
    dedup_hash: generateInternalDedupHash(offerData, userCompany.company_id),
    // Note: L'offre est créée mais nécessite validation admin avant d'être visible aux candidats
  };

  console.log('Création offre - Données à insérer:', offerToInsert);

  const { data: offer, error: offerError } = await supabase
    .from('job_offers')
    .insert(offerToInsert)
    .select()
    .single();

  if (offerError) {
    console.error('Erreur création offre:', offerError);

    // Gestion spécifique des erreurs de contrainte unique (très rare pour les offres internes)
    if (offerError.code === '23505' && offerError.message.includes('unique_dedup_hash')) {
      return res.status(409).json({
        error: 'Une offre similaire existe déjà. Veuillez modifier le titre ou la description.'
      });
    }

    return res.status(500).json({ error: 'Erreur lors de la création de l\'offre' });
  }

  console.log('Création offre - Offre créée avec succès:', offer.id);

  // Ajouter les compétences requises
  if (required_skills && required_skills.length > 0) {
    const requiredSkillsData = required_skills.map(skillId => ({
      job_offer_id: offer.id,
      skill_id: skillId,
      is_required: true,
      weight: 3
    }));

    await supabase
      .from('job_offer_skills')
      .insert(requiredSkillsData);
  }

  // Ajouter les compétences optionnelles
  if (optional_skills && optional_skills.length > 0) {
    const optionalSkillsData = optional_skills.map(skillId => ({
      job_offer_id: offer.id,
      skill_id: skillId,
      is_required: false,
      weight: 1
    }));

    await supabase
      .from('job_offer_skills')
      .insert(optionalSkillsData);
  }

  res.status(201).json({ 
    message: 'Offre créée avec succès',
    offer 
  });
}));

// Mettre à jour une offre
router.put('/:id', authenticateToken, requireRole('RECRUITER'), validate(offerSchemas.create), asyncHandler(async (req, res) => {
  const { required_skills, optional_skills, ...offerData } = req.body;

  // Vérifier que l'offre appartient à l'entreprise de l'utilisateur
  const { data: existingOffer, error: checkError } = await supabase
    .from('job_offers')
    .select('company_id')
    .eq('id', req.params.id)
    .single();

  if (checkError || !existingOffer) {
    return res.status(404).json({ error: 'Offre non trouvée' });
  }

  const userCompany = req.user.company_memberships?.find(
    membership => membership.company_id === existingOffer.company_id
  );

  if (!userCompany) {
    return res.status(403).json({ error: 'Accès non autorisé à cette offre' });
  }

  // Mettre à jour l'offre
  const { data: offer, error: updateError } = await supabase
    .from('job_offers')
    .update({
      ...offerData,
      updated_at: new Date().toISOString()
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (updateError) {
    console.error('Erreur mise à jour offre:', updateError);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'offre' });
  }

  // Supprimer les anciennes compétences
  await supabase
    .from('job_offer_skills')
    .delete()
    .eq('job_offer_id', req.params.id);

  // Ajouter les nouvelles compétences
  const allSkills = [
    ...(required_skills || []).map(skillId => ({
      job_offer_id: req.params.id,
      skill_id: skillId,
      is_required: true,
      weight: 3
    })),
    ...(optional_skills || []).map(skillId => ({
      job_offer_id: req.params.id,
      skill_id: skillId,
      is_required: false,
      weight: 1
    }))
  ];

  if (allSkills.length > 0) {
    await supabase
      .from('job_offer_skills')
      .insert(allSkills);
  }

  res.json({ 
    message: 'Offre mise à jour avec succès',
    offer 
  });
}));

// Archiver une offre
router.patch('/:id/archive', authenticateToken, requireRole('RECRUITER'), asyncHandler(async (req, res) => {
  // Vérifier l'accès à l'offre
  const { data: existingOffer, error: checkError } = await supabase
    .from('job_offers')
    .select('company_id')
    .eq('id', req.params.id)
    .single();

  if (checkError || !existingOffer) {
    return res.status(404).json({ error: 'Offre non trouvée' });
  }

  const userCompany = req.user.company_memberships?.find(
    membership => membership.company_id === existingOffer.company_id
  );

  if (!userCompany) {
    return res.status(403).json({ error: 'Accès non autorisé à cette offre' });
  }

  // Archiver l'offre
  const { error } = await supabase
    .from('job_offers')
    .update({ 
      status: 'ARCHIVED',
      updated_at: new Date().toISOString()
    })
    .eq('id', req.params.id);

  if (error) {
    console.error('Erreur archivage offre:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'archivage de l\'offre' });
  }

  res.json({ message: 'Offre archivée avec succès' });
}));

module.exports = router;
