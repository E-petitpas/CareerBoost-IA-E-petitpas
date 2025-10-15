const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const { authSchemas, validate } = require('../utils/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');

const router = express.Router();

// Inscription (sans mot de passe - envoi d'invitation par email)
router.post('/register', validate(authSchemas.register), asyncHandler(async (req, res) => {
  const { role, name, email, phone, city, companyName, companySiren, companyDomain } = req.body;

  console.log('Register: Début inscription pour:', email);

  // Vérifier si l'utilisateur existe déjà
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, is_active')
    .eq('email', email)
    .single();

  if (existingUser) {
    if (existingUser.is_active) {
      return res.status(409).json({ error: 'Un compte actif avec cet email existe déjà' });
    } else {
      return res.status(409).json({
        error: 'Un compte avec cet email existe déjà mais n\'est pas encore activé. Vérifiez votre boîte email.'
      });
    }
  }

  // Créer l'utilisateur (sans mot de passe, inactif)
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      role,
      name,
      email,
      phone,
      password_hash: null, // Sera défini lors de l'activation
      city,
      verified: false,
      is_active: false
    })
    .select()
    .single();

  if (userError) {
    console.error('Erreur création utilisateur:', userError);
    return res.status(500).json({ error: 'Erreur lors de la création du compte' });
  }

  console.log('Register: Utilisateur créé avec succès:', user.id);

  // Si c'est un recruteur, créer l'entreprise
  if (role === 'RECRUITER') {
    // Vérifier si l'entreprise existe déjà
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id, name, status')
      .eq('domain', companyDomain || `${companyName.toLowerCase().replace(/\s+/g, '-')}.com`)
      .single();

    let company;

    if (existingCompany) {
      // L'entreprise existe déjà, l'utiliser
      console.log('Register: Entreprise existante trouvée:', existingCompany.id);
      company = existingCompany;
    } else {
      // Créer une nouvelle entreprise
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName,
          siren: companySiren,
          domain: companyDomain || `${companyName.toLowerCase().replace(/\s+/g, '-')}.com`,
          status: 'VERIFIED' // Auto-approuvé avec le nouveau système
        })
        .select()
        .single();

      if (companyError) {
        console.error('Erreur création entreprise:', companyError);
        // Supprimer l'utilisateur créé
        await supabase.from('users').delete().eq('id', user.id);
        return res.status(500).json({ error: 'Erreur lors de la création de l\'entreprise' });
      }

      company = newCompany;
    }

    console.log('Register: Entreprise utilisée:', company.id);

    // Vérifier si l'utilisateur est déjà membre de cette entreprise
    const { data: existingMembership } = await supabase
      .from('company_memberships')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('company_id', company.id)
      .single();

    if (!existingMembership) {
      // Lier l'utilisateur à l'entreprise seulement s'il n'est pas déjà membre
      const { error: membershipError } = await supabase
        .from('company_memberships')
        .insert({
          user_id: user.id,
          company_id: company.id,
          role_in_company: 'ADMIN_RH',
          is_primary: true,
          accepted_at: new Date().toISOString()
        });

      if (membershipError) {
        console.error('Erreur création membership:', membershipError);
        return res.status(500).json({ error: 'Erreur lors de la liaison entreprise' });
      }

      console.log('Register: Membership créé pour l\'entreprise:', company.id);
    } else {
      console.log('Register: Utilisateur déjà membre de l\'entreprise:', company.id);
    }

    // Ajouter les infos de l'entreprise à l'objet user pour l'email
    user.companyName = companyName;
    user.companySiren = companySiren;
    user.companyDomain = companyDomain;
  }

  // Si c'est un candidat, créer le profil
  if (role === 'CANDIDATE') {
    const { error: profileError } = await supabase
      .from('candidate_profiles')
      .insert({
        user_id: user.id,
        mobility_km: 25,
        preferred_contracts: []
      });

    if (profileError) {
      console.error('Erreur création profil candidat:', profileError);
    }
  }

  // Générer le token d'invitation
  const invitationToken = emailService.generateInvitationToken();

  // Sauvegarder le token d'invitation
  const { error: tokenError } = await supabase
    .from('user_invitations')
    .insert({
      user_id: user.id,
      token: invitationToken,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
    });

  if (tokenError) {
    console.error('Erreur création token invitation:', tokenError);
    return res.status(500).json({ error: 'Erreur lors de la création du token d\'invitation' });
  }

  console.log('Register: Token d\'invitation créé');

  // Envoyer l'email de bienvenue
  try {
    await emailService.sendWelcomeEmail(user, invitationToken);
    console.log('Register: Email de bienvenue envoyé à:', email);
  } catch (emailError) {
    console.error('Register: Erreur envoi email:', emailError);
    // Ne pas faire échouer l'inscription si l'email ne peut pas être envoyé
    // L'utilisateur pourra demander un nouveau lien plus tard
  }

  res.status(201).json({
    message: 'Inscription réussie ! Un email de bienvenue a été envoyé à votre adresse. Veuillez cliquer sur le lien pour définir votre mot de passe et activer votre compte.',
    email: user.email,
    requiresActivation: true
  });
}));

// Définir le mot de passe après invitation
router.post('/set-password', asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  console.log('SetPassword: Début définition mot de passe');

  if (!token || !password) {
    return res.status(400).json({ error: 'Token et mot de passe requis' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
  }

  // Vérifier le token d'invitation
  const { data: invitation, error: invitationError } = await supabase
    .from('user_invitations')
    .select(`
      id,
      user_id,
      expires_at,
      used_at,
      users (
        id,
        email,
        name,
        role,
        is_active
      )
    `)
    .eq('token', token)
    .single();

  if (invitationError || !invitation) {
    console.log('SetPassword: Token invalide');
    return res.status(400).json({ error: 'Token d\'invitation invalide' });
  }

  // Vérifier si le token a déjà été utilisé
  if (invitation.used_at) {
    console.log('SetPassword: Token déjà utilisé');
    return res.status(400).json({ error: 'Ce lien d\'activation a déjà été utilisé' });
  }

  // Vérifier si le token a expiré
  if (new Date() > new Date(invitation.expires_at)) {
    console.log('SetPassword: Token expiré');
    return res.status(400).json({ error: 'Ce lien d\'activation a expiré' });
  }

  // Vérifier si l'utilisateur est déjà actif
  if (invitation.users.is_active) {
    console.log('SetPassword: Utilisateur déjà actif');
    return res.status(400).json({ error: 'Ce compte est déjà activé' });
  }

  // Hasher le nouveau mot de passe
  const passwordHash = await bcrypt.hash(password, 12);

  // Mettre à jour l'utilisateur
  const { error: updateError } = await supabase
    .from('users')
    .update({
      password_hash: passwordHash,
      is_active: true,
      verified: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', invitation.user_id);

  if (updateError) {
    console.error('SetPassword: Erreur mise à jour utilisateur:', updateError);
    return res.status(500).json({ error: 'Erreur lors de l\'activation du compte' });
  }

  // Marquer le token comme utilisé
  const { error: tokenUpdateError } = await supabase
    .from('user_invitations')
    .update({
      used_at: new Date().toISOString()
    })
    .eq('id', invitation.id);

  if (tokenUpdateError) {
    console.error('SetPassword: Erreur mise à jour token:', tokenUpdateError);
  }

  console.log('SetPassword: Compte activé avec succès pour:', invitation.users.email);

  // Envoyer l'email de confirmation
  try {
    await emailService.sendPasswordSetConfirmation(invitation.users);
    console.log('SetPassword: Email de confirmation envoyé');
  } catch (emailError) {
    console.error('SetPassword: Erreur envoi email confirmation:', emailError);
    // Ne pas faire échouer l'activation si l'email ne peut pas être envoyé
  }

  res.json({
    message: 'Votre compte a été activé avec succès ! Vous pouvez maintenant vous connecter.',
    user: {
      id: invitation.users.id,
      email: invitation.users.email,
      name: invitation.users.name,
      role: invitation.users.role
    }
  });
}));

// Connexion
router.post('/login', validate(authSchemas.login), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  console.log('Tentative de connexion pour:', email);

  // Récupérer l'utilisateur
  const { data: user, error } = await supabase
    .from('users')
    .select(`
      id,
      role,
      name,
      email,
      password_hash,
      verified,
      is_active,
      city,
      deleted_at,
      company_memberships (
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
    .eq('email', email)
    .single();

  if (error || !user || user.deleted_at) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  }

  // Vérifier si le compte est actif
  if (!user.is_active) {
    return res.status(403).json({
      error: 'Votre compte n\'est pas encore activé. Veuillez vérifier votre boîte email et cliquer sur le lien d\'activation.',
      requiresActivation: true
    });
  }

  // Vérifier si l'utilisateur a un mot de passe défini
  if (!user.password_hash) {
    return res.status(403).json({
      error: 'Votre mot de passe n\'est pas encore défini. Veuillez vérifier votre boîte email et cliquer sur le lien d\'activation.',
      requiresActivation: true
    });
  }

  // Vérifier le mot de passe
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  }

  // Générer le token JWT
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Retourner les informations utilisateur (sans le hash du mot de passe)
  const { password_hash, ...userInfo } = user;

  console.log('Connexion réussie pour:', email, 'Token généré:', token.substring(0, 20) + '...');

  res.json({
    message: 'Connexion réussie',
    user: userInfo,
    token
  });
}));

// Vérification du token
router.get('/verify', asyncHandler(async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Vérification du token:', token ? token.substring(0, 20) + '...' : 'aucun');

  if (!token) {
    console.log('Token manquant dans la requête');
    return res.status(401).json({ error: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token décodé:', decoded);

    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        role,
        name,
        email,
        verified,
        city,
        company_memberships (
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
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      return res.status(401).json({ error: 'Token invalide' });
    }

    console.log('Utilisateur trouvé pour la vérification:', user.email);
    res.json({ user });
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return res.status(401).json({ error: 'Token invalide' });
  }
}));

module.exports = router;
