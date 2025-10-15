const nodemailer = require('nodemailer');

// Configuration du transporteur email
const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('Configuration email manquante. Les emails ne seront pas envoyés.');
    return null;
  }

  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true pour 465, false pour les autres ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const transporter = createTransporter();

// Templates d'emails
const emailTemplates = {
  candidatureReceived: (candidateName, offerTitle, companyName) => ({
    subject: `Nouvelle candidature pour ${offerTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Nouvelle candidature reçue</h2>
        <p>Bonjour,</p>
        <p>Vous avez reçu une nouvelle candidature pour l'offre <strong>${offerTitle}</strong>.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Détails de la candidature</h3>
          <p><strong>Candidat :</strong> ${candidateName}</p>
          <p><strong>Offre :</strong> ${offerTitle}</p>
          <p><strong>Entreprise :</strong> ${companyName}</p>
        </div>
        <p>Connectez-vous à votre tableau de bord pour consulter le profil complet du candidat et gérer cette candidature.</p>
        <p>Cordialement,<br>L'équipe CareerBoost E-petitpas</p>
      </div>
    `
  }),

  statusChanged: (candidateName, offerTitle, newStatus) => ({
    subject: `Mise à jour de votre candidature - ${offerTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Mise à jour de votre candidature</h2>
        <p>Bonjour ${candidateName},</p>
        <p>Le statut de votre candidature pour l'offre <strong>${offerTitle}</strong> a été mis à jour.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Nouveau statut</h3>
          <p style="font-size: 18px; font-weight: bold; color: #059669;">${getStatusLabel(newStatus)}</p>
        </div>
        <p>Connectez-vous à votre compte pour voir plus de détails.</p>
        <p>Cordialement,<br>L'équipe CareerBoost E-petitpas</p>
      </div>
    `
  }),

  companyValidated: (companyName, status) => ({
    subject: `Validation de votre entreprise - ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${status === 'VERIFIED' ? '#059669' : '#dc2626'};">
          ${status === 'VERIFIED' ? 'Entreprise validée' : 'Entreprise rejetée'}
        </h2>
        <p>Bonjour,</p>
        <p>
          ${status === 'VERIFIED' 
            ? `Votre entreprise <strong>${companyName}</strong> a été validée avec succès. Vous pouvez maintenant publier des offres d'emploi.`
            : `Votre demande de validation pour l'entreprise <strong>${companyName}</strong> a été rejetée. Veuillez contacter notre support pour plus d'informations.`
          }
        </p>
        <p>Cordialement,<br>L'équipe CareerBoost E-petitpas</p>
      </div>
    `
  }),

  newMatchingOffers: (candidateName, offers) => ({
    subject: `${offers.length} nouvelle${offers.length > 1 ? 's' : ''} offre${offers.length > 1 ? 's' : ''} correspondant à votre profil`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Nouvelles offres pour vous</h2>
        <p>Bonjour ${candidateName},</p>
        <p>Nous avons trouvé ${offers.length} nouvelle${offers.length > 1 ? 's' : ''} offre${offers.length > 1 ? 's' : ''} correspondant à votre profil :</p>
        <div style="margin: 20px 0;">
          ${offers.map(offer => `
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 10px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">${offer.title}</h3>
              <p style="color: #6b7280; margin: 5px 0;">${offer.company}</p>
              <p style="color: #059669; font-weight: bold;">Score de correspondance : ${offer.score}%</p>
              <p style="font-size: 14px; color: #6b7280;">${offer.explanation}</p>
            </div>
          `).join('')}
        </div>
        <p>Connectez-vous pour voir plus de détails et postuler en un clic !</p>
        <p>Cordialement,<br>L'équipe CareerBoost E-petitpas</p>
      </div>
    `
  })
};

// Fonction pour obtenir le libellé d'un statut
const getStatusLabel = (status) => {
  const labels = {
    'ENVOYE': 'Candidature envoyée',
    'EN_ATTENTE': 'En attente de réponse',
    'ENTRETIEN': 'Entretien programmé',
    'REFUS': 'Candidature refusée',
    'EMBAUCHE': 'Candidature acceptée'
  };
  return labels[status] || status;
};

// Fonction principale pour envoyer un email
const sendEmail = async (to, template, data) => {
  if (!transporter) {
    console.log('Email non envoyé (configuration manquante):', { to, template, data });
    return { success: false, error: 'Configuration email manquante' };
  }

  try {
    const emailContent = emailTemplates[template](...data);
    
    const mailOptions = {
      from: `"CareerBoost E-petitpas" <${process.env.SMTP_USER}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email envoyé avec succès:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Erreur envoi email:', error);
    return { success: false, error: error.message };
  }
};

// Fonctions spécialisées pour chaque type d'email
const emailService = {
  sendCandidatureReceived: async (recruiterEmail, candidateName, offerTitle, companyName) => {
    return sendEmail(recruiterEmail, 'candidatureReceived', [candidateName, offerTitle, companyName]);
  },

  sendStatusChanged: async (candidateEmail, candidateName, offerTitle, newStatus) => {
    return sendEmail(candidateEmail, 'statusChanged', [candidateName, offerTitle, newStatus]);
  },

  sendCompanyValidated: async (companyEmail, companyName, status) => {
    return sendEmail(companyEmail, 'companyValidated', [companyName, status]);
  },

  sendNewMatchingOffers: async (candidateEmail, candidateName, offers) => {
    return sendEmail(candidateEmail, 'newMatchingOffers', [candidateName, offers]);
  }
};

module.exports = emailService;
