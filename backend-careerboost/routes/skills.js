const express = require("express");
const {
  getSkills,
  getSkillById,
  createSkill,
  updateSkill,
  deleteSkill,
  createSkillsBatch
} = require("../controllers/skillsController");
const { authenticateToken, requireRole, optionalAuth } = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Skills
 *   description: API pour gérer le référentiel de compétences
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Skill:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         slug:
 *           type: string
 *         display_name:
 *           type: string
 */

/**
 * @swagger
 * /skills:
 *   get:
 *     summary: Récupère toutes les compétences
 *     tags: [Skills]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche dans slug et display_name
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Décalage pour la pagination
 *     responses:
 *       200:
 *         description: Liste des compétences
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Skill'
 */
router.get("/", optionalAuth, getSkills);

/**
 * @swagger
 * /skills/{id}:
 *   get:
 *     summary: Récupère une compétence par ID
 *     tags: [Skills]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la compétence
 *     responses:
 *       200:
 *         description: Détails de la compétence
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Skill'
 *       404:
 *         description: Compétence non trouvée
 */
router.get("/:id", optionalAuth, getSkillById);

/**
 * @swagger
 * /skills:
 *   post:
 *     summary: Crée une nouvelle compétence (admin seulement)
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slug
 *               - display_name
 *             properties:
 *               slug:
 *                 type: string
 *               display_name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Compétence créée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Skill'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       409:
 *         description: Slug déjà existant
 */
router.post("/", authenticateToken, requireRole(["ADMIN"]), createSkill);

/**
 * @swagger
 * /skills/batch:
 *   post:
 *     summary: Crée plusieurs compétences en lot (admin seulement)
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - skills
 *             properties:
 *               skills:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - slug
 *                     - display_name
 *                   properties:
 *                     slug:
 *                       type: string
 *                     display_name:
 *                       type: string
 *     responses:
 *       201:
 *         description: Compétences créées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 skills:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Skill'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 */
router.post("/batch", authenticateToken, requireRole(["ADMIN"]), createSkillsBatch);

/**
 * @swagger
 * /skills/{id}:
 *   put:
 *     summary: Modifie une compétence (admin seulement)
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la compétence
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               slug:
 *                 type: string
 *               display_name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Compétence modifiée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Skill'
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Compétence non trouvée
 *       409:
 *         description: Slug déjà existant
 */
router.put("/:id", authenticateToken, requireRole(["ADMIN"]), updateSkill);

/**
 * @swagger
 * /skills/{id}:
 *   delete:
 *     summary: Supprime une compétence (admin seulement)
 *     tags: [Skills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID de la compétence
 *     responses:
 *       200:
 *         description: Compétence supprimée
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Compétence non trouvée
 *       409:
 *         description: Compétence utilisée par des candidats ou offres
 */
router.delete("/:id", authenticateToken, requireRole(["ADMIN"]), deleteSkill);

module.exports = router;
