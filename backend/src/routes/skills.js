const express = require('express');
const SkillsService = require('../services/skillsService');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Rechercher des compétences (accessible à tous les utilisateurs authentifiés)
router.get('/search', authenticateToken, asyncHandler(async (req, res) => {
  const { q, limit = 20 } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'La recherche doit contenir au moins 2 caractères' });
  }

  const skills = await SkillsService.searchSkills(q.trim(), parseInt(limit));
  res.json({ skills });
}));

// Obtenir toutes les compétences
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const skills = await SkillsService.getAllSkills();
  res.json({ skills });
}));

// Obtenir les compétences les plus demandées
router.get('/top', authenticateToken, asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;
  const skills = await SkillsService.getTopSkills(parseInt(limit));
  res.json({ skills });
}));

// Créer une nouvelle compétence (tous les utilisateurs authentifiés peuvent suggérer)
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const { display_name } = req.body;

  if (!display_name || display_name.trim().length < 2) {
    return res.status(400).json({ error: 'Le nom de la compétence est requis (minimum 2 caractères)' });
  }

  try {
    const skill = await SkillsService.createSkill(display_name.trim());
    res.status(201).json({ 
      message: 'Compétence créée avec succès',
      skill 
    });
  } catch (error) {
    if (error.code === '23505') { // Violation de contrainte unique
      return res.status(409).json({ error: 'Cette compétence existe déjà' });
    }
    throw error;
  }
}));

module.exports = router;
