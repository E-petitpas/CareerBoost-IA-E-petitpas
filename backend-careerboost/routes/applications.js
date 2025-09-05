const express = require("express");
const {
  applyToJobOffer,
  getMyCandidatures,
  getReceivedApplications,
  updateApplicationStatus,
  getApplicationTimeline
} = require("../controllers/applicationsController");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Applications
 *   description: API pour gérer les candidatures
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Application:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         offer_id:
 *           type: string
 *           format: uuid
 *         candidate_id:
 *           type: string
 *           format: uuid
 *         status:
 *           type: string
 *           enum: [ENVOYE, EN_ATTENTE, ENTRETIEN, REFUS, EMBAUCHE]
 *         score:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         explanation:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /applications/apply:
 *   post:
 *     summary: Postuler à une offre d'emploi
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - offer_id
 *             properties:
 *               offer_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Candidature envoyée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 application:
 *                   $ref: '#/components/schemas/Application'
 *                 matching:
 *                   type: object
 *                   properties:
 *                     score:
 *                       type: integer
 *                     explanation:
 *                       type: string
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (candidats seulement)
 *       404:
 *         description: Offre non trouvée
 *       409:
 *         description: Candidature déjà envoyée
 */
router.post("/apply", authenticateToken, requireRole(["CANDIDATE"]), applyToJobOffer);

/**
 * @swagger
 * /applications/my-applications:
 *   get:
 *     summary: Récupère mes candidatures (candidat)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ENVOYE, EN_ATTENTE, ENTRETIEN, REFUS, EMBAUCHE]
 *         description: Filtrer par statut
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
 *         description: Liste de mes candidatures
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Application'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 */
router.get("/my-applications", authenticateToken, requireRole(["CANDIDATE"]), getMyCandidatures);

/**
 * @swagger
 * /applications/received:
 *   get:
 *     summary: Récupère les candidatures reçues (recruteur)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: offer_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrer par offre d'emploi
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ENVOYE, EN_ATTENTE, ENTRETIEN, REFUS, EMBAUCHE]
 *         description: Filtrer par statut
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
 *         description: Liste des candidatures reçues
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Application'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 */
router.get("/received", authenticateToken, requireRole(["RECRUITER"]), getReceivedApplications);

/**
 * @swagger
 * /applications/{id}/status:
 *   put:
 *     summary: Changer le statut d'une candidature (recruteur)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la candidature
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
 *                 enum: [ENVOYE, EN_ATTENTE, ENTRETIEN, REFUS, EMBAUCHE]
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Statut mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 application:
 *                   $ref: '#/components/schemas/Application'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Candidature non trouvée
 */
router.put("/:id/status", authenticateToken, requireRole(["RECRUITER"]), updateApplicationStatus);

/**
 * @swagger
 * /applications/{id}/timeline:
 *   get:
 *     summary: Récupère la timeline d'une candidature
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la candidature
 *     responses:
 *       200:
 *         description: Timeline de la candidature
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
 *                   event_type:
 *                     type: string
 *                   old_status:
 *                     type: string
 *                   new_status:
 *                     type: string
 *                   note:
 *                     type: string
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
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Candidature non trouvée
 */
router.get("/:id/timeline", authenticateToken, getApplicationTimeline);

module.exports = router;
