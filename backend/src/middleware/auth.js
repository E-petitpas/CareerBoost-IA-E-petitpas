const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('Auth Middleware:', {
      url: req.url,
      method: req.method,
      authHeader: authHeader ? authHeader.substring(0, 30) + '...' : 'aucun',
      token: token ? token.substring(0, 20) + '...' : 'aucun'
    });

    if (!token) {
      console.log('Auth Middleware: Token manquant');
      return res.status(401).json({ error: 'Token d\'accès requis' });
    }

    // Vérifier le token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Récupérer les informations utilisateur depuis Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        role,
        name,
        email,
        verified,
        city,
        latitude,
        longitude,
        company_memberships!left (
          company_id,
          role_in_company,
          is_primary,
          companies (
            id,
            name,
            status
          )
        )
      `)
      .eq('id', decoded.userId)
      .is('deleted_at', null)
      .single();

    if (error || !user) {
      console.error('Auth Middleware: Erreur récupération utilisateur:', error);
      console.log('Auth Middleware: Utilisateur trouvé:', !!user);
      return res.status(401).json({ error: 'Token invalide' });
    }

    console.log('Auth Middleware: Authentification réussie pour:', user.email);
    // Ajouter les informations utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    return res.status(403).json({ error: 'Token invalide' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    const userRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!userRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permissions insuffisantes' });
    }

    next();
  };
};

const requireCompanyAccess = async (req, res, next) => {
  try {
    if (req.user.role === 'ADMIN') {
      return next(); // Les admins ont accès à tout
    }

    if (req.user.role !== 'RECRUITER') {
      return res.status(403).json({ error: 'Accès réservé aux recruteurs' });
    }

    const companyId = req.params.companyId || req.body.companyId;
    
    if (!companyId) {
      return res.status(400).json({ error: 'ID entreprise requis' });
    }

    // Vérifier que l'utilisateur appartient à cette entreprise
    const userCompany = req.user.company_memberships?.find(
      membership => membership.company_id === companyId && 
                   membership.companies.status === 'VERIFIED'
    );

    if (!userCompany) {
      return res.status(403).json({ error: 'Accès non autorisé à cette entreprise' });
    }

    req.userCompany = userCompany;
    next();
  } catch (error) {
    console.error('Erreur de vérification d\'accès entreprise:', error);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
};

// Middleware pour vérifier que l'entreprise du recruteur est validée
const requireValidatedCompany = async (req, res, next) => {
  try {
    // Seuls les recruteurs sont concernés
    if (req.user.role !== 'RECRUITER') {
      return next();
    }

    console.log('Vérification validation entreprise pour:', req.user.email);

    // Récupérer les entreprises de l'utilisateur avec leur statut
    const { data: userCompanies, error } = await supabase
      .from('company_memberships')
      .select(`
        company_id,
        is_primary,
        role_in_company,
        companies (
          id,
          name,
          status,
          created_at
        )
      `)
      .eq('user_id', req.user.id)
      .is('removed_at', null);

    if (error) {
      console.error('Erreur récupération entreprises:', error);
      return res.status(500).json({ error: 'Erreur lors de la vérification' });
    }

    if (!userCompanies || userCompanies.length === 0) {
      console.log('Aucune entreprise trouvée pour:', req.user.email);
      return res.status(403).json({
        error: 'Aucune entreprise associée',
        requiresValidation: true
      });
    }

    // Vérifier s'il y a au moins une entreprise validée
    const verifiedCompanies = userCompanies.filter(
      membership => membership.companies.status === 'VERIFIED'
    );

    const pendingCompanies = userCompanies.filter(
      membership => membership.companies.status === 'PENDING'
    );

    const rejectedCompanies = userCompanies.filter(
      membership => membership.companies.status === 'REJECTED'
    );

    console.log('Entreprises validées:', verifiedCompanies.length);
    console.log('Entreprises en attente:', pendingCompanies.length);
    console.log('Entreprises rejetées:', rejectedCompanies.length);

    // Si des entreprises rejetées
    if (rejectedCompanies.length > 0 && verifiedCompanies.length === 0) {
      console.log('Entreprise rejetée pour:', req.user.email);
      return res.status(403).json({
        error: 'Entreprise rejetée',
        requiresValidation: true,
        rejectedCompany: rejectedCompanies[0].companies,
        status: 'rejected'
      });
    }

    // Si aucune entreprise validée mais des entreprises en attente
    if (verifiedCompanies.length === 0 && pendingCompanies.length > 0) {
      console.log('Entreprise en attente de validation pour:', req.user.email);
      return res.status(403).json({
        error: 'Entreprise en attente de validation',
        requiresValidation: true,
        pendingCompany: pendingCompanies[0].companies,
        status: 'pending'
      });
    }

    // Si aucune entreprise validée et aucune en attente
    if (verifiedCompanies.length === 0) {
      console.log('Aucune entreprise valide pour:', req.user.email);
      return res.status(403).json({
        error: 'Aucune entreprise validée',
        requiresValidation: true
      });
    }

    // Ajouter les entreprises validées à la requête
    req.user.verifiedCompanies = verifiedCompanies;
    next();

  } catch (error) {
    console.error('Erreur middleware validation entreprise:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireCompanyAccess,
  requireValidatedCompany
};
