const Joi = require('joi');

// Schémas de validation pour l'authentification
const authSchemas = {
  register: Joi.object({
    role: Joi.string().valid('CANDIDATE', 'RECRUITER').required(),
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[+]?[0-9\s\-\(\)]{8,20}$/).optional(),
    // password: Supprimé - sera défini via l'email d'invitation
    city: Joi.string().max(100).optional(),
    companyName: Joi.when('role', {
      is: 'RECRUITER',
      then: Joi.string().min(2).max(200).required(),
      otherwise: Joi.forbidden()
    }),
    companySiren: Joi.when('role', {
      is: 'RECRUITER',
      then: Joi.string().pattern(/^[0-9]{9}$/).required(),
      otherwise: Joi.forbidden()
    }),
    companyDomain: Joi.when('role', {
      is: 'RECRUITER',
      then: Joi.string().pattern(/^https?:\/\/.+\..+/).optional(),
      otherwise: Joi.forbidden()
    })
  }),

  setPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })
};

// Schémas pour le profil candidat
const candidateSchemas = {
  profile: Joi.object({
    title: Joi.string().max(200).optional(),
    summary: Joi.string().max(2000).optional(),
    experience_years: Joi.number().min(0).max(50).optional(),
    mobility_km: Joi.number().min(0).max(1000).default(0),
    preferred_contracts: Joi.array().items(
      Joi.string().valid('CDI', 'CDD', 'STAGE', 'ALTERNANCE', 'INTERIM', 'FREELANCE', 'TEMPS_PARTIEL', 'TEMPS_PLEIN', 'OTHER')
    ).default([])
  }),

  education: Joi.object({
    school: Joi.string().max(200).required(),
    degree: Joi.string().max(200).optional(),
    field: Joi.string().max(200).optional(),
    start_date: Joi.date().optional(),
    end_date: Joi.date().min(Joi.ref('start_date')).optional(),
    description: Joi.string().max(1000).optional()
  }),

  experience: Joi.object({
    company: Joi.string().max(200).required(),
    role_title: Joi.string().max(200).required(),
    start_date: Joi.date().optional(),
    end_date: Joi.date().min(Joi.ref('start_date')).optional(),
    description: Joi.string().max(1000).optional()
  }),

  skill: Joi.object({
    skill_name: Joi.string().min(1).max(200).required(),
    proficiency_level: Joi.number().min(1).max(5).optional()
  }),

  skills: Joi.array().items(
    Joi.object({
      skill_id: Joi.string().uuid().required(),
      proficiency_level: Joi.number().min(1).max(5).optional()
    })
  )
};

// Schémas pour les offres d'emploi
const offerSchemas = {
  create: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().min(50).max(5000).required(),
    city: Joi.string().max(100).optional(),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
    contract_type: Joi.string().valid('CDI', 'CDD', 'STAGE', 'ALTERNANCE', 'INTERIM', 'FREELANCE', 'TEMPS_PARTIEL', 'TEMPS_PLEIN', 'OTHER').optional(),
    experience_min: Joi.number().min(0).max(50).optional(),
    salary_min: Joi.number().min(0).optional(),
    salary_max: Joi.number().min(Joi.ref('salary_min')).optional(),
    required_skills: Joi.array().items(Joi.string().uuid()).default([]),
    optional_skills: Joi.array().items(Joi.string().uuid()).default([])
  }),

  search: Joi.object({
    near: Joi.string().max(100).optional(),
    radius: Joi.number().min(0).max(1000).default(25),
    minScore: Joi.number().min(0).max(100).default(0),
    contract_type: Joi.string().valid('CDI', 'CDD', 'STAGE', 'ALTERNANCE', 'INTERIM', 'FREELANCE', 'TEMPS_PARTIEL', 'TEMPS_PLEIN', 'OTHER').optional(),
    experience_min: Joi.number().min(0).max(50).optional(),
    salary_min: Joi.number().min(0).optional(),
    source: Joi.string().valid('INTERNAL', 'EXTERNAL').optional(),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(50).default(20)
  })
};

// Schémas pour les candidatures
const applicationSchemas = {
  apply: Joi.object({
    offer_id: Joi.string().uuid().required(),
    custom_message: Joi.string().max(500).optional()
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('ENVOYE', 'EN_ATTENTE', 'ENTRETIEN', 'REFUS', 'EMBAUCHE').required(),
    note: Joi.string().max(1000).optional()
  })
};

// Middleware de validation
const validate = (schema) => {
  return (req, res, next) => {
    console.log('Validation - Données reçues:', req.body);

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      console.error('Erreur de validation:', error.details);
      const errorResponse = {
        error: 'Données invalides',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      };
      console.log('Réponse d\'erreur:', errorResponse);
      return res.status(400).json(errorResponse);
    }

    console.log('Validation réussie - Données nettoyées:', value);
    req.body = value;
    next();
  };
};

// Schémas pour les entreprises
const companySchemas = {
  updateCompany: Joi.object({
    name: Joi.string().min(2).max(200).optional(),
    sector: Joi.string().max(100).optional(),
    size: Joi.string().valid('1-10', '11-50', '51-200', '201-500', '500+').optional(),
    logo_url: Joi.string().uri().optional(),
    description: Joi.string().max(2000).optional()
  }),

  contestRejection: Joi.object({
    message: Joi.string().min(10).max(1000).required()
  })
};

// Schémas pour les admins
const adminSchemas = {
  rejectCompany: Joi.object({
    reason: Joi.string().min(10).max(500).required()
  })
};

// Fonctions utilitaires de validation
const validateSIREN = (siren) => {
  if (!siren || !/^\d{9}$/.test(siren)) {
    return false;
  }

  // Algorithme de Luhn pour valider le SIREN
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(siren[i]);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
  }

  return sum % 10 === 0;
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

module.exports = {
  authSchemas,
  candidateSchemas,
  offerSchemas,
  applicationSchemas,
  companySchemas,
  adminSchemas,
  validate,
  validateSIREN,
  validateEmail
};
