const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de base
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Middleware de logging
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.url}`);
  next();
});

// Route de test
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server running' });
});

// Routes d'authentification simplifiées
app.post('/api/auth/login', (req, res) => {
  console.log('POST /api/auth/login called with:', req.body);

  const { email, password } = req.body;

  // Simulation de connexion avec gestion des rôles
  if (email && password) {
    let role = 'CANDIDATE';
    let name = 'John Doe';
    let company_memberships = null;

    // Déterminer le rôle selon l'email
    if (email.includes('recruiter') || email.includes('recruteur') || email.includes('rh')) {
      role = 'RECRUITER';
      name = 'Marie Dupont (RH)';
      company_memberships = [{
        company_id: 'company-1',
        role_in_company: 'ADMIN_RH',
        is_primary: true,
        companies: {
          id: 'company-1',
          name: 'TechCorp Solutions',
          status: 'VERIFIED',
          logo_url: null,
          sector: 'Informatique'
        }
      }];
    } else if (email.includes('admin')) {
      role = 'ADMIN';
      name = 'Pierre Martin (Admin)';
    } else {
      // Candidat par défaut
      name = 'Andson Andriamitovy';
    }

    const mockUser = {
      id: role === 'RECRUITER' ? 'recruiter-user-id' : role === 'ADMIN' ? 'admin-user-id' : 'mock-user-id',
      email: email,
      name: name,
      role: role,
      phone: '+33123456789',
      city: 'Paris',
      latitude: 48.8566,
      longitude: 2.3522,
      company_memberships: company_memberships
    };

    const mockToken = 'mock-jwt-token-' + Date.now();

    res.json({
      user: mockUser,
      token: mockToken,
      message: 'Connexion réussie'
    });
  } else {
    res.status(400).json({ error: 'Email et mot de passe requis' });
  }
});

app.post('/api/auth/register', (req, res) => {
  console.log('POST /api/auth/register called with:', req.body);
  res.json({ message: 'Inscription simulée réussie' });
});

app.post('/api/auth/logout', (req, res) => {
  console.log('POST /api/auth/logout called');
  res.json({ message: 'Déconnexion réussie' });
});

// Stockage en mémoire pour les offres d'emploi mockées
let mockOffers = [
  {
    id: '1',
    title: 'Développeur Full Stack React/Node.js',
    description: 'Nous recherchons un développeur full stack expérimenté pour rejoindre notre équipe dynamique. Vous travaillerez sur des projets innovants utilisant React, Node.js et PostgreSQL.',
    city: 'Paris',
    latitude: 48.8566,
    longitude: 2.3522,
    contract_type: 'CDI',
    experience_min: 3,
    salary_min: 45000,
    salary_max: 65000,
    currency: '€',
    source: 'DIRECT',
    published_at: '2024-01-15T10:00:00Z',
    admin_status: 'APPROVED',
    status: 'ACTIVE',
    companies: {
      id: '1',
      name: 'TechCorp',
      logo_url: null,
      sector: 'Technologie'
    },
    job_offer_skills: [
      { is_required: true, weight: 5, skills: { id: 1, slug: 'javascript', display_name: 'JavaScript' } },
      { is_required: true, weight: 5, skills: { id: 2, slug: 'react', display_name: 'React' } },
      { is_required: true, weight: 4, skills: { id: 3, slug: 'nodejs', display_name: 'Node.js' } },
      { is_required: false, weight: 3, skills: { id: 9, slug: 'sql', display_name: 'SQL' } }
    ],
    score: 85
  },
  {
    id: '2',
    title: 'Data Scientist Python',
    description: 'Rejoignez notre équipe data pour analyser et modéliser des données complexes. Expertise en Python, Machine Learning et statistiques requise.',
    city: 'Lyon',
    latitude: 45.7640,
    longitude: 4.8357,
    contract_type: 'CDI',
    experience_min: 2,
    salary_min: 40000,
    salary_max: 55000,
    currency: '€',
    source: 'DIRECT',
    published_at: '2024-01-14T14:30:00Z',
    admin_status: 'APPROVED',
    status: 'ACTIVE',
    companies: {
      id: '2',
      name: 'DataLab',
      logo_url: null,
      sector: 'Data & IA'
    },
    job_offer_skills: [
      { is_required: true, weight: 5, skills: { id: 4, slug: 'python', display_name: 'Python' } },
      { is_required: true, weight: 4, skills: { id: 9, slug: 'sql', display_name: 'SQL' } },
      { is_required: false, weight: 3, skills: { id: 12, slug: 'aws', display_name: 'AWS' } }
    ],
    score: 72
  },
  {
    id: '3',
    title: 'Développeur Frontend React',
    description: 'Créez des interfaces utilisateur modernes et responsives avec React, TypeScript et Tailwind CSS. Expérience en UX/UI appréciée.',
    city: 'Marseille',
    latitude: 43.2965,
    longitude: 5.3698,
    contract_type: 'CDD',
    experience_min: 1,
    salary_min: 35000,
    salary_max: 45000,
    currency: '€',
    source: 'DIRECT',
    published_at: '2024-01-13T09:15:00Z',
    admin_status: 'APPROVED',
    status: 'ACTIVE',
    companies: {
      id: '3',
      name: 'WebAgency',
      logo_url: null,
      sector: 'Web & Digital'
    },
    job_offer_skills: [
      { is_required: true, weight: 5, skills: { id: 1, slug: 'javascript', display_name: 'JavaScript' } },
      { is_required: true, weight: 5, skills: { id: 2, slug: 'react', display_name: 'React' } },
      { is_required: true, weight: 4, skills: { id: 8, slug: 'css', display_name: 'CSS' } },
      { is_required: false, weight: 2, skills: { id: 7, slug: 'html', display_name: 'HTML' } }
    ],
    score: 91
  }
];

// Stockage en mémoire pour les données mockées
let mockProfile = {
  user_id: 'mock-user-id',
  title: 'Développeur Full Stack',
  summary: 'Développeur passionné avec 5 ans d\'expérience',
  experience_years: 5,
  mobility_km: 25,
  preferred_contracts: ['CDI', 'FREELANCE'],
  updated_at: new Date().toISOString(),
  users: {
    id: 'mock-user-id',
    name: 'Andson Andriamitovy',
    email: 'andson.andriamitovy@e-petitpas.fr',
    phone: '+33123456789',
    city: 'Paris',
    latitude: 48.8566,
    longitude: 2.3522
  },
  candidate_skills: [
    {
      proficiency_level: 4,
      last_used_on: '2024-01-01',
      skills: {
        id: 1,
        slug: 'javascript',
        display_name: 'JavaScript'
      }
    },
    {
      proficiency_level: 3,
      last_used_on: '2023-12-01',
      skills: {
        id: 2,
        slug: 'react',
        display_name: 'React'
      }
    }
  ],
  experiences: [
    {
      id: 1,
      company: 'Tech Corp',
      position: 'Développeur Frontend',
      start_date: '2020-01-01',
      end_date: '2023-12-31',
      description: 'Développement d\'applications React'
    }
  ],
  educations: [
    {
      id: 1,
      school: 'Université de Paris',
      degree: 'Master',
      field: 'Informatique',
      start_date: '2018-09-01',
      end_date: '2020-06-30',
      description: 'Master en développement logiciel'
    }
  ]
};

// Route de profil candidat - GET
app.get('/api/candidate/profile', (req, res) => {
  console.log('GET /api/candidate/profile called');
  res.json({ profile: mockProfile });
});

// Route de profil candidat - PUT (mise à jour)
app.put('/api/candidate/profile', (req, res) => {
  console.log('PUT /api/candidate/profile called with:', req.body);

  // Mettre à jour les données mockées
  if (req.body.title !== undefined) mockProfile.title = req.body.title;
  if (req.body.summary !== undefined) mockProfile.summary = req.body.summary;
  if (req.body.experience_years !== undefined) mockProfile.experience_years = req.body.experience_years;
  if (req.body.mobility_km !== undefined) mockProfile.mobility_km = req.body.mobility_km;
  if (req.body.preferred_contracts !== undefined) mockProfile.preferred_contracts = req.body.preferred_contracts;

  mockProfile.updated_at = new Date().toISOString();

  res.json({
    profile: mockProfile,
    message: 'Profil mis à jour avec succès'
  });
});

// Route des compétences - PUT
app.put('/api/candidate/skills', (req, res) => {
  console.log('PUT /api/candidate/skills called with:', req.body);

  // Le frontend envoie un array directement, pas un objet avec skills
  const skillsArray = Array.isArray(req.body) ? req.body : (req.body.skills || []);

  if (skillsArray.length > 0) {
    // Mettre à jour les compétences existantes
    mockProfile.candidate_skills = mockProfile.candidate_skills.map(existingSkill => {
      const updatedSkill = skillsArray.find(s => s.skill_id === existingSkill.skills.id);
      if (updatedSkill) {
        return {
          ...existingSkill,
          proficiency_level: updatedSkill.proficiency_level || existingSkill.proficiency_level,
          last_used_on: updatedSkill.last_used_on || existingSkill.last_used_on
        };
      }
      return existingSkill;
    });
  }

  res.json({
    message: 'Compétences mises à jour avec succès',
    skills: mockProfile.candidate_skills
  });
});

// Route pour ajouter une nouvelle compétence
app.post('/api/candidate/skills', (req, res) => {
  console.log('POST /api/candidate/skills called with:', req.body);

  const { skill_name, proficiency_level, last_used_on } = req.body;

  if (!skill_name) {
    return res.status(400).json({ error: 'Le nom de la compétence est requis' });
  }

  const newSkill = {
    proficiency_level: proficiency_level || 1,
    last_used_on: last_used_on || new Date().toISOString().split('T')[0],
    skills: {
      id: Date.now(),
      slug: skill_name.toLowerCase().replace(/\s+/g, '-'),
      display_name: skill_name
    }
  };

  mockProfile.candidate_skills.push(newSkill);

  res.json({
    skill: newSkill,
    message: 'Compétence ajoutée avec succès'
  });
});

// Route pour supprimer une compétence
app.delete('/api/candidate/skills/:id', (req, res) => {
  console.log('DELETE /api/candidate/skills/:id called with:', req.params.id);

  const skillIndex = mockProfile.candidate_skills.findIndex(skill => skill.skills.id == req.params.id);
  if (skillIndex !== -1) {
    mockProfile.candidate_skills.splice(skillIndex, 1);
    res.json({ message: 'Compétence supprimée avec succès' });
  } else {
    res.status(404).json({ error: 'Compétence non trouvée' });
  }
});

// Routes pour la liste des compétences disponibles
app.get('/api/skills', (req, res) => {
  console.log('GET /api/skills called');

  const availableSkills = [
    { id: 1, slug: 'javascript', display_name: 'JavaScript' },
    { id: 2, slug: 'react', display_name: 'React' },
    { id: 3, slug: 'nodejs', display_name: 'Node.js' },
    { id: 4, slug: 'python', display_name: 'Python' },
    { id: 5, slug: 'java', display_name: 'Java' },
    { id: 6, slug: 'php', display_name: 'PHP' },
    { id: 7, slug: 'html', display_name: 'HTML' },
    { id: 8, slug: 'css', display_name: 'CSS' },
    { id: 9, slug: 'sql', display_name: 'SQL' },
    { id: 10, slug: 'git', display_name: 'Git' },
    { id: 11, slug: 'docker', display_name: 'Docker' },
    { id: 12, slug: 'aws', display_name: 'AWS' }
  ];

  res.json({ skills: availableSkills });
});

app.get('/api/skills/search', (req, res) => {
  console.log('GET /api/skills/search called with query:', req.query.q);

  const query = (req.query.q || '').toLowerCase();
  const limit = parseInt(req.query.limit) || 20;

  const availableSkills = [
    { id: 1, slug: 'javascript', display_name: 'JavaScript' },
    { id: 2, slug: 'react', display_name: 'React' },
    { id: 3, slug: 'nodejs', display_name: 'Node.js' },
    { id: 4, slug: 'python', display_name: 'Python' },
    { id: 5, slug: 'java', display_name: 'Java' },
    { id: 6, slug: 'php', display_name: 'PHP' },
    { id: 7, slug: 'html', display_name: 'HTML' },
    { id: 8, slug: 'css', display_name: 'CSS' },
    { id: 9, slug: 'sql', display_name: 'SQL' },
    { id: 10, slug: 'git', display_name: 'Git' },
    { id: 11, slug: 'docker', display_name: 'Docker' },
    { id: 12, slug: 'aws', display_name: 'AWS' }
  ];

  const filteredSkills = availableSkills
    .filter(skill => skill.display_name.toLowerCase().includes(query))
    .slice(0, limit);

  res.json({ skills: filteredSkills });
});

// Stockage en mémoire pour les offres sauvegardées
let savedOffers = [];

// Stockage en mémoire pour les candidatures
let applications = [];
let applicationIdCounter = 1;

// Routes pour les offres sauvegardées
app.get('/api/candidate/saved-offers', (req, res) => {
  console.log('GET /api/candidate/saved-offers called');

  const userSavedOffers = savedOffers.filter(saved => saved.user_id === 'mock-user-id');

  res.json({
    data: userSavedOffers,
    pagination: {
      page: 1,
      limit: 10,
      total: userSavedOffers.length,
      totalPages: 1
    }
  });
});

app.post('/api/candidate/saved-offers', (req, res) => {
  console.log('POST /api/candidate/saved-offers called with:', req.body);

  const { job_offer_id, list_name, notes } = req.body;

  // Vérifier si l'offre n'est pas déjà sauvegardée
  const existingIndex = savedOffers.findIndex(
    saved => saved.user_id === 'mock-user-id' && saved.job_offer_id === job_offer_id
  );

  if (existingIndex !== -1) {
    return res.status(400).json({ error: 'Offre déjà sauvegardée' });
  }

  const newSavedOffer = {
    id: Date.now().toString(),
    user_id: 'mock-user-id',
    job_offer_id,
    list_name: list_name || 'Favoris',
    notes: notes || '',
    created_at: new Date().toISOString()
  };

  savedOffers.push(newSavedOffer);

  res.json({
    savedOffer: newSavedOffer,
    message: 'Offre sauvegardée avec succès'
  });
});

app.delete('/api/candidate/saved-offers/:offerId', (req, res) => {
  console.log('DELETE /api/candidate/saved-offers/:offerId called with:', req.params.offerId);

  const offerIndex = savedOffers.findIndex(
    saved => saved.user_id === 'mock-user-id' && saved.job_offer_id === req.params.offerId
  );

  if (offerIndex !== -1) {
    savedOffers.splice(offerIndex, 1);
    res.json({ message: 'Offre supprimée des favoris' });
  } else {
    res.status(404).json({ error: 'Offre non trouvée dans les favoris' });
  }
});

app.get('/api/candidate/saved-offers/lists', (req, res) => {
  console.log('GET /api/candidate/saved-offers/lists called');

  const userSavedOffers = savedOffers.filter(saved => saved.user_id === 'mock-user-id');
  const lists = {};

  userSavedOffers.forEach(saved => {
    const listName = saved.list_name || 'Favoris';
    if (!lists[listName]) {
      lists[listName] = { name: listName, count: 0, created_at: saved.created_at };
    }
    lists[listName].count++;
  });

  res.json({ lists: Object.values(lists) });
});

// Routes pour la génération de CV/LM
app.post('/api/candidate/cv/generate', (req, res) => {
  console.log('POST /api/candidate/cv/generate called');

  // Simulation de génération de CV
  const cvUrl = `https://mock-storage.com/cv/candidate-${Date.now()}.pdf`;

  // Mettre à jour le profil avec l'URL du CV
  mockProfile.cv_url = cvUrl;

  res.json({
    cv_url: cvUrl,
    message: 'CV généré avec succès'
  });
});

app.post('/api/candidate/lm/generate', (req, res) => {
  console.log('POST /api/candidate/lm/generate called with:', req.body);

  const { offer_id, custom_message } = req.body;

  // Simulation de génération de lettre de motivation
  const lmUrl = `https://mock-storage.com/lm/candidate-${Date.now()}-offer-${offer_id}.pdf`;

  res.json({
    lm_url: lmUrl,
    message: 'Lettre de motivation générée avec succès'
  });
});

// Routes pour les candidatures
app.post('/api/applications/apply', (req, res) => {
  console.log('POST /api/applications/apply called with:', req.body);

  const { offer_id, custom_message } = req.body;

  // Vérifier que l'offre existe
  const offer = mockOffers.find(o => o.id === offer_id);
  if (!offer) {
    return res.status(404).json({ error: 'Offre non trouvée' });
  }

  // Vérifier si le candidat a déjà postulé
  const existingApplication = applications.find(app =>
    app.offer_id === offer_id && app.candidate_id === 'mock-user-id'
  );

  if (existingApplication) {
    return res.status(400).json({ error: 'Vous avez déjà postulé à cette offre' });
  }

  // Calculer le score de matching
  const matchingResult = calculateMatchingScore(mockProfile, offer);

  // Générer automatiquement CV et LM
  const cvUrl = mockProfile.cv_url || `https://mock-storage.com/cv/candidate-${Date.now()}.pdf`;
  const lmUrl = `https://mock-storage.com/lm/candidate-${Date.now()}-offer-${offer_id}.pdf`;

  // Créer la candidature
  const application = {
    id: `app-${applicationIdCounter++}`,
    offer_id,
    candidate_id: 'mock-user-id',
    status: 'ENVOYE',
    score: matchingResult.score,
    explanation: matchingResult.explanation,
    cv_snapshot_url: cvUrl,
    lm_snapshot_url: lmUrl,
    custom_message,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    job_offers: {
      id: offer.id,
      title: offer.title,
      city: offer.city,
      contract_type: offer.contract_type,
      companies: {
        name: offer.company_name
      }
    }
  };

  applications.push(application);

  // Simulation d'envoi d'email au recruteur
  console.log(`📧 Email envoyé au recruteur pour l'offre "${offer.title}"`);
  console.log(`📎 CV: ${cvUrl}`);
  console.log(`📎 LM: ${lmUrl}`);

  res.status(201).json({
    application,
    message: 'Candidature envoyée avec succès'
  });
});

app.get('/api/applications/my-applications', (req, res) => {
  console.log('GET /api/applications/my-applications called');

  const userApplications = applications.filter(app => app.candidate_id === 'mock-user-id');

  res.json({
    applications: userApplications
  });
});

app.patch('/api/applications/:id/status', (req, res) => {
  console.log('PATCH /api/applications/:id/status called with:', req.params.id, req.body);

  const { status, note } = req.body;
  const applicationId = req.params.id;

  const application = applications.find(app => app.id === applicationId);
  if (!application) {
    return res.status(404).json({ error: 'Candidature non trouvée' });
  }

  const oldStatus = application.status;
  application.status = status;
  application.updated_at = new Date().toISOString();

  // Ajouter une note si fournie
  if (note) {
    if (!application.notes) application.notes = [];
    application.notes.push({
      note,
      created_at: new Date().toISOString(),
      actor: 'candidate'
    });
  }

  console.log(`📝 Statut candidature mis à jour: ${oldStatus} → ${status}`);

  res.json({
    application,
    message: 'Statut mis à jour avec succès'
  });
});

// Fonction de calcul du score de matching
function calculateMatchingScore(candidateProfile, jobOffer) {
  let score = 0;
  let explanation = [];
  let matchedSkills = [];
  let missingSkills = [];

  // 1. Vérification des critères durs (éliminatoires)

  // Type de contrat
  const candidateContracts = candidateProfile.preferred_contracts || ['CDI', 'CDD', 'STAGE', 'ALTERNANCE'];
  if (!candidateContracts.includes(jobOffer.contract_type)) {
    return {
      score: 0,
      explanation: `Type de contrat incompatible (${jobOffer.contract_type} non souhaité)`,
      matchedSkills: [],
      missingSkills: jobOffer.job_offer_skills.map(jos => jos.skills.display_name)
    };
  }

  // 2. Calcul de la distance (si localisation disponible)
  let distanceScore = 100;
  let distanceKm = 0;
  if (candidateProfile.users && candidateProfile.users.latitude && jobOffer.latitude && jobOffer.longitude) {
    // Calcul simplifié de distance (formule haversine simplifiée)
    const lat1 = candidateProfile.users.latitude;
    const lon1 = candidateProfile.users.longitude;
    const lat2 = jobOffer.latitude;
    const lon2 = jobOffer.longitude;

    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    distanceKm = Math.round(R * c);

    const maxDistance = candidateProfile.mobility_km || 50;
    if (distanceKm > maxDistance) {
      distanceScore = Math.max(0, 100 - (distanceKm - maxDistance) * 2);
    }

    if (distanceKm > 0) {
      explanation.push(`${distanceKm} km de distance`);
    }
  }

  // 3. Calcul des compétences
  const candidateSkills = candidateProfile.candidate_skills || [];
  const requiredSkills = jobOffer.job_offer_skills.filter(jos => jos.is_required);
  const optionalSkills = jobOffer.job_offer_skills.filter(jos => !jos.is_required);

  let skillsScore = 0;
  let totalWeight = 0;

  // Compétences requises (poids fort)
  requiredSkills.forEach(jobSkill => {
    const hasSkill = candidateSkills.some(cs =>
      cs.skills.slug.toLowerCase() === jobSkill.skills.slug.toLowerCase() ||
      cs.skills.display_name.toLowerCase() === jobSkill.skills.display_name.toLowerCase()
    );

    if (hasSkill) {
      matchedSkills.push(jobSkill.skills.display_name);
      skillsScore += jobSkill.weight * 20; // Poids fort pour les compétences requises
    } else {
      missingSkills.push(jobSkill.skills.display_name);
    }
    totalWeight += jobSkill.weight * 20;
  });

  // Compétences optionnelles (poids plus faible)
  optionalSkills.forEach(jobSkill => {
    const hasSkill = candidateSkills.some(cs =>
      cs.skills.slug.toLowerCase() === jobSkill.skills.slug.toLowerCase() ||
      cs.skills.display_name.toLowerCase() === jobSkill.skills.display_name.toLowerCase()
    );

    if (hasSkill) {
      matchedSkills.push(jobSkill.skills.display_name);
      skillsScore += jobSkill.weight * 10; // Poids plus faible pour les optionnelles
    }
    totalWeight += jobSkill.weight * 10;
  });

  const skillsPercentage = totalWeight > 0 ? (skillsScore / totalWeight) * 100 : 50;

  // 4. Calcul de l'expérience
  let experienceScore = 100;
  const candidateExp = candidateProfile.experience_years || 0;
  const requiredExp = jobOffer.experience_min || 0;

  if (candidateExp < requiredExp) {
    const expGap = requiredExp - candidateExp;
    experienceScore = Math.max(20, 100 - (expGap * 15)); // Malus de 15 points par année manquante
    explanation.push(`${expGap} année(s) d'expérience manquante(s)`);
  }

  // 5. Score final pondéré
  const finalScore = Math.round(
    skillsPercentage * 0.6 +      // 60% pour les compétences
    distanceScore * 0.25 +        // 25% pour la localisation
    experienceScore * 0.15        // 15% pour l'expérience
  );

  // 6. Génération de l'explication
  let finalExplanation = `Score ${finalScore}% : `;

  if (matchedSkills.length > 0) {
    finalExplanation += `${matchedSkills.length} compétence(s) correspondante(s) (${matchedSkills.slice(0, 3).join(', ')})`;
  }

  if (missingSkills.length > 0) {
    finalExplanation += `, manque ${missingSkills.slice(0, 2).join(', ')}`;
  }

  if (explanation.length > 0) {
    finalExplanation += `. ${explanation.join(', ')}.`;
  }

  return {
    score: Math.max(0, Math.min(100, finalScore)),
    explanation: finalExplanation,
    matchedSkills,
    missingSkills,
    distanceKm
  };
}

// Route de recherche d'offres améliorée
app.get('/api/offers/search', (req, res) => {
  console.log('🔍 GET /api/offers/search called with params:', req.query);

  const {
    near,
    radius,
    minScore,
    contract_type,
    experience_min,
    experience_max,
    salary_min,
    salary_max,
    skills,
    remote_work,
    sort,
    page = 1,
    limit = 10
  } = req.query;

  let filteredOffers = [...mockOffers];

  // Récupérer le profil du candidat pour calculer les scores
  // En mode mock, on utilise le profil mockProfile
  const candidateProfile = mockProfile;

  // Calculer les scores de matching pour chaque offre
  filteredOffers = filteredOffers.map(offer => {
    const matchingResult = calculateMatchingScore(candidateProfile, offer);
    return {
      ...offer,
      score: matchingResult.score,
      explanation: matchingResult.explanation,
      matched_skills: matchingResult.matchedSkills,
      missing_skills: matchingResult.missingSkills,
      distance_km: matchingResult.distanceKm
    };
  });

  // Filtrer par localisation (simulation simple)
  if (near) {
    const searchCity = near.toLowerCase();
    filteredOffers = filteredOffers.filter(offer =>
      offer.city && offer.city.toLowerCase().includes(searchCity)
    );
  }

  // Filtrer par type de contrat
  if (contract_type) {
    filteredOffers = filteredOffers.filter(offer => offer.contract_type === contract_type);
  }

  // Filtrer par expérience
  if (experience_min) {
    filteredOffers = filteredOffers.filter(offer =>
      !offer.experience_min || offer.experience_min <= parseInt(experience_min)
    );
  }

  if (experience_max) {
    filteredOffers = filteredOffers.filter(offer =>
      !offer.experience_min || offer.experience_min <= parseInt(experience_max)
    );
  }

  // Filtrer par salaire
  if (salary_min) {
    filteredOffers = filteredOffers.filter(offer =>
      !offer.salary_max || offer.salary_max >= parseInt(salary_min)
    );
  }

  if (salary_max) {
    filteredOffers = filteredOffers.filter(offer =>
      !offer.salary_min || offer.salary_min <= parseInt(salary_max)
    );
  }

  // Filtrer par score de matching
  if (minScore) {
    filteredOffers = filteredOffers.filter(offer =>
      offer.score && offer.score >= parseInt(minScore)
    );
  }

  // Filtrer par compétences
  if (skills) {
    const requiredSkills = Array.isArray(skills) ? skills : [skills];
    filteredOffers = filteredOffers.filter(offer =>
      requiredSkills.some(skillSlug =>
        offer.job_offer_skills.some(jos => jos.skills.slug === skillSlug)
      )
    );
  }

  // Tri
  switch (sort) {
    case 'date_desc':
      filteredOffers.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
      break;
    case 'date_asc':
      filteredOffers.sort((a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime());
      break;
    case 'salary_desc':
      filteredOffers.sort((a, b) => (b.salary_max || 0) - (a.salary_max || 0));
      break;
    case 'salary_asc':
      filteredOffers.sort((a, b) => (a.salary_min || 0) - (b.salary_min || 0));
      break;
    case 'score_desc':
      filteredOffers.sort((a, b) => (b.score || 0) - (a.score || 0));
      break;
    case 'relevance':
    default:
      // Tri par pertinence (score + date)
      filteredOffers.sort((a, b) => {
        const scoreA = a.score || 0;
        const scoreB = b.score || 0;
        if (scoreA !== scoreB) return scoreB - scoreA;
        return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      });
      break;
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;
  const paginatedOffers = filteredOffers.slice(startIndex, endIndex);

  res.json({
    data: paginatedOffers,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: filteredOffers.length,
      totalPages: Math.ceil(filteredOffers.length / limitNum)
    }
  });
});

// Routes pour les expériences
app.post('/api/candidate/experiences', (req, res) => {
  console.log('POST /api/candidate/experiences called with:', req.body);

  const newExperience = {
    id: Date.now(),
    ...req.body
  };

  mockProfile.experiences.push(newExperience);

  res.json({
    experience: newExperience,
    message: 'Expérience ajoutée avec succès'
  });
});

app.put('/api/candidate/experiences/:id', (req, res) => {
  console.log('PUT /api/candidate/experiences/:id called with:', req.params.id, req.body);

  const experienceIndex = mockProfile.experiences.findIndex(exp => exp.id == req.params.id);
  if (experienceIndex !== -1) {
    mockProfile.experiences[experienceIndex] = { ...mockProfile.experiences[experienceIndex], ...req.body };
    res.json({
      experience: mockProfile.experiences[experienceIndex],
      message: 'Expérience mise à jour avec succès'
    });
  } else {
    res.status(404).json({ error: 'Expérience non trouvée' });
  }
});

app.delete('/api/candidate/experiences/:id', (req, res) => {
  console.log('DELETE /api/candidate/experiences/:id called with:', req.params.id);

  const experienceIndex = mockProfile.experiences.findIndex(exp => exp.id == req.params.id);
  if (experienceIndex !== -1) {
    mockProfile.experiences.splice(experienceIndex, 1);
    res.json({ message: 'Expérience supprimée avec succès' });
  } else {
    res.status(404).json({ error: 'Expérience non trouvée' });
  }
});

// Routes pour les formations
app.post('/api/candidate/educations', (req, res) => {
  console.log('POST /api/candidate/educations called with:', req.body);

  const newEducation = {
    id: Date.now(),
    ...req.body
  };

  mockProfile.educations.push(newEducation);

  res.json({
    education: newEducation,
    message: 'Formation ajoutée avec succès'
  });
});

app.put('/api/candidate/educations/:id', (req, res) => {
  console.log('PUT /api/candidate/educations/:id called with:', req.params.id, req.body);

  const educationIndex = mockProfile.educations.findIndex(edu => edu.id == req.params.id);
  if (educationIndex !== -1) {
    mockProfile.educations[educationIndex] = { ...mockProfile.educations[educationIndex], ...req.body };
    res.json({
      education: mockProfile.educations[educationIndex],
      message: 'Formation mise à jour avec succès'
    });
  } else {
    res.status(404).json({ error: 'Formation non trouvée' });
  }
});

app.delete('/api/candidate/educations/:id', (req, res) => {
  console.log('DELETE /api/candidate/educations/:id called with:', req.params.id);

  const educationIndex = mockProfile.educations.findIndex(edu => edu.id == req.params.id);
  if (educationIndex !== -1) {
    mockProfile.educations.splice(educationIndex, 1);
    res.json({ message: 'Formation supprimée avec succès' });
  } else {
    res.status(404).json({ error: 'Formation non trouvée' });
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur simplifié démarré sur le port ${PORT}`);
  console.log(`📊 Environnement: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`👤 Profile test: http://localhost:${PORT}/api/candidate/profile`);
});

module.exports = app;
