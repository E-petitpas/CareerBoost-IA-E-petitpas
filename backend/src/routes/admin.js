const express = require('express');
const { supabase } = require('../config/supabase');
const { requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Middleware pour vérifier le rôle admin
router.use(requireRole('ADMIN'));

// Dashboard administrateur
router.get('/dashboard', asyncHandler(async (req, res) => {
  try {
    // Statistiques générales
    const [
      { count: totalUsers },
      { count: totalCompanies },
      { count: pendingCompanies },
      { count: totalOffers },
      { count: activeOffers },
      { count: totalApplications },
      { count: hiredApplications }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('deleted_at', null),
      supabase.from('companies').select('*', { count: 'exact', head: true }),
      supabase.from('companies').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
      supabase.from('job_offers').select('*', { count: 'exact', head: true }),
      supabase.from('job_offers').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabase.from('applications').select('*', { count: 'exact', head: true }),
      supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'EMBAUCHE')
    ]);

    // Répartition par rôle
    const { data: usersByRole } = await supabase
      .from('users')
      .select('role')
      .is('deleted_at', null);

    const roleStats = (usersByRole || []).reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    // Statistiques des candidatures par statut
    const { data: applicationsByStatus } = await supabase
      .from('applications')
      .select('status');

    const statusStats = (applicationsByStatus || []).reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    // Évolution des candidatures sur les 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentApplications } = await supabase
      .from('applications')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Grouper par jour
    const applicationsByDay = recentApplications.reduce((acc, app) => {
      const day = new Date(app.created_at).toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    const stats = {
      overview: {
        totalUsers,
        totalCompanies,
        pendingCompanies,
        totalOffers,
        activeOffers,
        totalApplications,
        hiredApplications,
        conversionRate: totalApplications > 0 ? ((hiredApplications / totalApplications) * 100).toFixed(2) : 0
      },
      usersByRole: roleStats,
      applicationsByStatus: statusStats,
      applicationsTrend: applicationsByDay
    };

    res.json({ stats });
  } catch (error) {
    console.error('Erreur dashboard admin:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
}));

// Récupérer les entreprises en attente de validation
router.get('/companies/pending', asyncHandler(async (req, res) => {
  const { data: companies, error } = await supabase
    .from('companies')
    .select(`
      *,
      company_memberships (
        user_id,
        role_in_company,
        users (
          name,
          email,
          phone
        )
      )
    `)
    .eq('status', 'PENDING')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erreur récupération entreprises en attente:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération des entreprises' });
  }

  res.json({ companies });
}));

// Valider ou rejeter une entreprise
router.patch('/companies/:id/status', asyncHandler(async (req, res) => {
  const { status, reason } = req.body;

  if (!['VERIFIED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Statut invalide' });
  }

  const { data: company, error: updateError } = await supabase
    .from('companies')
    .update({
      status,
      validated_at: new Date().toISOString()
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (updateError) {
    console.error('Erreur mise à jour statut entreprise:', updateError);
    return res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
  }

  if (!company) {
    return res.status(404).json({ error: 'Entreprise non trouvée' });
  }

  // Enregistrer l'action dans les logs d'audit
  await supabase
    .from('audit_logs')
    .insert({
      actor_user_id: req.user.id,
      entity_type: 'company',
      entity_id: req.params.id,
      action: status === 'VERIFIED' ? 'approve' : 'reject',
      details: { reason }
    });

  // TODO: Envoyer un email de notification à l'entreprise

  res.json({
    message: `Entreprise ${status === 'VERIFIED' ? 'validée' : 'rejetée'} avec succès`,
    company
  });
}));

// Approuver une entreprise
router.post('/companies/:id/approve', asyncHandler(async (req, res) => {
  const { data: company, error: updateError } = await supabase
    .from('companies')
    .update({
      status: 'VERIFIED',
      validated_at: new Date().toISOString()
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (updateError) {
    console.error('Erreur approbation entreprise:', updateError);
    return res.status(500).json({ error: 'Erreur lors de l\'approbation' });
  }

  if (!company) {
    return res.status(404).json({ error: 'Entreprise non trouvée' });
  }

  console.log(`Entreprise ${company.name} approuvée par admin ${req.user.email}`);

  res.json({
    message: 'Entreprise approuvée avec succès',
    company
  });
}));

// Rejeter une entreprise
router.post('/companies/:id/reject', asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const { data: company, error: updateError } = await supabase
    .from('companies')
    .update({
      status: 'REJECTED',
      validated_at: new Date().toISOString()
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (updateError) {
    console.error('Erreur rejet entreprise:', updateError);
    return res.status(500).json({ error: 'Erreur lors du rejet' });
  }

  if (!company) {
    return res.status(404).json({ error: 'Entreprise non trouvée' });
  }

  console.log(`Entreprise ${company.name} rejetée par admin ${req.user.email}. Raison: ${reason || 'Non spécifiée'}`);

  res.json({
    message: 'Entreprise rejetée avec succès',
    company
  });
}));

// Récupérer toutes les entreprises avec filtres
router.get('/companies', asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20, search } = req.query;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('companies')
    .select(`
      *,
      company_memberships (
        user_id,
        role_in_company,
        users (
          name,
          email
        )
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,domain.ilike.%${search}%`);
  }

  const { data: companies, error, count } = await query;

  if (error) {
    console.error('Erreur récupération entreprises:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération des entreprises' });
  }

  res.json({
    companies,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
}));

// Suspendre ou réactiver une entreprise
router.patch('/companies/:id/suspend', asyncHandler(async (req, res) => {
  const { suspend, reason } = req.body;

  const newStatus = suspend ? 'REJECTED' : 'VERIFIED';

  const { data: company, error } = await supabase
    .from('companies')
    .update({ status: newStatus })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    console.error('Erreur suspension entreprise:', error);
    return res.status(500).json({ error: 'Erreur lors de la suspension/réactivation' });
  }

  if (!company) {
    return res.status(404).json({ error: 'Entreprise non trouvée' });
  }

  // Enregistrer l'action dans les logs d'audit
  await supabase
    .from('audit_logs')
    .insert({
      actor_user_id: req.user.id,
      entity_type: 'company',
      entity_id: req.params.id,
      action: suspend ? 'suspend' : 'reactivate',
      details: { reason }
    });

  res.json({
    message: `Entreprise ${suspend ? 'suspendue' : 'réactivée'} avec succès`,
    company
  });
}));

// Récupérer les offres avec filtres admin
router.get('/offers', asyncHandler(async (req, res) => {
  const { status, source, flagged, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('job_offers')
    .select(`
      *,
      companies (
        name,
        status
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  if (source) {
    query = query.eq('source', source);
  }

  // TODO: Ajouter un système de signalement d'offres
  // if (flagged === 'true') {
  //   query = query.eq('flagged', true);
  // }

  const { data: offers, error, count } = await query;

  if (error) {
    console.error('Erreur récupération offres admin:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération des offres' });
  }

  res.json({
    offers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
}));

// Supprimer ou archiver une offre
router.patch('/offers/:id/moderate', asyncHandler(async (req, res) => {
  const { action, reason } = req.body; // action: 'archive' | 'delete'

  if (!['archive', 'delete'].includes(action)) {
    return res.status(400).json({ error: 'Action invalide' });
  }

  let updateData;
  if (action === 'archive') {
    updateData = { status: 'ARCHIVED' };
  } else {
    updateData = { status: 'EXPIRED' }; // On n'efface pas vraiment, on marque comme expiré
  }

  const { data: offer, error } = await supabase
    .from('job_offers')
    .update(updateData)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    console.error('Erreur modération offre:', error);
    return res.status(500).json({ error: 'Erreur lors de la modération de l\'offre' });
  }

  if (!offer) {
    return res.status(404).json({ error: 'Offre non trouvée' });
  }

  // Enregistrer l'action dans les logs d'audit
  await supabase
    .from('audit_logs')
    .insert({
      actor_user_id: req.user.id,
      entity_type: 'job_offer',
      entity_id: req.params.id,
      action,
      details: { reason }
    });

  res.json({
    message: `Offre ${action === 'archive' ? 'archivée' : 'supprimée'} avec succès`,
    offer
  });
}));

// Générer un rapport
router.get('/reports', asyncHandler(async (req, res) => {
  const { from, to, type = 'general' } = req.query;

  const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const toDate = to ? new Date(to) : new Date();

  try {
    let reportData = {};

    if (type === 'general' || type === 'applications') {
      // Rapport sur les candidatures
      const { data: applications } = await supabase
        .from('applications')
        .select(`
          status,
          created_at,
          job_offers (
            contract_type,
            companies (
              sector
            )
          )
        `)
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString());

      reportData.applications = {
        total: applications.length,
        byStatus: applications.reduce((acc, app) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
        }, {}),
        byContractType: applications.reduce((acc, app) => {
          const contractType = app.job_offers?.contract_type || 'Non spécifié';
          acc[contractType] = (acc[contractType] || 0) + 1;
          return acc;
        }, {}),
        bySector: applications.reduce((acc, app) => {
          const sector = app.job_offers?.companies?.sector || 'Non spécifié';
          acc[sector] = (acc[sector] || 0) + 1;
          return acc;
        }, {})
      };
    }

    if (type === 'general' || type === 'companies') {
      // Rapport sur les entreprises
      const { data: companies } = await supabase
        .from('companies')
        .select('status, sector, created_at')
        .gte('created_at', fromDate.toISOString())
        .lte('created_at', toDate.toISOString());

      reportData.companies = {
        total: companies.length,
        byStatus: companies.reduce((acc, company) => {
          acc[company.status] = (acc[company.status] || 0) + 1;
          return acc;
        }, {}),
        bySector: companies.reduce((acc, company) => {
          const sector = company.sector || 'Non spécifié';
          acc[sector] = (acc[sector] || 0) + 1;
          return acc;
        }, {})
      };
    }

    res.json({
      report: reportData,
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString()
      }
    });
  } catch (error) {
    console.error('Erreur génération rapport:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du rapport' });
  }
}));

// Récupérer les logs d'audit
router.get('/audit-logs', asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, entity_type, action } = req.query;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('audit_logs')
    .select(`
      *,
      users (
        name,
        email
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (entity_type) {
    query = query.eq('entity_type', entity_type);
  }

  if (action) {
    query = query.eq('action', action);
  }

  const { data: logs, error, count } = await query;

  if (error) {
    console.error('Erreur récupération logs audit:', error);
    return res.status(500).json({ error: 'Erreur lors de la récupération des logs' });
  }

  res.json({
    logs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
}));

module.exports = router;
