/**
 * Tests pour CareerBoostSkillsService
 * Validation de l'intégration avec le cahier des charges
 */

const CareerBoostSkillsService = require('../services/careerBoostSkillsService');

describe('CareerBoostSkillsService', () => {
  let careerBoostService;

  beforeEach(() => {
    careerBoostService = new CareerBoostSkillsService();
  });

  describe('extractSkillsForMatching', () => {
    it('devrait extraire les compétences au format CareerBoost pour une offre de développement', async () => {
      const jobOffer = {
        title: 'Développeur Full Stack React Node.js',
        description: `
          Nous recherchons un développeur full stack expérimenté pour rejoindre notre équipe.
          
          Compétences requises :
          - React, Node.js, JavaScript, TypeScript
          - MongoDB, PostgreSQL
          - Git, Docker
          
          Compétences appréciées :
          - AWS, Kubernetes
          - Jest, Cypress
        `,
        company: 'TechCorp',
        location: 'Paris'
      };

      const result = await careerBoostService.extractSkillsForMatching(jobOffer);

      // Vérification du format CareerBoost
      expect(result).toHaveProperty('required_skills');
      expect(result).toHaveProperty('optional_skills');
      expect(result).toHaveProperty('skills_detail');
      expect(result).toHaveProperty('parsing_confidence');

      // Vérification des compétences requises (poids >= 3)
      expect(result.required_skills).toContain('react');
      expect(result.required_skills).toContain('nodejs');
      expect(result.required_skills).toContain('javascript');
      expect(result.required_skills).toContain('typescript');

      // Vérification des compétences optionnelles
      expect(result.optional_skills).toContain('aws');
      expect(result.optional_skills).toContain('jest');

      // Vérification des détails pour le matching
      expect(result.skills_detail).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            skill: 'react',
            name: 'React',
            required: true,
            weight: expect.any(Number)
          })
        ])
      );

      // Vérification des métadonnées
      expect(result.total_skills_count).toBeGreaterThan(5);
      expect(result.parsing_confidence).toBeGreaterThan(0.5);
    });

    it('devrait gérer une offre non-développement (support technique)', async () => {
      const jobOffer = {
        title: 'Technicien Support Informatique',
        description: `
          Poste de technicien support pour assistance utilisateurs.
          
          Missions :
          - Support technique Windows, Mac
          - Maintenance matériel
          - Gestion des incidents
          - Utilisation d'Excel, Outlook
        `,
        company: 'ServiceIT',
        location: 'Lyon'
      };

      const result = await careerBoostService.extractSkillsForMatching(jobOffer);

      // Ne devrait pas contenir de langages de programmation
      expect(result.required_skills).not.toContain('c++');
      expect(result.required_skills).not.toContain('c#');
      expect(result.required_skills).not.toContain('java');

      // Devrait contenir les compétences support
      expect(result.required_skills.concat(result.optional_skills))
        .toEqual(expect.arrayContaining(['windows', 'excel', 'support-technique']));
    });
  });

  describe('analyzePastedOffer', () => {
    it('devrait analyser une offre collée par un candidat', async () => {
      const offerContent = {
        text: `
          Développeur Python Django recherché pour startup fintech.
          
          Stack technique : Python, Django, PostgreSQL, Redis, Docker
          Expérience requise : 2-3 ans minimum
          Localisation : Paris ou remote
        `,
        title: 'Développeur Python Django',
        source: 'https://example.com/job/123'
      };

      const result = await careerBoostService.analyzePastedOffer(offerContent);

      // Vérification du format pour candidat
      expect(result).toHaveProperty('relevance_score');
      expect(result).toHaveProperty('explanation');
      expect(result).toHaveProperty('detected_skills');
      expect(result).toHaveProperty('analysis_metadata');

      // Vérification des compétences détectées
      expect(result.detected_skills.required).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Python',
            category: expect.any(String),
            importance: 'Obligatoire'
          })
        ])
      );

      // Vérification de l'explication
      expect(result.explanation).toContain('compétences détectées');
      expect(result.relevance_score).toBeGreaterThan(0);
    });
  });

  describe('calculateMatchingScore', () => {
    it('devrait calculer un score de matching selon le cahier des charges', () => {
      const candidateSkills = ['react', 'javascript', 'nodejs', 'git'];
      const jobSkills = {
        required_skills: ['react', 'javascript', 'nodejs'],
        optional_skills: ['typescript', 'docker', 'aws']
      };
      const candidateProfile = {
        location: { lat: 48.8566, lng: 2.3522 }, // Paris
        mobility_km: 30,
        preferred_contracts: ['CDI', 'CDD'],
        experience_years: 3
      };
      const jobOffer = {
        location: { lat: 48.8566, lng: 2.3522 }, // Paris
        contract_type: 'CDI',
        experience_min: 2
      };

      const result = careerBoostService.calculateMatchingScore(
        candidateSkills, 
        jobSkills, 
        candidateProfile, 
        jobOffer
      );

      // Vérification du format de sortie
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('explanation');
      expect(result).toHaveProperty('details');

      // Score élevé car toutes les compétences requises sont matchées
      expect(result.score).toBeGreaterThan(70);

      // Vérification de l'explication
      expect(result.explanation).toContain('Score');
      expect(result.explanation).toContain('compétences');

      // Vérification des détails
      expect(result.details).toHaveProperty('matched_skills');
      expect(result.details).toHaveProperty('missing_skills');
      expect(result.details.matched_skills).toContain('react');
      expect(result.details.matched_skills).toContain('javascript');
      expect(result.details.matched_skills).toContain('nodejs');
    });

    it('devrait retourner score 0 pour filtres durs non respectés', () => {
      const candidateSkills = ['react', 'javascript'];
      const jobSkills = {
        required_skills: ['react', 'javascript'],
        optional_skills: []
      };
      const candidateProfile = {
        location: { lat: 48.8566, lng: 2.3522 }, // Paris
        mobility_km: 10, // Seulement 10km
        preferred_contracts: ['CDI']
      };
      const jobOffer = {
        location: { lat: 45.7640, lng: 4.8357 }, // Lyon (400km de Paris)
        contract_type: 'CDI'
      };

      const result = careerBoostService.calculateMatchingScore(
        candidateSkills, 
        jobSkills, 
        candidateProfile, 
        jobOffer
      );

      // Score 0 à cause de la distance
      expect(result.score).toBe(0);
      expect(result.explanation).toContain('éloigné');
    });

    it('devrait retourner score 0 pour type de contrat incompatible', () => {
      const candidateSkills = ['react', 'javascript'];
      const jobSkills = {
        required_skills: ['react', 'javascript'],
        optional_skills: []
      };
      const candidateProfile = {
        location: { lat: 48.8566, lng: 2.3522 },
        mobility_km: 50,
        preferred_contracts: ['CDI'] // Refuse les stages
      };
      const jobOffer = {
        location: { lat: 48.8566, lng: 2.3522 },
        contract_type: 'STAGE' // Propose un stage
      };

      const result = careerBoostService.calculateMatchingScore(
        candidateSkills, 
        jobSkills, 
        candidateProfile, 
        jobOffer
      );

      expect(result.score).toBe(0);
      expect(result.explanation).toContain('contrat incompatible');
    });
  });

  describe('Intégration complète - Cas réels CareerBoost', () => {
    it('devrait traiter une offre France Travail typique', async () => {
      const jobOffer = {
        title: 'Développeur Web Full Stack (H/F)',
        description: `
          Dans le cadre du développement de nos activités, nous recherchons un développeur web full stack.
          
          MISSIONS :
          - Développement d'applications web avec React et Node.js
          - Intégration d'APIs REST
          - Maintenance et évolution du code existant
          - Collaboration avec l'équipe UX/UI
          
          PROFIL RECHERCHÉ :
          - Formation Bac+3/5 en informatique
          - Expérience 2-3 ans en développement web
          - Maîtrise JavaScript, React, Node.js, MongoDB
          - Connaissance Git, Docker appréciée
          - Anglais technique
          
          CONTRAT : CDI
          LOCALISATION : Nantes
          SALAIRE : 35-45K€
        `,
        company: 'WebCorp',
        location: 'Nantes',
        contract_type: 'CDI',
        source: 'FRANCE_TRAVAIL'
      };

      // Test extraction pour matching
      const skillsResult = await careerBoostService.extractSkillsForMatching(jobOffer);
      
      expect(skillsResult.required_skills).toContain('react');
      expect(skillsResult.required_skills).toContain('nodejs');
      expect(skillsResult.required_skills).toContain('javascript');
      expect(skillsResult.optional_skills).toContain('docker');
      expect(skillsResult.parsing_confidence).toBeGreaterThan(0.7);

      // Test matching avec profil candidat
      const candidateProfile = {
        skills: ['react', 'javascript', 'nodejs', 'git', 'html', 'css'],
        location: { lat: 47.2184, lng: -1.5536 }, // Nantes
        mobility_km: 20,
        preferred_contracts: ['CDI', 'CDD'],
        experience_years: 3
      };

      const matchingResult = careerBoostService.calculateMatchingScore(
        candidateProfile.skills,
        skillsResult,
        candidateProfile,
        jobOffer
      );

      expect(matchingResult.score).toBeGreaterThan(80); // Bon matching
      expect(matchingResult.explanation).toContain('correspondez sur');
      expect(matchingResult.details.matched_skills.length).toBeGreaterThan(3);
    });
  });

  describe('Gestion des erreurs et fallbacks', () => {
    it('devrait gérer les erreurs d\'extraction gracieusement', async () => {
      const invalidJobOffer = {
        title: null,
        description: '',
        company: undefined
      };

      const result = await careerBoostService.extractSkillsForMatching(invalidJobOffer);

      expect(result).toHaveProperty('required_skills');
      expect(result).toHaveProperty('optional_skills');
      expect(result.required_skills).toEqual([]);
      expect(result.optional_skills).toEqual([]);
      expect(result.parsing_confidence).toBe(0);
    });

    it('devrait gérer les erreurs de matching gracieusement', () => {
      const result = careerBoostService.calculateMatchingScore(
        null, // candidateSkills invalide
        { required_skills: [], optional_skills: [] },
        {},
        {}
      );

      expect(result.score).toBe(0);
      expect(result.explanation).toContain('Erreur');
      expect(result).toHaveProperty('error');
    });
  });
});
