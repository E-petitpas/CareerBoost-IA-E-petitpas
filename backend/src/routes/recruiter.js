const express = require('express');
const { supabase } = require('../config/supabase');
const { requireRole, requireCompanyAccess, requireValidatedCompany } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Middleware pour vérifier le rôle recruteur
router.use(requireRole('RECRUITER'));

// Route simple pour vérifier la validation de l'entreprise
router.get('/validation-check', requireValidatedCompany, asyncHandler(async (req, res) => {
  res.json({
    status: 'validated',
    message: 'Entreprise validée, accès autorisé'
  });
}));

// Middleware pour vérifier que l'entreprise est validée (sauf pour le dashboard qui gère lui-même la validation)
router.use((req, res, next) => {
  // Le dashboard et la route de validation gèrent leur propre logique
  if (req.path === '/dashboard' || req.path === '/validation-check') {
    return next();
  }
  // Pour toutes les autres routes, vérifier la validation
  return requireValidatedCompany(req, res, next);
});

// Récupérer le tableau de bord du recruteur
router.get('/dashboard', asyncHandler(async (req, res) => {
  const userCompanies = req.user.company_memberships || [];

  if (userCompanies.length === 0) {
    return res.status(403).json({ error: 'Aucune entreprise trouvée' });
  }

  // Vérifier le statut de l'entreprise
  const verifiedCompanies = userCompanies.filter(
    membership => membership.companies.status === 'VERIFIED'
  );

  const pendingCompanies = userCompanies.filter(
    membership => membership.companies.status === 'PENDING'
  );

  const rejectedCompanies = userCompanies.filter(
    membership => membership.companies.status === 'REJECTED'
  );

  console.log('Dashboard - Statuts entreprises:', {
    verified: verifiedCompanies.length,
    pending: pendingCompanies.length,
    rejected: rejectedCompanies.length,
    user: req.user.email
  });

  // Si des entreprises rejetées
  if (rejectedCompanies.length > 0 && verifiedCompanies.length === 0) {
    console.log('Dashboard - Entreprise rejetée détectée');
    return res.status(403).json({
      error: 'Entreprise rejetée',
      requiresValidation: true,
      rejectedCompany: rejectedCompanies[0].companies,
      status: 'rejected'
    });
  }

  // Si l'entreprise est en attente de validation
  if (verifiedCompanies.length === 0 && pendingCompanies.length > 0) {
    console.log('Dashboard - Entreprise en attente détectée');
    return res.status(403).json({
      error: 'Entreprise en attente de validation',
      requiresValidation: true,
      pendingCompany: pendingCompanies[0].companies,
      status: 'pending'
    });
  }

  // Si aucune entreprise validée
  if (verifiedCompanies.length === 0) {
    console.log('Dashboard - Aucune entreprise trouvée');
    return res.status(403).json({
      error: 'Aucune entreprise validée trouvée',
      requiresValidation: true,
      status: 'none'
    });
  }

  const companyIds = verifiedCompanies.map(membership => membership.company_id);

  // Statistiques des offres
  const { data: offerStats, error: offerError } = await supabase
    .from('job_offers')
    .select('status')
    .in('company_id', companyIds);

  if (offerError) {
    console.error('Erreur stats offres:', offerError);
    return res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }

  // Statistiques des candidatures
  const { data: applicationStats, error: appError } = await supabase
    .from('applications')
    .select(`
      status,
      created_at,
      job_offers!inner (
        company_id
      )
    `)
    .in('job_offers.company_id', companyIds);

  if (appError) {
    console.error('Erreur stats candidatures:', appError);
    return res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }

  // Calculer les statistiques
  const stats = {
    offers: {
      total: offerStats.length,
      active: offerStats.filter(o => o.status === 'ACTIVE').length,
      archived: offerStats.filter(o => o.status === 'ARCHIVED').length,
      expired: offerStats.filter(o => o.status === 'EXPIRED').length
    },
    applications: {
      total: applicationStats.length,
      pending: applicationStats.filter(a => a.status === 'ENVOYE').length,
      inProgress: applicationStats.filter(a => a.status === 'EN_ATTENTE').length,
      interviews: applicationStats.filter(a => a.status === 'ENTRETIEN').length,
      hired: applicationStats.filter(a => a.status === 'EMBAUCHE').length,
      rejected: applicationStats.filter(a => a.status === 'REFUS').length
    },
    companies: userCompanies.map(membership => ({
      id: membership.company_id,
      name: membership.companies.name,
      role: membership.role_in_company,
      isPrimary: membership.is_primary
    }))
  };

  res.json({ stats });
}));

// Récupérer les offres de l'entreprise
router.get('/companies/:companyId/offers', requireCompanyAccess, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const offset = (page - 1) * limit;

  console.log('Récupération offres - Paramètres:', {
    companyId: req.params.companyId,
    page,
    limit,
    status,
    user: req.user.email
  });

  let query = supabase
    .from('job_offers')
    .select(`
      *,
      job_offer_skills (
        is_required,
        skills (
          id,
          slug,
          display_name
        )
      ),
      _count:applications(count)
    `, { count: 'exact' })
    .eq('company_id', req.params.companyId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data: offers, error, count } = await query;

  if (error) {
    console.error('Erreur récupération offres:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération des offres' });
  }

  console.log('Récupération offres - Résultats:', {
    count,
    offersLength: offers?.length || 0,
    firstOffer: offers?.[0]?.id || 'aucune'
  });

  res.json({
    data: offers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
}));

// Récupérer les candidatures pour une offre
router.get('/offers/:offerId/applications', asyncHandler(async (req, res) => {
  const { sort = 'score_desc', page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  // Vérifier que l'offre appartient à l'entreprise de l'utilisateur
  const { data: offer, error: offerError } = await supabase
    .from('job_offers')
    .select('company_id')
    .eq('id', req.params.offerId)
    .single();

  if (offerError || !offer) {
    return res.status(404).json({ error: 'Offre non trouvée' });
  }

  const userCompany = req.user.company_memberships?.find(
    membership => membership.company_id === offer.company_id
  );

  if (!userCompany) {
    return res.status(403).json({ error: 'Accès non autorisé à cette offre' });
  }

  // Construire la requête de tri
  let orderBy = 'created_at';
  let ascending = false;

  switch (sort) {
    case 'score_desc':
      orderBy = 'score';
      ascending = false;
      break;
    case 'score_asc':
      orderBy = 'score';
      ascending = true;
      break;
    case 'date_desc':
      orderBy = 'created_at';
      ascending = false;
      break;
    case 'date_asc':
      orderBy = 'created_at';
      ascending = true;
      break;
    case 'status':
      orderBy = 'status';
      ascending = true;
      break;
  }

  const { data: applications, error, count } = await supabase
    .from('applications')
    .select(`
      *,
      users (
        id,
        name,
        email,
        phone,
        city,
        candidate_profiles (
          title,
          summary,
          experience_years,
          cv_url,
          candidate_skills (
            proficiency_level,
            skills (
              id,
              slug,
              display_name
            )
          )
        )
      )
    `, { count: 'exact' })
    .eq('offer_id', req.params.offerId)
    .order(orderBy, { ascending })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Erreur récupération candidatures:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération des candidatures' });
  }

  res.json({
    applications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
}));

// Récupérer toutes les candidatures de l'entreprise
router.get('/companies/:companyId/applications', requireCompanyAccess, asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('applications')
    .select(`
      *,
      job_offers (
        id,
        title,
        contract_type
      ),
      users (
        id,
        name,
        email,
        city,
        photo_url,
        candidate_profiles (
          title,
          experience_years,
          cv_url
        )
      )
    `, { count: 'exact' })
    .eq('job_offers.company_id', req.params.companyId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data: applications, error, count } = await query;

  if (error) {
    console.error('Erreur récupération candidatures entreprise:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération des candidatures' });
  }

  // Calculer le score de matching pour chaque candidature
  const applicationsWithScores = await Promise.all(applications.map(async (application) => {
    let score = 0;
    let explanation = "Score non calculé";

    try {
      // Récupérer les données complètes du candidat
      const { data: candidateProfile, error: profileError } = await supabase
        .from('candidate_profiles')
        .select(`
          *,
          users!candidate_profiles_user_id_fkey (
            id,
            name,
            email,
            city,
            latitude,
            longitude,
            photo_url,
            candidate_skills (
              level,
              years_experience,
              skills (
                id,
                slug,
                display_name,
                category
              )
            ),
            experiences (
              company,
              position,
              start_date,
              end_date,
              description
            )
          )
        `)
        .eq('user_id', application.users.id)
        .single();

      // Récupérer les données complètes de l'offre
      const { data: fullOffer, error: offerError } = await supabase
        .from('job_offers')
        .select(`
          *,
          companies (
            id,
            name,
            city,
            latitude,
            longitude
          ),
          job_offer_skills (
            is_required,
            skills (
              id,
              slug,
              display_name
            )
          )
        `)
        .eq('id', application.offer_id)
        .single();

      console.log(`🔍 Calcul matching pour candidature ${application.id} - Candidat: ${application.users?.name}, Offre: ${application.offer_id}`);

      if (profileError) {
        console.error(`❌ Erreur récupération profil candidat ${application.users.id}:`, profileError);
        explanation = "Profil candidat introuvable";
      } else if (!candidateProfile) {
        console.warn(`⚠️ Aucun profil candidat trouvé pour user_id: ${application.users.id}`);
        explanation = "Profil candidat non configuré";
      } else if (offerError) {
        console.error(`❌ Erreur récupération offre ${application.offer_id}:`, offerError);
        explanation = "Offre d'emploi introuvable";
      } else if (!fullOffer) {
        console.warn(`⚠️ Aucune offre trouvée pour offer_id: ${application.offer_id}`);
        explanation = "Offre d'emploi non trouvée";
      } else {
        // Restructurer les données pour le matching service
        // Le service attend candidate_skills au niveau racine
        const candidateForMatching = {
          ...candidateProfile,
          candidate_skills: candidateProfile.users?.candidate_skills || [],
          experiences: candidateProfile.users?.experiences || []
        };

        console.log(`✅ Données récupérées - Candidat: ${candidateProfile.users?.name}, Skills: ${candidateForMatching.candidate_skills?.length || 0}, Offre: ${fullOffer.title}, Skills requises: ${fullOffer.job_offer_skills?.length || 0}`);

        const { calculateMatchingScore } = require('../services/matchingService');
        const matchResult = await calculateMatchingScore(candidateForMatching, fullOffer);
        score = matchResult.score;
        explanation = matchResult.explanation;

        console.log(`🎯 Score calculé: ${score}% - ${explanation}`);
      }
    } catch (error) {
      console.error('❌ Erreur calcul matching pour candidature:', application.id, error);
      explanation = "Erreur lors du calcul du score de matching";
    }

    return {
      ...application,
      score,
      explanation
    };
  }));

  res.json({
    data: applicationsWithScores,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
}));

// Activer l'option premium pour une offre
router.patch('/offers/:offerId/premium', asyncHandler(async (req, res) => {
  const { duration = 30 } = req.body; // Durée en jours

  // Vérifier l'accès à l'offre
  const { data: offer, error: offerError } = await supabase
    .from('job_offers')
    .select('company_id, premium_until')
    .eq('id', req.params.offerId)
    .single();

  if (offerError || !offer) {
    return res.status(404).json({ error: 'Offre non trouvée' });
  }

  const userCompany = req.user.company_memberships?.find(
    membership => membership.company_id === offer.company_id
  );

  if (!userCompany) {
    return res.status(403).json({ error: 'Accès non autorisé à cette offre' });
  }

  // Calculer la nouvelle date d'expiration premium
  const premiumUntil = new Date();
  premiumUntil.setDate(premiumUntil.getDate() + duration);

  const { data: updatedOffer, error: updateError } = await supabase
    .from('job_offers')
    .update({
      premium_until: premiumUntil.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', req.params.offerId)
    .select()
    .single();

  if (updateError) {
    console.error('Erreur activation premium:', updateError);
    return res.status(500).json({ error: 'Erreur lors de l\'activation du premium' });
  }

  res.json({
    message: 'Option premium activée avec succès',
    offer: updatedOffer
  });
}));

// Exporter les candidatures en CSV
router.get('/companies/:companyId/applications/export', requireCompanyAccess, asyncHandler(async (req, res) => {
  const { data: applications, error } = await supabase
    .from('applications')
    .select(`
      id,
      status,
      score,
      created_at,
      updated_at,
      job_offers (
        title,
        contract_type
      ),
      users (
        name,
        email,
        phone,
        city,
        candidate_profiles (
          title,
          experience_years,
          cv_url
        )
      )
    `)
    .eq('job_offers.company_id', req.params.companyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur export candidatures:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'export des candidatures' });
  }

  // Convertir en format CSV
  const csvHeaders = [
    'ID',
    'Candidat',
    'Email',
    'Téléphone',
    'Ville',
    'Titre visé',
    'Expérience (années)',
    'Offre',
    'Type de contrat',
    'Statut',
    'Score',
    'Date de candidature',
    'Dernière mise à jour'
  ];

  const csvRows = applications.map(app => [
    app.id,
    app.users.name,
    app.users.email,
    app.users.phone || '',
    app.users.city || '',
    app.users.candidate_profiles?.title || '',
    app.users.candidate_profiles?.experience_years || 0,
    app.job_offers.title,
    app.job_offers.contract_type || '',
    app.status,
    app.score || '',
    new Date(app.created_at).toLocaleDateString('fr-FR'),
    new Date(app.updated_at).toLocaleDateString('fr-FR')
  ]);

  const csvContent = [csvHeaders, ...csvRows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="candidatures.csv"');
  res.send('\ufeff' + csvContent); // BOM pour Excel
}));

module.exports = router;
