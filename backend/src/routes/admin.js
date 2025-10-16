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

// ==========================================
// GESTION DES COMPÉTENCES - ADMIN
// ==========================================

// Récupérer les catégories de compétences
router.get('/skills/categories', asyncHandler(async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('skills')
      .select('category')
      .not('category', 'is', null)
      .neq('category', '');

    if (error) throw error;

    // Extraire les catégories uniques et les trier
    const uniqueCategories = [...new Set(categories.map(item => item.category))]
      .filter(Boolean)
      .sort();

    res.json({ categories: uniqueCategories });
  } catch (error) {
    console.error('Erreur récupération catégories:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des catégories' });
  }
}));

// Récupérer les statistiques des compétences
router.get('/skills/stats', asyncHandler(async (req, res) => {
  try {
    // Statistiques générales
    const { data: totalSkills, error: totalError } = await supabase
      .from('skills')
      .select('id', { count: 'exact' });

    if (totalError) throw totalError;

    // Compétences les plus utilisées (top 5)
    const { data: topSkills, error: topError } = await supabase
      .from('skills')
      .select(`
        id,
        display_name,
        slug,
        candidate_skills(count),
        job_offer_skills(count)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (topError) throw topError;

    // Compétences par catégorie
    const { data: skillsWithCategories, error: categoryError } = await supabase
      .from('skills')
      .select('category');

    if (categoryError) throw categoryError;

    // Calculer les statistiques par catégorie
    const categoryStats = {};
    skillsWithCategories?.forEach(skill => {
      const category = skill.category || 'Non catégorisé';
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });

    const skillsByCategory = Object.entries(categoryStats).map(([category, count]) => ({
      category,
      count
    }));

    // Taux d'utilisation du référentiel
    const { data: usedSkills, error: usedError } = await supabase
      .from('skills')
      .select(`
        id,
        candidate_skills!inner(id),
        job_offer_skills!inner(id)
      `, { count: 'exact' });

    if (usedError) throw usedError;

    const stats = {
      totalSkills: totalSkills?.length || 0,
      topSkills: topSkills || [],
      skillsByCategory: skillsByCategory || [],
      usageRate: totalSkills?.length > 0 ?
        Math.round((usedSkills?.length || 0) / totalSkills.length * 100) : 0
    };

    res.json({ stats });
  } catch (error) {
    console.error('Erreur récupération stats compétences:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
}));

// Récupérer toutes les compétences avec filtres et pagination
router.get('/skills', asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search,
    category,
    sortBy = 'display_name',
    sortOrder = 'asc'
  } = req.query;

  const offset = (page - 1) * limit;

  // Colonnes de tri autorisées
  const allowedSortColumns = ['display_name', 'category', 'created_at'];
  const validSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'display_name';

  try {
    let query = supabase
      .from('skills')
      .select(`
        *,
        candidate_skills(count),
        job_offer_skills(count)
      `, { count: 'exact' })
      .range(offset, offset + limit - 1);

    // Filtres
    if (search) {
      query = query.or(`display_name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    // Tri
    query = query.order(validSortBy, { ascending: sortOrder === 'asc' });

    const { data: skills, error, count } = await query;

    if (error) throw error;

    res.json({
      skills: skills || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération compétences admin:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des compétences' });
  }
}));

// Créer une nouvelle compétence (admin)
router.post('/skills', asyncHandler(async (req, res) => {
  const { display_name, category } = req.body;

  if (!display_name || display_name.trim().length < 1) {
    return res.status(400).json({ error: 'Le nom de la compétence est requis (minimum 1 caractère)' });
  }

  try {
    const slug = display_name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const { data: skill, error } = await supabase
      .from('skills')
      .insert({
        slug,
        display_name: display_name.trim(),
        category: category || null
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Violation de contrainte unique
        return res.status(409).json({ error: 'Cette compétence existe déjà' });
      }
      throw error;
    }

    // Log de l'action admin
    console.log(`Compétence créée par admin ${req.user.email}: ${skill.display_name}`);

    res.status(201).json({
      message: 'Compétence créée avec succès',
      skill
    });
  } catch (error) {
    console.error('Erreur création compétence admin:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la compétence' });
  }
}));

// Mettre à jour une compétence (admin)
router.put('/skills/:id', asyncHandler(async (req, res) => {
  const { display_name, category } = req.body;

  if (!display_name || display_name.trim().length < 1) {
    return res.status(400).json({ error: 'Le nom de la compétence est requis (minimum 1 caractère)' });
  }

  try {
    const slug = display_name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const { data: skill, error } = await supabase
      .from('skills')
      .update({
        slug,
        display_name: display_name.trim(),
        category: category || null
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Violation de contrainte unique
        return res.status(409).json({ error: 'Cette compétence existe déjà' });
      }
      throw error;
    }

    if (!skill) {
      return res.status(404).json({ error: 'Compétence non trouvée' });
    }

    // Log de l'action admin
    console.log(`Compétence modifiée par admin ${req.user.email}: ${skill.display_name}`);

    res.json({
      message: 'Compétence mise à jour avec succès',
      skill
    });
  } catch (error) {
    console.error('Erreur modification compétence admin:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de la compétence' });
  }
}));

// Supprimer une compétence (admin) - Soft delete
router.delete('/skills/:id', asyncHandler(async (req, res) => {
  try {
    // Vérifier si la compétence est utilisée
    const { data: usageCheck, error: usageError } = await supabase
      .from('candidate_skills')
      .select('id')
      .eq('skill_id', req.params.id)
      .limit(1);

    if (usageError) throw usageError;

    const { data: offerUsageCheck, error: offerUsageError } = await supabase
      .from('job_offer_skills')
      .select('id')
      .eq('skill_id', req.params.id)
      .limit(1);

    if (offerUsageError) throw offerUsageError;

    if (usageCheck?.length > 0 || offerUsageCheck?.length > 0) {
      // Ne peut pas supprimer si utilisée
      return res.status(400).json({
        error: 'Impossible de supprimer une compétence utilisée dans des profils ou offres'
      });
    } else {
      // Hard delete si pas utilisée
      const { data: skill, error: selectError } = await supabase
        .from('skills')
        .select('display_name')
        .eq('id', req.params.id)
        .single();

      if (selectError) throw selectError;

      if (!skill) {
        return res.status(404).json({ error: 'Compétence non trouvée' });
      }

      const { error: deleteError } = await supabase
        .from('skills')
        .delete()
        .eq('id', req.params.id);

      if (deleteError) throw deleteError;

      console.log(`Compétence supprimée par admin ${req.user.email}: ${skill.display_name}`);
      res.json({
        message: 'Compétence supprimée définitivement avec succès'
      });
    }
  } catch (error) {
    console.error('Erreur suppression compétence admin:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la compétence' });
  }
}));



// Fusionner des compétences (gérer les doublons)
router.post('/skills/merge', asyncHandler(async (req, res) => {
  const { sourceSkillIds, targetSkillId, newDisplayName } = req.body;

  if (!sourceSkillIds || !Array.isArray(sourceSkillIds) || sourceSkillIds.length === 0) {
    return res.status(400).json({ error: 'IDs des compétences sources requis' });
  }

  if (!targetSkillId) {
    return res.status(400).json({ error: 'ID de la compétence cible requis' });
  }

  try {
    // Vérifier que toutes les compétences existent
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('id, display_name')
      .in('id', [...sourceSkillIds, targetSkillId]);

    if (skillsError) throw skillsError;

    if (skills.length !== sourceSkillIds.length + 1) {
      return res.status(404).json({ error: 'Une ou plusieurs compétences non trouvées' });
    }

    // Mettre à jour les références dans candidate_skills
    for (const sourceId of sourceSkillIds) {
      await supabase
        .from('candidate_skills')
        .update({ skill_id: targetSkillId })
        .eq('skill_id', sourceId);
    }

    // Mettre à jour les références dans job_offer_skills
    for (const sourceId of sourceSkillIds) {
      await supabase
        .from('job_offer_skills')
        .update({ skill_id: targetSkillId })
        .eq('skill_id', sourceId);
    }

    // Supprimer les compétences sources
    const { error: deleteError } = await supabase
      .from('skills')
      .delete()
      .in('id', sourceSkillIds);

    if (deleteError) throw deleteError;

    // Optionnellement mettre à jour le nom de la compétence cible
    if (newDisplayName) {
      const slug = newDisplayName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      await supabase
        .from('skills')
        .update({
          display_name: newDisplayName,
          slug
        })
        .eq('id', targetSkillId);
    }

    console.log(`Fusion de compétences par admin ${req.user.email}: ${sourceSkillIds.join(', ')} -> ${targetSkillId}`);

    res.json({
      message: 'Compétences fusionnées avec succès',
      mergedCount: sourceSkillIds.length
    });
  } catch (error) {
    console.error('Erreur fusion compétences admin:', error);
    res.status(500).json({ error: 'Erreur lors de la fusion des compétences' });
  }
}));

// Détecter les doublons potentiels
router.get('/skills/duplicates', asyncHandler(async (req, res) => {
  try {
    const { data: skills, error } = await supabase
      .from('skills')
      .select('id, display_name, slug')
      .order('display_name');

    if (error) throw error;

    const duplicates = [];
    const seen = new Map();

    for (const skill of skills) {
      const normalizedName = skill.display_name.toLowerCase().trim();

      if (seen.has(normalizedName)) {
        const existing = seen.get(normalizedName);
        let duplicateGroup = duplicates.find(group =>
          group.some(s => s.id === existing.id)
        );

        if (!duplicateGroup) {
          duplicateGroup = [existing];
          duplicates.push(duplicateGroup);
        }

        duplicateGroup.push(skill);
      } else {
        seen.set(normalizedName, skill);
      }
    }

    res.json({ duplicates });
  } catch (error) {
    console.error('Erreur détection doublons:', error);
    res.status(500).json({ error: 'Erreur lors de la détection des doublons' });
  }
}));

// Obtenir les détails d'utilisation d'une compétence
router.get('/skills/:id/usage', asyncHandler(async (req, res) => {
  try {
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (skillError) throw skillError;

    if (!skill) {
      return res.status(404).json({ error: 'Compétence non trouvée' });
    }

    // Utilisation par les candidats
    const { data: candidateUsage, error: candidateError } = await supabase
      .from('candidate_skills')
      .select(`
        id,
        level,
        years_experience,
        users!user_id (
          name,
          email
        )
      `)
      .eq('skill_id', req.params.id);

    if (candidateError) throw candidateError;

    // Utilisation dans les offres
    const { data: offerUsage, error: offerError } = await supabase
      .from('job_offer_skills')
      .select(`
        id,
        is_required,
        weight,
        job_offers (
          id,
          title,
          companies (
            name
          )
        )
      `)
      .eq('skill_id', req.params.id);

    if (offerError) throw offerError;

    res.json({
      skill,
      usage: {
        candidates: candidateUsage || [],
        offers: offerUsage || [],
        totalCandidates: candidateUsage?.length || 0,
        totalOffers: offerUsage?.length || 0
      }
    });
  } catch (error) {
    console.error('Erreur récupération usage compétence:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des détails d\'utilisation' });
  }
}));

module.exports = router;
