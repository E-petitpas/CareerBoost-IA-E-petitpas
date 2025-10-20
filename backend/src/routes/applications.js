const express = require('express');
const { supabase } = require('../config/supabase');
const { applicationSchemas, validate } = require('../utils/validation');
const { requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Candidater à une offre (candidats uniquement)
router.post('/apply', requireRole('CANDIDATE'), validate(applicationSchemas.apply), asyncHandler(async (req, res) => {
  const { offer_id, custom_message } = req.body;

  // Vérifier que l'offre existe et est active
  const { data: offer, error: offerError } = await supabase
    .from('job_offers')
    .select(`
      id,
      title,
      company_id,
      status,
      companies (
        name,
        domain
      )
    `)
    .eq('id', offer_id)
    .eq('status', 'ACTIVE')
    .single();

  if (offerError || !offer) {
    return res.status(404).json({ error: 'Offre non trouvée ou inactive' });
  }

  // Vérifier que le candidat n'a pas déjà postulé
  const { data: existingApplication } = await supabase
    .from('applications')
    .select('id')
    .eq('offer_id', offer_id)
    .eq('candidate_id', req.user.id)
    .single();

  if (existingApplication) {
    return res.status(409).json({ error: 'Vous avez déjà postulé à cette offre' });
  }

  console.log('Candidature en cours pour:', { offer_id, candidate_id: req.user.id });

  try {
    // Récupérer le profil candidat complet pour le matching
    const { data: candidateProfile, error: profileError } = await supabase
      .from('candidate_profiles')
      .select(`
        *,
        users (id, name, email, city, latitude, longitude),
        candidate_skills (
          *,
          skills (id, slug, display_name)
        )
      `)
      .eq('user_id', req.user.id)
      .single();

    // Récupérer l'offre complète avec ses compétences
    const { data: fullOffer, error: fullOfferError } = await supabase
      .from('job_offers')
      .select(`
        *,
        companies (id, name, sector),
        job_offer_skills (
          is_required,
          weight,
          skills (id, slug, display_name)
        )
      `)
      .eq('id', offer_id)
      .single();

    let score = 0;
    let explanation = "Erreur lors du calcul du score de matching";
    let matchedSkills = [];
    let missingSkills = [];
    let distanceKm = null;
    let hardFilters = {};
    let inputsHash = null;

    if (!profileError && candidateProfile && !fullOfferError && fullOffer) {
      const { calculateMatchingScore } = require('../services/matchingService');
      try {
        const matchResult = await calculateMatchingScore(candidateProfile, fullOffer);
        score = matchResult.score;
        explanation = matchResult.explanation;
        matchedSkills = matchResult.matchedSkills;
        missingSkills = matchResult.missingSkills;
        distanceKm = matchResult.distanceKm;
        hardFilters = matchResult.hardFilters;
        inputsHash = matchResult.inputsHash;
      } catch (error) {
        console.error('Erreur calcul matching:', error);
      }
    }

    // Créer la candidature
    const { data: application, error: applicationError } = await supabase
      .from('applications')
      .insert({
        offer_id,
        candidate_id: req.user.id,
        status: 'ENVOYE',
        score,
        explanation,
        cv_snapshot_url: null,
        lm_snapshot_url: null
      })
      .select(`
        *,
        job_offers (
          title,
          companies (
            name
          )
        )
      `)
      .single();

    if (applicationError) {
      console.error('Erreur création candidature:', applicationError);

      // Vérifier si c'est une erreur de doublon
      if (applicationError.code === '23505') {
        return res.status(409).json({ error: 'Vous avez déjà postulé à cette offre' });
      }

      return res.status(500).json({ error: 'Erreur lors de la candidature' });
    }

    // Créer une trace de matching pour audit et transparence
    if (inputsHash && application) {
      try {
        await supabase
          .from('match_traces')
          .insert({
            application_id: application.id,
            offer_id,
            candidate_id: req.user.id,
            inputs_hash: inputsHash,
            score,
            matched_skills: matchedSkills.map(s => s.skill),
            missing_skills: missingSkills.map(s => s.skill),
            distance_km: distanceKm,
            hard_filters: hardFilters,
            explanation
          });
        console.log('✅ Trace de matching créée:', application.id);
      } catch (traceError) {
        console.error('Erreur création trace matching:', traceError);
        // Ne pas bloquer la candidature si la trace échoue
      }
    }

    // Créer un événement dans l'historique
    await supabase
      .from('application_events')
      .insert({
        application_id: application.id,
        event_type: 'STATUS_CHANGE',
        new_status: 'ENVOYE',
        note: custom_message || 'Candidature envoyée automatiquement',
        actor_user_id: req.user.id
      });

    console.log('✅ Candidature créée avec succès:', application.id);

    res.status(201).json({
      message: 'Candidature envoyée avec succès',
      application: {
        ...application,
        matching_score: score,
        explanation: explanation,
        matched_skills: matchedSkills,
        missing_skills: missingSkills,
        distance_km: distanceKm
      }
    });

  } catch (error) {
    console.error('Erreur lors de la candidature:', error);
    res.status(500).json({ error: 'Erreur lors de la candidature' });
  }
}));

// Récupérer les candidatures du candidat
router.get('/my-applications', requireRole('CANDIDATE'), asyncHandler(async (req, res) => {
  const { data: applications, error } = await supabase
    .from('applications')
    .select(`
      *,
      job_offers (
        id,
        title,
        city,
        contract_type,
        salary_min,
        salary_max,
        currency,
        companies (
          name,
          logo_url
        )
      )
    `)
    .eq('candidate_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur récupération candidatures:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération des candidatures' });
  }

  res.json({ applications });
}));

// Récupérer l'historique d'une candidature
router.get('/:id/events', asyncHandler(async (req, res) => {
  // Vérifier que l'utilisateur a accès à cette candidature
  const { data: application, error: appError } = await supabase
    .from('applications')
    .select('candidate_id, offer_id, job_offers(company_id)')
    .eq('id', req.params.id)
    .single();

  if (appError || !application) {
    return res.status(404).json({ error: 'Candidature non trouvée' });
  }

  // Vérifier les permissions
  const hasAccess = 
    req.user.role === 'ADMIN' ||
    (req.user.role === 'CANDIDATE' && application.candidate_id === req.user.id) ||
    (req.user.role === 'RECRUITER' && req.user.company_memberships?.some(
      membership => membership.company_id === application.job_offers.company_id
    ));

  if (!hasAccess) {
    return res.status(403).json({ error: 'Accès non autorisé' });
  }

  // Récupérer les événements
  const { data: events, error } = await supabase
    .from('application_events')
    .select(`
      *,
      users (
        name,
        role
      )
    `)
    .eq('application_id', req.params.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erreur récupération événements:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
  }

  res.json({ events });
}));

// Mettre à jour le statut d'une candidature (recruteurs et candidats)
router.patch('/:id/status', validate(applicationSchemas.updateStatus), asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  // Récupérer la candidature
  const { data: application, error: appError } = await supabase
    .from('applications')
    .select(`
      *,
      job_offers (
        company_id,
        title,
        companies (
          name
        )
      )
    `)
    .eq('id', req.params.id)
    .single();

  if (appError || !application) {
    return res.status(404).json({ error: 'Candidature non trouvée' });
  }

  // Vérifier les permissions
  const isCandidate = req.user.role === 'CANDIDATE' && application.candidate_id === req.user.id;
  const isRecruiter = req.user.role === 'RECRUITER' && req.user.company_memberships?.some(
    membership => membership.company_id === application.job_offers.company_id
  );
  const isAdmin = req.user.role === 'ADMIN';

  if (!isCandidate && !isRecruiter && !isAdmin) {
    return res.status(403).json({ error: 'Accès non autorisé' });
  }

  // Vérifier les transitions de statut autorisées
  const allowedTransitions = {
    'CANDIDATE': ['EN_ATTENTE'], // Les candidats peuvent seulement marquer comme "en attente"
    'RECRUITER': ['EN_ATTENTE', 'ENTRETIEN', 'REFUS', 'EMBAUCHE'], // Les recruteurs peuvent tout faire
    'ADMIN': ['EN_ATTENTE', 'ENTRETIEN', 'REFUS', 'EMBAUCHE'] // Les admins peuvent tout faire
  };

  if (!allowedTransitions[req.user.role].includes(status)) {
    return res.status(403).json({ error: 'Transition de statut non autorisée' });
  }

  const oldStatus = application.status;

  // Mettre à jour la candidature
  const { data: updatedApplication, error: updateError } = await supabase
    .from('applications')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (updateError) {
    console.error('Erreur mise à jour candidature:', updateError);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
  }

  // Créer un événement dans l'historique
  await supabase
    .from('application_events')
    .insert({
      application_id: req.params.id,
      event_type: 'STATUS_CHANGE',
      old_status: oldStatus,
      new_status: status,
      note,
      actor_user_id: req.user.id
    });

  // TODO: Envoyer une notification au candidat si c'est un recruteur qui change le statut

  res.json({
    message: 'Statut mis à jour avec succès',
    application: updatedApplication
  });
}));

// Ajouter une note à une candidature
router.post('/:id/notes', asyncHandler(async (req, res) => {
  const { note } = req.body;

  if (!note || note.trim().length === 0) {
    return res.status(400).json({ error: 'Note requise' });
  }

  // Vérifier l'accès à la candidature
  const { data: application, error: appError } = await supabase
    .from('applications')
    .select(`
      candidate_id,
      job_offers (
        company_id
      )
    `)
    .eq('id', req.params.id)
    .single();

  if (appError || !application) {
    return res.status(404).json({ error: 'Candidature non trouvée' });
  }

  const hasAccess = 
    req.user.role === 'ADMIN' ||
    (req.user.role === 'CANDIDATE' && application.candidate_id === req.user.id) ||
    (req.user.role === 'RECRUITER' && req.user.company_memberships?.some(
      membership => membership.company_id === application.job_offers.company_id
    ));

  if (!hasAccess) {
    return res.status(403).json({ error: 'Accès non autorisé' });
  }

  // Ajouter la note
  const { data: event, error } = await supabase
    .from('application_events')
    .insert({
      application_id: req.params.id,
      event_type: 'NOTE_ADDED',
      note: note.trim(),
      actor_user_id: req.user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur ajout note:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'ajout de la note' });
  }

  res.status(201).json({
    message: 'Note ajoutée avec succès',
    event
  });
}));

// Route temporaire pour supprimer une candidature (pour les tests)
router.delete('/test-delete/:offerId', requireRole('CANDIDATE'), asyncHandler(async (req, res) => {
  try {
    const { offerId } = req.params;

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('offer_id', offerId)
      .eq('candidate_id', req.user.id);

    if (error) {
      console.error('Erreur suppression candidature:', error);
      return res.status(500).json({ error: 'Erreur lors de la suppression' });
    }

    res.json({ message: 'Candidature supprimée avec succès' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
}));

// Route temporaire pour valider automatiquement l'entreprise d'un recruteur (pour les tests)
router.post('/test-validate-company', requireRole('RECRUITER'), asyncHandler(async (req, res) => {
  try {
    console.log('Validation automatique entreprise pour:', req.user.email);

    // Récupérer les entreprises de l'utilisateur
    const { data: memberships, error: membershipError } = await supabase
      .from('company_memberships')
      .select(`
        company_id,
        companies (
          id,
          name,
          status
        )
      `)
      .eq('user_id', req.user.id)
      .is('removed_at', null);

    if (membershipError || !memberships || memberships.length === 0) {
      return res.status(404).json({ error: 'Aucune entreprise trouvée' });
    }

    // Valider toutes les entreprises en attente
    const companiesToValidate = memberships.filter(m => m.companies.status === 'PENDING');

    if (companiesToValidate.length === 0) {
      return res.json({ message: 'Aucune entreprise à valider (déjà validées)' });
    }

    for (const membership of companiesToValidate) {
      const { error: updateError } = await supabase
        .from('companies')
        .update({
          status: 'VERIFIED',
          validated_at: new Date().toISOString()
        })
        .eq('id', membership.company_id);

      if (updateError) {
        console.error('Erreur validation entreprise:', updateError);
      } else {
        console.log('Entreprise validée:', membership.companies.name);
      }
    }

    res.json({
      message: `${companiesToValidate.length} entreprise(s) validée(s) avec succès`,
      companies: companiesToValidate.map(m => m.companies.name)
    });

  } catch (error) {
    console.error('Erreur validation entreprise:', error);
    res.status(500).json({ error: 'Erreur lors de la validation' });
  }
}));

module.exports = router;
