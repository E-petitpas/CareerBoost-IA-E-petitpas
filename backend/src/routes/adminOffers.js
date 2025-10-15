const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const offerAggregationService = require('../services/offerAggregationService');

// Middleware pour vérifier que l'utilisateur est admin
router.use(authenticateToken);
router.use(requireRole('ADMIN'));

// Récupérer les statistiques des offres pour l'admin
router.get('/stats', asyncHandler(async (req, res) => {
  console.log('Admin Offers Stats - Début');

  try {
    console.log('Admin Offers Stats - Début de la requête...');

    // Statistiques avec la vraie colonne admin_status
    const { data: allOffers, error: allOffersError } = await supabase
      .from('job_offers')
      .select('id, status, admin_status, created_at');

    console.log('Admin Offers Stats - Requête terminée:', {
      error: allOffersError ? allOffersError.message : null,
      count: allOffers?.length || 0
    });

    if (allOffersError) {
      console.error('Erreur récupération offres:', allOffersError);
      return res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
    }

    const now = new Date();
    console.log('Admin Offers Stats - Calcul des statistiques...');

    // Calcul des statistiques avec la vraie colonne admin_status
    const stats = {
      total: allOffers.length,
      pending: allOffers.filter(offer => offer.admin_status === 'PENDING').length,
      approved: allOffers.filter(offer => offer.admin_status === 'APPROVED').length,
      flagged: allOffers.filter(offer => offer.admin_status === 'FLAGGED').length,
      expired: allOffers.filter(offer => offer.status === 'EXPIRED').length, // Utiliser le status au lieu d'expires_at
      duplicates: 0 // TODO: Implémenter la détection de doublons
    };

    console.log('Admin Offers Stats - Résultats:', stats);
    res.json(stats);

  } catch (error) {
    console.error('Erreur stats offres admin:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques',
      details: error.message
    });
  }
}));

// Récupérer toutes les offres avec filtres pour l'admin
router.get('/', asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    status, 
    admin_status, 
    source, 
    search 
  } = req.query;

  console.log('Admin Offers - Paramètres:', {
    page, limit, status, admin_status, source, search
  });

  try {
    const offset = (page - 1) * limit;

    // Construction de la requête
    let query = supabase
      .from('job_offers')
      .select(`
        id,
        title,
        description,
        city,
        contract_type,
        experience_min,
        salary_min,
        salary_max,
        status,
        admin_status,
        source,
        created_at,
        companies (
          id,
          name,
          status
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    console.log('Admin Offers - Requête construite');

    // Filtres
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Filtrage par admin_status (vraie colonne maintenant)
    if (admin_status && admin_status !== 'all') {
      query = query.eq('admin_status', admin_status);
    }

    console.log('Admin Offers - Filtres appliqués:', { status, admin_status });

    if (source && source !== 'all') {
      query = query.eq('source', source);
    }

    if (search) {
      // Pour la recherche, on filtre seulement sur le titre de l'offre
      // La recherche sur le nom de l'entreprise nécessiterait une requête plus complexe
      query = query.ilike('title', `%${search}%`);
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    console.log('Admin Offers - Exécution de la requête...');
    const { data: offers, error, count } = await query;

    console.log('Admin Offers - Résultat requête:', {
      error: error ? error.message : null,
      count,
      offersLength: offers?.length || 0,
      firstOffer: offers?.[0]?.title || 'aucune',
      allOffers: offers?.map(o => ({ id: o.id, title: o.title, company: o.companies?.name })) || []
    });

    if (error) {
      console.error('Erreur récupération offres admin:', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération des offres' });
    }

    // Récupérer le nombre de candidatures pour chaque offre
    const offerIds = offers.map(offer => offer.id);
    const { data: applications, error: appError } = await supabase
      .from('applications')
      .select('offer_id')
      .in('offer_id', offerIds);

    if (appError) {
      console.error('Erreur récupération candidatures:', appError);
    }

    // Ajouter le count des candidatures (admin_status vient maintenant de la DB)
    const offersWithCounts = offers.map(offer => ({
      ...offer,
      _count: {
        applications: applications ? applications.filter(app => app.offer_id === offer.id).length : 0
      }
    }));

    console.log('Admin Offers - Résultats:', {
      count,
      offersLength: offers.length
    });

    res.json({
      data: offersWithCounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Erreur récupération offres admin:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des offres' });
  }
}));

// Mettre à jour le statut admin d'une offre
router.post('/:offerId/status', asyncHandler(async (req, res) => {
  const { offerId } = req.params;
  const { action } = req.body;

  console.log('Admin Offers - Mise à jour statut:', { offerId, action, admin: req.user.email });

  if (!['approve', 'reject', 'flag'].includes(action)) {
    return res.status(400).json({ error: 'Action invalide' });
  }

  try {
    // Vérifier que l'offre existe
    const { data: offer, error: offerError } = await supabase
      .from('job_offers')
      .select('id, title, companies(name)')
      .eq('id', offerId)
      .single();

    if (offerError || !offer) {
      console.error('Offre non trouvée:', offerError);
      return res.status(404).json({ error: 'Offre non trouvée' });
    }

    // Déterminer le nouveau statut
    let newAdminStatus;
    switch (action) {
      case 'approve':
        newAdminStatus = 'APPROVED';
        break;
      case 'reject':
        newAdminStatus = 'REJECTED';
        break;
      case 'flag':
        newAdminStatus = 'FLAGGED';
        break;
    }

    // Workflow de validation selon cahier des charges
    let newStatus = offer.status;
    let message = '';

    if (action === 'approve') {
      // Approuver = rendre visible aux candidats (garder ACTIVE)
      newStatus = 'ACTIVE';
      message = 'Offre approuvée et visible aux candidats';
    } else if (action === 'reject') {
      // Rejeter = archiver (invisible aux candidats)
      newStatus = 'ARCHIVED';
      message = 'Offre rejetée et archivée';
    } else if (action === 'flag') {
      // Signaler = garder le statut mais marquer pour révision
      newStatus = offer.status;
      message = 'Offre signalée pour révision';
    }

    const { data: updatedOffer, error: updateError } = await supabase
      .from('job_offers')
      .update({
        status: newStatus,
        admin_status: newAdminStatus
      })
      .eq('id', offerId)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur mise à jour statut:', updateError);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
    }

    console.log('Admin Offers - Statut mis à jour:', {
      offerId,
      newStatus: newAdminStatus,
      title: offer.title
    });

    res.json({
      message,
      offer: updatedOffer
    });

  } catch (error) {
    console.error('Erreur mise à jour statut offre:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
  }
}));

// Récupérer les détails d'une offre pour l'admin
router.get('/:offerId', asyncHandler(async (req, res) => {
  const { offerId } = req.params;

  console.log('Admin Offers - Détails offre:', { offerId });

  try {
    const { data: offer, error } = await supabase
      .from('job_offers')
      .select(`
        *,
        companies (
          id,
          name,
          siren,
          domain,
          status
        ),
        job_offer_skills (
          skill_id,
          is_required,
          skills (
            id,
            name,
            category
          )
        )
      `)
      .eq('id', offerId)
      .single();

    if (error || !offer) {
      console.error('Offre non trouvée:', error);
      return res.status(404).json({ error: 'Offre non trouvée' });
    }

    // Récupérer les candidatures
    const { data: applications, error: appError } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        created_at,
        users (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('offer_id', offerId);

    if (appError) {
      console.error('Erreur récupération candidatures:', appError);
    }

    res.json({
      offer: {
        ...offer,
        applications: applications || []
      }
    });

  } catch (error) {
    console.error('Erreur récupération détails offre:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des détails' });
  }
}));

// ===== ROUTES FRANCE TRAVAIL =====

// Obtenir les statistiques France Travail
router.get('/france-travail/stats', asyncHandler(async (req, res) => {
  try {
    console.log('Admin France Travail Stats - Début');

    // Utiliser la fonction SQL pour obtenir les statistiques
    const { data: stats, error } = await supabase
      .rpc('get_france_travail_stats');

    if (error) {
      console.error('Erreur récupération stats France Travail:', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
    }

    // Obtenir le statut du service d'agrégation
    const aggregationStatus = offerAggregationService.getStatus();

    // Obtenir les dernières synchronisations
    const syncHistory = await offerAggregationService.getSyncStats(5);

    res.json({
      stats: stats[0] || {
        total_offers: 0,
        pending_offers: 0,
        approved_offers: 0,
        rejected_offers: 0,
        last_sync_date: null,
        avg_daily_offers: 0
      },
      aggregationStatus,
      syncHistory
    });

  } catch (error) {
    console.error('Erreur stats France Travail:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
}));

// Lancer une synchronisation manuelle
router.post('/france-travail/sync', asyncHandler(async (req, res) => {
  try {
    console.log('Admin France Travail Sync - Début synchronisation manuelle');

    const result = await offerAggregationService.manualSync();

    res.json({
      success: true,
      message: 'Synchronisation lancée avec succès',
      ...result
    });

  } catch (error) {
    console.error('Erreur synchronisation manuelle France Travail:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la synchronisation'
    });
  }
}));

// Obtenir les offres France Travail en attente
router.get('/france-travail/pending', asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    console.log('Admin France Travail Pending - Paramètres:', { page, limit, offset });

    const { data: offers, error, count } = await supabase
      .from('france_travail_pending_offers')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération offres France Travail en attente:', error);
      return res.status(500).json({ error: 'Erreur lors de la récupération des offres' });
    }

    res.json({
      offers: offers || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Erreur récupération offres France Travail en attente:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des offres' });
  }
}));

// Approuver une offre France Travail
router.post('/france-travail/:offerId/approve', asyncHandler(async (req, res) => {
  try {
    const { offerId } = req.params;
    const { reason } = req.body;

    console.log('Admin France Travail Approve - Offre:', offerId);

    // Vérifier que l'offre existe et est en attente
    const { data: offer, error: fetchError } = await supabase
      .from('job_offers')
      .select('id, title, admin_status, source, france_travail_id')
      .eq('id', offerId)
      .eq('source', 'EXTERNAL')
      .eq('admin_status', 'PENDING')
      .single();

    if (fetchError || !offer) {
      return res.status(404).json({ error: 'Offre non trouvée ou déjà traitée' });
    }

    // Approuver l'offre
    const { error: updateError } = await supabase
      .from('job_offers')
      .update({
        admin_status: 'APPROVED',
        updated_at: new Date().toISOString()
      })
      .eq('id', offerId);

    if (updateError) {
      console.error('Erreur approbation offre:', updateError);
      return res.status(500).json({ error: 'Erreur lors de l\'approbation' });
    }

    console.log(`Offre France Travail approuvée: ${offer.title} (ID: ${offerId})`);

    res.json({
      success: true,
      message: 'Offre approuvée avec succès',
      offer: {
        id: offerId,
        title: offer.title,
        admin_status: 'APPROVED'
      }
    });

  } catch (error) {
    console.error('Erreur approbation offre France Travail:', error);
    res.status(500).json({ error: 'Erreur lors de l\'approbation' });
  }
}));

// Rejeter une offre France Travail
router.post('/france-travail/:offerId/reject', asyncHandler(async (req, res) => {
  try {
    const { offerId } = req.params;
    const { reason } = req.body;

    console.log('Admin France Travail Reject - Offre:', offerId, 'Raison:', reason);

    // Vérifier que l'offre existe et est en attente
    const { data: offer, error: fetchError } = await supabase
      .from('job_offers')
      .select('id, title, admin_status, source, france_travail_id')
      .eq('id', offerId)
      .eq('source', 'EXTERNAL')
      .eq('admin_status', 'PENDING')
      .single();

    if (fetchError || !offer) {
      return res.status(404).json({ error: 'Offre non trouvée ou déjà traitée' });
    }

    // Rejeter l'offre
    const { error: updateError } = await supabase
      .from('job_offers')
      .update({
        admin_status: 'REJECTED',
        status: 'ARCHIVED', // Archiver les offres rejetées
        updated_at: new Date().toISOString()
      })
      .eq('id', offerId);

    if (updateError) {
      console.error('Erreur rejet offre:', updateError);
      return res.status(500).json({ error: 'Erreur lors du rejet' });
    }

    console.log(`Offre France Travail rejetée: ${offer.title} (ID: ${offerId})`);

    res.json({
      success: true,
      message: 'Offre rejetée avec succès',
      offer: {
        id: offerId,
        title: offer.title,
        admin_status: 'REJECTED'
      }
    });

  } catch (error) {
    console.error('Erreur rejet offre France Travail:', error);
    res.status(500).json({ error: 'Erreur lors du rejet' });
  }
}));

module.exports = router;
