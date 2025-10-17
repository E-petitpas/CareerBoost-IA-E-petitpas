/**
 * Tests pour le service de gestion des entreprises
 * Utilise Jest et Supertest
 */

const request = require('supertest');
const app = require('../server');
const { supabase } = require('../config/supabase');
const companyService = require('../services/companyService');

describe('Company Service', () => {
  let testCompanyId;
  let testUserId;
  let authToken;

  // Setup
  beforeAll(async () => {
    // Créer un utilisateur de test
    const { data: user } = await supabase
      .from('users')
      .insert({
        role: 'RECRUITER',
        name: 'Test Recruiter',
        email: `test-${Date.now()}@example.com`,
        password_hash: 'hashed_password',
        is_active: true
      })
      .select()
      .single();

    testUserId = user.id;
  });

  // Cleanup
  afterAll(async () => {
    if (testCompanyId) {
      await supabase.from('companies').delete().eq('id', testCompanyId);
    }
    if (testUserId) {
      await supabase.from('users').delete().eq('id', testUserId);
    }
  });

  describe('createCompany', () => {
    it('devrait créer une entreprise avec statut PENDING', async () => {
      const companyData = {
        name: 'Test Company',
        siren: '123456789',
        domain: 'https://test.com',
        sector: 'Technology'
      };

      const company = await companyService.createCompany(companyData);

      expect(company).toBeDefined();
      expect(company.name).toBe('Test Company');
      expect(company.status).toBe('PENDING');
      expect(company.siren).toBe('123456789');

      testCompanyId = company.id;
    });

    it('devrait rejeter un SIREN invalide', async () => {
      const companyData = {
        name: 'Invalid Company',
        siren: '12345', // SIREN invalide
        domain: 'https://invalid.com'
      };

      await expect(companyService.createCompany(companyData))
        .rejects
        .toThrow('SIREN invalide');
    });

    it('devrait rejeter un nom vide', async () => {
      const companyData = {
        name: '', // Nom vide
        siren: '123456789',
        domain: 'https://test.com'
      };

      await expect(companyService.createCompany(companyData))
        .rejects
        .toThrow('Nom d\'entreprise invalide');
    });
  });

  describe('createMembership', () => {
    it('devrait créer un membership entre utilisateur et entreprise', async () => {
      const membership = await companyService.createMembership(
        testUserId,
        testCompanyId,
        'ADMIN_RH',
        true
      );

      expect(membership).toBeDefined();
      expect(membership.user_id).toBe(testUserId);
      expect(membership.company_id).toBe(testCompanyId);
      expect(membership.role_in_company).toBe('ADMIN_RH');
    });
  });

  describe('getUserCompanies', () => {
    it('devrait récupérer les entreprises d\'un utilisateur', async () => {
      const companies = await companyService.getUserCompanies(testUserId);

      expect(Array.isArray(companies)).toBe(true);
      expect(companies.length).toBeGreaterThan(0);
    });
  });

  describe('validateCompany', () => {
    it('devrait approuver une entreprise', async () => {
      const company = await companyService.validateCompany(
        testCompanyId,
        'VERIFIED'
      );

      expect(company.status).toBe('VERIFIED');
      expect(company.validated_at).toBeDefined();
    });

    it('devrait rejeter une entreprise avec raison', async () => {
      // Créer une nouvelle entreprise pour le test
      const newCompany = await companyService.createCompany({
        name: 'Company to Reject',
        siren: '987654321',
        domain: 'https://reject.com'
      });

      const company = await companyService.validateCompany(
        newCompany.id,
        'REJECTED',
        'SIREN invalide'
      );

      expect(company.status).toBe('REJECTED');
      expect(company.validation_reason).toBe('SIREN invalide');

      // Cleanup
      await supabase.from('companies').delete().eq('id', newCompany.id);
    });
  });

  describe('getPendingCompanies', () => {
    it('devrait récupérer les entreprises en attente', async () => {
      const result = await companyService.getPendingCompanies(10, 0);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.total).toBeDefined();
      expect(result.limit).toBe(10);
    });
  });
});

describe('Company Routes', () => {
  describe('GET /api/companies/my-companies', () => {
    it('devrait retourner 401 sans authentification', async () => {
      const response = await request(app)
        .get('/api/companies/my-companies');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/admin/companies/pending', () => {
    it('devrait retourner 401 sans authentification', async () => {
      const response = await request(app)
        .get('/api/admin/companies/pending');

      expect(response.status).toBe(401);
    });

    it('devrait retourner 403 sans rôle admin', async () => {
      // Ce test nécessite un token de recruteur
      // À implémenter avec un token valide
    });
  });
});

describe('Validation', () => {
  const { validateSIREN, validateEmail } = require('../utils/validation');

  describe('validateSIREN', () => {
    it('devrait valider un SIREN correct', () => {
      expect(validateSIREN('123456789')).toBe(true);
    });

    it('devrait rejeter un SIREN avec moins de 9 chiffres', () => {
      expect(validateSIREN('12345678')).toBe(false);
    });

    it('devrait rejeter un SIREN avec des lettres', () => {
      expect(validateSIREN('12345678a')).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('devrait valider un email correct', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });

    it('devrait rejeter un email sans @', () => {
      expect(validateEmail('testexample.com')).toBe(false);
    });

    it('devrait rejeter un email sans domaine', () => {
      expect(validateEmail('test@')).toBe(false);
    });
  });
});

