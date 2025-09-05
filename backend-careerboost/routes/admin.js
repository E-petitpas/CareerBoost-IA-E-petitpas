const express = require("express");
const {
  getDashboard,
  getPendingCompanies,
  getAuditLogs,
  createAuditLog,
  getDetailedStats,
  getImpactReport
} = require("../controllers/adminController");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Administration
 *   description: API d'administration (admin seulement)
 */

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Tableau de bord administrateur
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques du tableau de bord
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overview:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: integer
 *                     totalCandidates:
 *                       type: integer
 *                     totalRecruiters:
 *                       type: integer
 *                     totalCompanies:
 *                       type: integer
 *                     pendingCompanies:
 *                       type: integer
 *                     verifiedCompanies:
 *                       type: integer
 *                     totalJobOffers:
 *                       type: integer
 *                     activeJobOffers:
 *                       type: integer
 *                     totalApplications:
 *                       type: integer
 *                     successfulHires:
 *                       type: integer
 *                 last30Days:
 *                   type: object
 *                   properties:
 *                     newUsers:
 *                       type: integer
 *                     newApplications:
 *                       type: integer
 *                     newJobOffers:
 *                       type: integer
 *                 conversionRates:
 *                   type: object
 *                   properties:
 *                     applicationToHire:
 *                       type: string
 *                     companyValidationRate:
 *                       type: string
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (admin seulement)
 */
router.get("/dashboard", authenticateToken, requireRole(["ADMIN"]), getDashboard);

/**
 * @swagger
 * /admin/companies/pending:
 *   get:
 *     summary: Liste des entreprises en attente de validation
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Décalage pour la pagination
 *     responses:
 *       200:
 *         description: Liste des entreprises en attente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   name:
 *                     type: string
 *                   siren:
 *                     type: string
 *                   domain:
 *                     type: string
 *                   sector:
 *                     type: string
 *                   size_employees:
 *                     type: integer
 *                   logo_url:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   company_memberships:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         users:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                             name:
 *                               type: string
 *                             email:
 *                               type: string
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 */
router.get("/companies/pending", authenticateToken, requireRole(["ADMIN"]), getPendingCompanies);

/**
 * @swagger
 * /admin/audit-logs:
 *   get:
 *     summary: Récupère les logs d'audit
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: entity_type
 *         schema:
 *           type: string
 *         description: Filtrer par type d'entité
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filtrer par action
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Décalage pour la pagination
 *     responses:
 *       200:
 *         description: Liste des logs d'audit
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   entity_type:
 *                     type: string
 *                   entity_id:
 *                     type: string
 *                     format: uuid
 *                   action:
 *                     type: string
 *                   details:
 *                     type: object
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                   users:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 */
router.get("/audit-logs", authenticateToken, requireRole(["ADMIN"]), getAuditLogs);

/**
 * @swagger
 * /admin/audit-logs:
 *   post:
 *     summary: Crée un log d'audit
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entity_type
 *               - action
 *             properties:
 *               entity_type:
 *                 type: string
 *               entity_id:
 *                 type: string
 *                 format: uuid
 *               action:
 *                 type: string
 *               details:
 *                 type: object
 *     responses:
 *       201:
 *         description: Log d'audit créé
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 */
router.post("/audit-logs", authenticateToken, requireRole(["ADMIN"]), createAuditLog);

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Statistiques détaillées
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: ["7", "30", "90"]
 *           default: "30"
 *         description: Période en jours
 *     responses:
 *       200:
 *         description: Statistiques détaillées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period:
 *                   type: string
 *                 userRegistrations:
 *                   type: object
 *                 applications:
 *                   type: object
 *                 jobOffers:
 *                   type: object
 *                 topSkills:
 *                   type: object
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 */
router.get("/stats", authenticateToken, requireRole(["ADMIN"]), getDetailedStats);

/**
 * @swagger
 * /admin/impact-report:
 *   get:
 *     summary: Rapport d'impact pour les financeurs
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Rapport d'impact
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period:
 *                   type: object
 *                   properties:
 *                     startDate:
 *                       type: string
 *                     endDate:
 *                       type: string
 *                 metrics:
 *                   type: object
 *                   properties:
 *                     candidatesRegistered:
 *                       type: integer
 *                     companiesValidated:
 *                       type: integer
 *                     jobOffersPublished:
 *                       type: integer
 *                     applicationsSubmitted:
 *                       type: integer
 *                     successfulHires:
 *                       type: integer
 *                     averageMatchingScore:
 *                       type: integer
 *                 impact:
 *                   type: object
 *                   properties:
 *                     employmentRate:
 *                       type: string
 *                     companyEngagement:
 *                       type: integer
 *                     candidateEngagement:
 *                       type: integer
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 */
router.get("/impact-report", authenticateToken, requireRole(["ADMIN"]), getImpactReport);

module.exports = router;
