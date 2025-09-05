const express = require("express");
const {
  getCandidateProfile,
  updateCandidateProfile,
  getEducations,
  createEducation,
  updateEducation,
  deleteEducation,
  getExperiences,
  createExperience,
  updateExperience,
  deleteExperience,
  getCandidateSkills,
  addCandidateSkill,
  removeCandidateSkill
} = require("../controllers/candidatesController");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Candidates
 *   description: API pour gérer les profils candidats
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CandidateProfile:
 *       type: object
 *       properties:
 *         user_id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         summary:
 *           type: string
 *         experience_years:
 *           type: number
 *         mobility_km:
 *           type: integer
 *         preferred_contracts:
 *           type: array
 *           items:
 *             type: string
 *             enum: [CDI, CDD, STAGE, ALTERNANCE, INTERIM, FREELANCE, TEMPS_PARTIEL, TEMPS_PLEIN, OTHER]
 *         updated_at:
 *           type: string
 *           format: date-time
 *     Education:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         user_id:
 *           type: string
 *           format: uuid
 *         school:
 *           type: string
 *         degree:
 *           type: string
 *         field:
 *           type: string
 *         start_date:
 *           type: string
 *           format: date
 *         end_date:
 *           type: string
 *           format: date
 *         description:
 *           type: string
 *     Experience:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         user_id:
 *           type: string
 *           format: uuid
 *         company:
 *           type: string
 *         role_title:
 *           type: string
 *         start_date:
 *           type: string
 *           format: date
 *         end_date:
 *           type: string
 *           format: date
 *         description:
 *           type: string
 */

/**
 * @swagger
 * /candidates/profile:
 *   get:
 *     summary: Récupère le profil candidat
 *     tags: [Candidates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil candidat
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CandidateProfile'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (candidats seulement)
 */
router.get("/profile", authenticateToken, requireRole(["CANDIDATE"]), getCandidateProfile);

/**
 * @swagger
 * /candidates/profile:
 *   put:
 *     summary: Met à jour le profil candidat
 *     tags: [Candidates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               summary:
 *                 type: string
 *               experience_years:
 *                 type: number
 *               mobility_km:
 *                 type: integer
 *               preferred_contracts:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [CDI, CDD, STAGE, ALTERNANCE, INTERIM, FREELANCE, TEMPS_PARTIEL, TEMPS_PLEIN, OTHER]
 *     responses:
 *       200:
 *         description: Profil mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CandidateProfile'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 */
router.put("/profile", authenticateToken, requireRole(["CANDIDATE"]), updateCandidateProfile);

/**
 * @swagger
 * /candidates/educations:
 *   get:
 *     summary: Récupère les formations du candidat
 *     tags: [Candidates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des formations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Education'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 */
router.get("/educations", authenticateToken, requireRole(["CANDIDATE"]), getEducations);

/**
 * @swagger
 * /candidates/educations:
 *   post:
 *     summary: Ajoute une formation
 *     tags: [Candidates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - school
 *             properties:
 *               school:
 *                 type: string
 *               degree:
 *                 type: string
 *               field:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Formation créée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Education'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 */
router.post("/educations", authenticateToken, requireRole(["CANDIDATE"]), createEducation);

/**
 * @swagger
 * /candidates/educations/{id}:
 *   put:
 *     summary: Modifie une formation
 *     tags: [Candidates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la formation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               school:
 *                 type: string
 *               degree:
 *                 type: string
 *               field:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Formation modifiée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Education'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Formation non trouvée
 */
router.put("/educations/:id", authenticateToken, requireRole(["CANDIDATE"]), updateEducation);

/**
 * @swagger
 * /candidates/educations/{id}:
 *   delete:
 *     summary: Supprime une formation
 *     tags: [Candidates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la formation
 *     responses:
 *       200:
 *         description: Formation supprimée
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Formation non trouvée
 */
router.delete("/educations/:id", authenticateToken, requireRole(["CANDIDATE"]), deleteEducation);

// Routes pour les expériences
router.get("/experiences", authenticateToken, requireRole(["CANDIDATE"]), getExperiences);
router.post("/experiences", authenticateToken, requireRole(["CANDIDATE"]), createExperience);
router.put("/experiences/:id", authenticateToken, requireRole(["CANDIDATE"]), updateExperience);
router.delete("/experiences/:id", authenticateToken, requireRole(["CANDIDATE"]), deleteExperience);

// Routes pour les compétences
router.get("/skills", authenticateToken, requireRole(["CANDIDATE"]), getCandidateSkills);
router.post("/skills", authenticateToken, requireRole(["CANDIDATE"]), addCandidateSkill);
router.delete("/skills/:skillId", authenticateToken, requireRole(["CANDIDATE"]), removeCandidateSkill);

module.exports = router;
