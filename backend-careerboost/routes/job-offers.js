const express = require("express");
const {
  createJobOffer,
  searchJobOffers,
  getJobOfferById,
  updateJobOffer,
  deleteJobOffer,
  getCompanyJobOffers
} = require("../controllers/jobOffersController");
const { authenticateToken, requireRole, optionalAuth } = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Job Offers
 *   description: API pour gérer les offres d'emploi
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     JobOffer:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         company_id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         city:
 *           type: string
 *         latitude:
 *           type: number
 *         longitude:
 *           type: number
 *         contract_type:
 *           type: string
 *           enum: [CDI, CDD, STAGE, ALTERNANCE, INTERIM, FREELANCE, TEMPS_PARTIEL, TEMPS_PLEIN, OTHER]
 *         experience_min:
 *           type: integer
 *         salary_min:
 *           type: number
 *         salary_max:
 *           type: number
 *         currency:
 *           type: string
 *           default: EUR
 *         source:
 *           type: string
 *           enum: [INTERNAL, EXTERNAL]
 *         status:
 *           type: string
 *           enum: [ACTIVE, ARCHIVED, EXPIRED]
 *         published_at:
 *           type: string
 *           format: date-time
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /job-offers:
 *   post:
 *     summary: Créer une offre d'emploi
 *     tags: [Job Offers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               city:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               contract_type:
 *                 type: string
 *                 enum: [CDI, CDD, STAGE, ALTERNANCE, INTERIM, FREELANCE, TEMPS_PARTIEL, TEMPS_PLEIN, OTHER]
 *               experience_min:
 *                 type: integer
 *               salary_min:
 *                 type: number
 *               salary_max:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: EUR
 *               required_skills:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               preferred_skills:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       201:
 *         description: Offre créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 offer:
 *                   $ref: '#/components/schemas/JobOffer'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 */
router.post("/", authenticateToken, requireRole(["RECRUITER"]), createJobOffer);

/**
 * @swagger
 * /job-offers/search:
 *   get:
 *     summary: Rechercher des offres d'emploi
 *     tags: [Job Offers]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche dans titre et description
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filtrer par ville
 *       - in: query
 *         name: contract_type
 *         schema:
 *           type: string
 *           enum: [CDI, CDD, STAGE, ALTERNANCE, INTERIM, FREELANCE, TEMPS_PARTIEL, TEMPS_PLEIN, OTHER]
 *         description: Filtrer par type de contrat
 *       - in: query
 *         name: experience_min
 *         schema:
 *           type: integer
 *         description: Expérience minimum requise
 *       - in: query
 *         name: salary_min
 *         schema:
 *           type: number
 *         description: Salaire minimum
 *       - in: query
 *         name: skills
 *         schema:
 *           type: string
 *         description: IDs de compétences séparés par des virgules
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
 *         description: Liste des offres d'emploi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/JobOffer'
 */
router.get("/search", optionalAuth, searchJobOffers);

/**
 * @swagger
 * /job-offers/my-company:
 *   get:
 *     summary: Récupère les offres de mon entreprise
 *     tags: [Job Offers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, ARCHIVED, EXPIRED]
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
 *         description: Liste des offres de l'entreprise
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/JobOffer'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 */
router.get("/my-company", authenticateToken, requireRole(["RECRUITER"]), getCompanyJobOffers);

/**
 * @swagger
 * /job-offers/{id}:
 *   get:
 *     summary: Détails d'une offre d'emploi
 *     tags: [Job Offers]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de l'offre d'emploi
 *     responses:
 *       200:
 *         description: Détails de l'offre d'emploi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JobOffer'
 *       404:
 *         description: Offre d'emploi non trouvée
 */
router.get("/:id", optionalAuth, getJobOfferById);

/**
 * @swagger
 * /job-offers/{id}:
 *   put:
 *     summary: Modifier une offre d'emploi
 *     tags: [Job Offers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de l'offre d'emploi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               city:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               contract_type:
 *                 type: string
 *                 enum: [CDI, CDD, STAGE, ALTERNANCE, INTERIM, FREELANCE, TEMPS_PARTIEL, TEMPS_PLEIN, OTHER]
 *               experience_min:
 *                 type: integer
 *               salary_min:
 *                 type: number
 *               salary_max:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, ARCHIVED, EXPIRED]
 *     responses:
 *       200:
 *         description: Offre modifiée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JobOffer'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Offre non trouvée
 */
router.put("/:id", authenticateToken, requireRole(["RECRUITER", "ADMIN"]), updateJobOffer);

/**
 * @swagger
 * /job-offers/{id}:
 *   delete:
 *     summary: Supprimer une offre d'emploi
 *     tags: [Job Offers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de l'offre d'emploi
 *     responses:
 *       200:
 *         description: Offre supprimée avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Offre non trouvée
 */
router.delete("/:id", authenticateToken, requireRole(["RECRUITER", "ADMIN"]), deleteJobOffer);

module.exports = router;
