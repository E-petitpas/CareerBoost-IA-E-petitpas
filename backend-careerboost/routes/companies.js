const express = require("express");
const {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  validateCompany,
  getCompanyMembers,
  inviteCompanyMember
} = require("../controllers/companiesController");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: API pour gérer les entreprises
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Company:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         siren:
 *           type: string
 *           pattern: '^[0-9]{9}$'
 *         domain:
 *           type: string
 *         sector:
 *           type: string
 *         size_employees:
 *           type: integer
 *         logo_url:
 *           type: string
 *         status:
 *           type: string
 *           enum: [PENDING, VERIFIED, REJECTED]
 *         created_at:
 *           type: string
 *           format: date-time
 *         validated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /companies:
 *   post:
 *     summary: Créer/Inscrire une entreprise
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - domain
 *             properties:
 *               name:
 *                 type: string
 *               siren:
 *                 type: string
 *                 pattern: '^[0-9]{9}$'
 *               domain:
 *                 type: string
 *               sector:
 *                 type: string
 *               size_employees:
 *                 type: integer
 *               logo_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Entreprise créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 company:
 *                   $ref: '#/components/schemas/Company'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       409:
 *         description: Domaine déjà utilisé
 */
router.post("/", authenticateToken, requireRole(["RECRUITER"]), createCompany);

/**
 * @swagger
 * /companies:
 *   get:
 *     summary: Liste des entreprises (admin seulement)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, VERIFIED, REJECTED]
 *         description: Filtrer par statut
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche dans nom et domaine
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
 *         description: Liste des entreprises
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Company'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 */
router.get("/", authenticateToken, requireRole(["ADMIN"]), getCompanies);

/**
 * @swagger
 * /companies/{id}:
 *   get:
 *     summary: Détails d'une entreprise
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de l'entreprise
 *     responses:
 *       200:
 *         description: Détails de l'entreprise
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Entreprise non trouvée
 */
router.get("/:id", authenticateToken, getCompanyById);

/**
 * @swagger
 * /companies/{id}:
 *   put:
 *     summary: Modifier une entreprise
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de l'entreprise
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               siren:
 *                 type: string
 *                 pattern: '^[0-9]{9}$'
 *               sector:
 *                 type: string
 *               size_employees:
 *                 type: integer
 *               logo_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Entreprise modifiée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Entreprise non trouvée
 */
router.put("/:id", authenticateToken, updateCompany);

/**
 * @swagger
 * /companies/{id}/validate:
 *   put:
 *     summary: Valider/Rejeter une entreprise (admin seulement)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de l'entreprise
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [VERIFIED, REJECTED]
 *     responses:
 *       200:
 *         description: Entreprise validée/rejetée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 company:
 *                   $ref: '#/components/schemas/Company'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Entreprise non trouvée
 */
router.put("/:id/validate", authenticateToken, requireRole(["ADMIN"]), validateCompany);

/**
 * @swagger
 * /companies/{id}/members:
 *   get:
 *     summary: Liste des membres d'une entreprise
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de l'entreprise
 *     responses:
 *       200:
 *         description: Liste des membres
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   user_id:
 *                     type: string
 *                     format: uuid
 *                   role_in_company:
 *                     type: string
 *                     enum: [ADMIN_RH, RH_USER]
 *                   is_primary:
 *                     type: boolean
 *                   invited_at:
 *                     type: string
 *                     format: date-time
 *                   accepted_at:
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
 *                       verified:
 *                         type: boolean
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 */
router.get("/:id/members", authenticateToken, getCompanyMembers);

/**
 * @swagger
 * /companies/{id}/members:
 *   post:
 *     summary: Inviter un membre dans l'entreprise
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de l'entreprise
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               role_in_company:
 *                 type: string
 *                 enum: [ADMIN_RH, RH_USER]
 *                 default: RH_USER
 *     responses:
 *       201:
 *         description: Membre invité avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 membership:
 *                   type: object
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Utilisateur non trouvé
 *       409:
 *         description: Utilisateur déjà membre
 */
router.post("/:id/members", authenticateToken, inviteCompanyMember);

module.exports = router;
