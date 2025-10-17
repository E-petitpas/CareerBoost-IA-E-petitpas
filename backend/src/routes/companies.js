/**
 * Routes de gestion des entreprises
 * Endpoints pour les recruteurs et admins
 */

const express = require('express');
const { requireRole, requireCompanyAccess } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { validate, companySchemas } = require('../utils/validation');
const companyService = require('../services/companyService');
const notificationService = require('../services/notificationService');

const router = express.Router();

/**
 * GET /api/companies/my-companies
 * Récupère les entreprises de l'utilisateur connecté
 */
router.get(
  '/my-companies',
  requireRole('RECRUITER'),
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const companies = await companyService.getUserCompanies(userId);

    res.json({
      success: true,
      data: companies,
      count: companies.length
    });
  })
);

/**
 * GET /api/companies/:companyId
 * Récupère les détails d'une entreprise
 */
router.get(
  '/:companyId',
  requireRole('RECRUITER', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const { companyId } = req.params;

    const company = await companyService.getCompanyById(companyId);

    // Vérifier l'accès (recruteur doit être membre de l'entreprise)
    if (req.user.role === 'RECRUITER') {
      const userCompanies = await companyService.getUserCompanies(req.user.id);
      const hasAccess = userCompanies.some(m => m.company_id === companyId);

      if (!hasAccess) {
        return res.status(403).json({ error: 'Accès refusé' });
      }
    }

    res.json({
      success: true,
      data: company
    });
  })
);

/**
 * PUT /api/companies/:companyId
 * Met à jour les informations d'une entreprise
 */
router.put(
  '/:companyId',
  requireRole('RECRUITER'),
  validate(companySchemas.updateCompany),
  asyncHandler(async (req, res) => {
    const { companyId } = req.params;
    const { name, sector, size, logo_url, description } = req.body;

    // Vérifier l'accès
    const userCompanies = await companyService.getUserCompanies(req.user.id);
    const hasAccess = userCompanies.some(m => m.company_id === companyId);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const company = await companyService.updateCompany(companyId, {
      name,
      sector,
      size,
      logo_url,
      description
    });

    res.json({
      success: true,
      data: company,
      message: 'Entreprise mise à jour avec succès'
    });
  })
);

/**
 * GET /api/companies/:companyId/status
 * Récupère le statut de validation d'une entreprise
 */
router.get(
  '/:companyId/status',
  requireRole('RECRUITER'),
  asyncHandler(async (req, res) => {
    const { companyId } = req.params;

    // Vérifier l'accès
    const userCompanies = await companyService.getUserCompanies(req.user.id);
    const hasAccess = userCompanies.some(m => m.company_id === companyId);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const company = await companyService.getCompanyById(companyId);

    res.json({
      success: true,
      data: {
        id: company.id,
        name: company.name,
        status: company.status,
        created_at: company.created_at,
        validated_at: company.validated_at,
        validation_reason: company.validation_reason
      }
    });
  })
);

/**
 * POST /api/companies/:companyId/contest-rejection
 * Conteste le rejet d'une entreprise
 */
router.post(
  '/:companyId/contest-rejection',
  requireRole('RECRUITER'),
  validate(companySchemas.contestRejection),
  asyncHandler(async (req, res) => {
    const { companyId } = req.params;
    const { message } = req.body;

    // Vérifier l'accès
    const userCompanies = await companyService.getUserCompanies(req.user.id);
    const hasAccess = userCompanies.some(m => m.company_id === companyId);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const company = await companyService.getCompanyById(companyId);

    if (company.status !== 'REJECTED') {
      return res.status(400).json({ error: 'Seules les entreprises rejetées peuvent contester' });
    }

    // Créer une notification pour l'admin
    await notificationService.createNotification(
      null, // Admin notification
      'COMPANY_CONTEST',
      {
        company_id: companyId,
        company_name: company.name,
        user_id: req.user.id,
        user_name: req.user.name,
        message
      }
    );

    res.json({
      success: true,
      message: 'Votre contestation a été envoyée. Notre équipe l\'examinera dans les 24 heures.'
    });
  })
);

module.exports = router;

