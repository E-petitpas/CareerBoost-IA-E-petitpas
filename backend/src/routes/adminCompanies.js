/**
 * Routes admin de gestion des entreprises
 * Endpoints pour la validation et gestion des entreprises
 */

const express = require('express');
const { requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { validate, adminSchemas } = require('../utils/validation');
const companyService = require('../services/companyService');
const notificationService = require('../services/notificationService');
const { supabase } = require('../config/supabase');

const router = express.Router();

/**
 * GET /api/admin/companies/pending
 * Récupère les entreprises en attente de validation
 */
router.get(
  '/pending',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const { limit = 20, offset = 0 } = req.query;

    const result = await companyService.getPendingCompanies(
      parseInt(limit),
      parseInt(offset)
    );

    res.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        pages: Math.ceil(result.total / result.limit)
      }
    });
  })
);

/**
 * GET /api/admin/companies/stats
 * Récupère les statistiques des entreprises
 */
router.get(
  '/stats',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const stats = await companyService.getCompanyStats();

    res.json({
      success: true,
      data: stats
    });
  })
);

/**
 * GET /api/admin/companies/:companyId
 * Récupère les détails d'une entreprise (avec infos admin)
 */
router.get(
  '/:companyId',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const { companyId } = req.params;

    const company = await companyService.getCompanyById(companyId);

    // Récupérer les informations du recruteur
    const { data: membership } = await supabase
      .from('company_memberships')
      .select(`
        user_id,
        role_in_company,
        users (
          id,
          name,
          email,
          phone,
          city
        )
      `)
      .eq('company_id', companyId)
      .eq('role_in_company', 'ADMIN_RH')
      .single();

    res.json({
      success: true,
      data: {
        ...company,
        recruiter: membership?.users || null
      }
    });
  })
);

/**
 * PATCH /api/admin/companies/:companyId/approve
 * Approuve une entreprise
 */
router.patch(
  '/:companyId/approve',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const { companyId } = req.params;

    const company = await companyService.validateCompany(companyId, 'VERIFIED');

    // Récupérer les informations du recruteur
    const { data: membership } = await supabase
      .from('company_memberships')
      .select(`
        users (
          id,
          name,
          email
        )
      `)
      .eq('company_id', companyId)
      .eq('role_in_company', 'ADMIN_RH')
      .single();

    if (membership?.users) {
      // Envoyer un email de validation
      await notificationService.sendCompanyApprovedEmail(
        { name: membership.users.name, email: membership.users.email },
        company
      );

      // Créer une notification in-app
      await notificationService.createNotification(
        membership.users.id,
        'COMPANY_APPROVED',
        { company_id: companyId, company_name: company.name }
      );
    }

    res.json({
      success: true,
      data: company,
      message: 'Entreprise approuvée avec succès'
    });
  })
);

/**
 * PATCH /api/admin/companies/:companyId/reject
 * Rejette une entreprise
 */
router.patch(
  '/:companyId/reject',
  requireRole('ADMIN'),
  validate(adminSchemas.rejectCompany),
  asyncHandler(async (req, res) => {
    const { companyId } = req.params;
    const { reason } = req.body;

    const company = await companyService.validateCompany(companyId, 'REJECTED', reason);

    // Récupérer les informations du recruteur
    const { data: membership } = await supabase
      .from('company_memberships')
      .select(`
        users (
          id,
          name,
          email
        )
      `)
      .eq('company_id', companyId)
      .eq('role_in_company', 'ADMIN_RH')
      .single();

    if (membership?.users) {
      // Envoyer un email de rejet
      await notificationService.sendCompanyRejectedEmail(
        { name: membership.users.name, email: membership.users.email },
        company,
        reason
      );

      // Créer une notification in-app
      await notificationService.createNotification(
        membership.users.id,
        'COMPANY_REJECTED',
        { company_id: companyId, company_name: company.name, reason }
      );
    }

    res.json({
      success: true,
      data: company,
      message: 'Entreprise rejetée'
    });
  })
);

/**
 * GET /api/admin/companies
 * Récupère toutes les entreprises (avec filtres)
 */
router.get(
  '/',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const { status, limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from('companies')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: companies, count, error } = await query
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      throw new Error('Erreur lors de la récupération des entreprises');
    }

    res.json({
      success: true,
      data: companies || [],
      pagination: {
        total: count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil((count || 0) / parseInt(limit))
      }
    });
  })
);

module.exports = router;

