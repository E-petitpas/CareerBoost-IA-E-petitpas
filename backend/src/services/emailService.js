const nodemailer = require('nodemailer');
const crypto = require('crypto');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Vérifier la configuration
    this.verifyConnection();
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Service email configuré avec succès');
    } catch (error) {
      console.error('❌ Erreur configuration email:', error.message);
    }
  }

  // Générer un token sécurisé pour l'invitation
  generateInvitationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Envoie un email de candidature au recruteur
   */
  async sendApplicationEmail({ application, candidate, offer, cvUrl, lmUrl, customMessage }) {
    try {
      console.log('Envoi email candidature pour:', offer.title);

      const subject = `Nouvelle candidature : ${offer.title}`;

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Nouvelle candidature reçue</h2>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Offre : ${offer.title}</h3>
            <p><strong>Candidat :</strong> ${candidate.name}</p>
            <p><strong>Email :</strong> ${candidate.email}</p>
            <p><strong>Téléphone :</strong> ${candidate.phone || 'Non renseigné'}</p>
            <p><strong>Ville :</strong> ${candidate.city || 'Non renseignée'}</p>
          </div>

          <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #2563eb;">Score de correspondance</h4>
            <p style="font-size: 18px; font-weight: bold; color: #059669;">
              ${application.score}/100
            </p>
            <p style="color: #6b7280;">${application.explanation}</p>
          </div>

          ${customMessage ? `
          <div style="background: #fefce8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #d97706;">Message du candidat</h4>
            <p style="font-style: italic;">"${customMessage}"</p>
          </div>
          ` : ''}

          <div style="margin: 30px 0;">
            <h4>Documents joints :</h4>
            ${cvUrl ? `<p>📄 <a href="${process.env.BASE_URL || 'http://localhost:3001'}${cvUrl}" style="color: #2563eb;">Télécharger le CV</a></p>` : ''}
            ${lmUrl ? `<p>📝 <a href="${process.env.BASE_URL || 'http://localhost:3001'}${lmUrl}" style="color: #2563eb;">Télécharger la lettre de motivation</a></p>` : ''}
          </div>

          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #64748b; font-size: 14px;">
              Cette candidature a été envoyée via CareerBoost E-petitpas.<br>
              Connectez-vous à votre tableau de bord pour gérer cette candidature.
            </p>
          </div>
        </div>
      `;

      const textContent = `
Nouvelle candidature reçue

Offre : ${offer.title}
Candidat : ${candidate.name}
Email : ${candidate.email}
Téléphone : ${candidate.phone || 'Non renseigné'}
Ville : ${candidate.city || 'Non renseignée'}

Score de correspondance : ${application.score}/100
${application.explanation}

${customMessage ? `Message du candidat : "${customMessage}"` : ''}

Documents :
${cvUrl ? `CV : ${process.env.BASE_URL || 'http://localhost:3001'}${cvUrl}` : ''}
${lmUrl ? `Lettre de motivation : ${process.env.BASE_URL || 'http://localhost:3001'}${lmUrl}` : ''}

Cette candidature a été envoyée via CareerBoost E-petitpas.
      `;

      // Récupérer l'email du recruteur
      const recruiterEmail = offer.companies.domain ?
        `recrutement@${offer.companies.domain}` :
        'recrutement@example.com'; // Email par défaut pour les tests

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@careerboost.fr',
        to: recruiterEmail,
        subject: subject,
        text: textContent,
        html: htmlContent
      };

      console.log('Envoi email vers:', recruiterEmail);

      // En mode développement, on simule l'envoi
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 [SIMULATION] Email candidature envoyé');
        console.log('To:', recruiterEmail);
        console.log('Subject:', subject);
        return { success: true, messageId: 'simulated-' + Date.now() };
      }

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email candidature envoyé:', result.messageId);

      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('❌ Erreur envoi email candidature:', error);
      throw error;
    }
  }

  // Email de bienvenue avec lien pour définir le mot de passe
  async sendWelcomeEmail(user, invitationToken) {
    const setPasswordUrl = `${process.env.FRONTEND_URL}/set-password?token=${invitationToken}`;
    
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM}>`,
      to: user.email,
      subject: 'Bienvenue sur CareerBoost - Définissez votre mot de passe',
      html: this.getWelcomeEmailTemplate(user, setPasswordUrl)
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de bienvenue envoyé:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Erreur envoi email:', error);
      throw new Error('Erreur lors de l\'envoi de l\'email de bienvenue');
    }
  }

  // Template HTML pour l'email de bienvenue
  getWelcomeEmailTemplate(user, setPasswordUrl) {
    const roleText = user.role === 'RECRUITER' ? 'recruteur' : 'candidat';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue sur CareerBoost</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .logo { font-size: 24px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🚀 CareerBoost</div>
                <h1>Bienvenue ${user.name} !</h1>
            </div>
            
            <div class="content">
                <h2>Votre compte ${roleText} a été créé avec succès</h2>
                
                <p>Nous sommes ravis de vous accueillir sur CareerBoost, la plateforme qui connecte les talents aux opportunités.</p>
                
                <p><strong>Pour finaliser votre inscription, veuillez définir votre mot de passe :</strong></p>
                
                <div style="text-align: center;">
                    <a href="${setPasswordUrl}" class="button">Définir mon mot de passe</a>
                </div>
                
                <p><strong>Informations de votre compte :</strong></p>
                <ul>
                    <li><strong>Email :</strong> ${user.email}</li>
                    <li><strong>Nom :</strong> ${user.name}</li>
                    <li><strong>Rôle :</strong> ${roleText.charAt(0).toUpperCase() + roleText.slice(1)}</li>
                    ${user.phone ? `<li><strong>Téléphone :</strong> ${user.phone}</li>` : ''}
                </ul>
                
                ${user.role === 'RECRUITER' && user.companyName ? `
                <p><strong>Informations de votre entreprise :</strong></p>
                <ul>
                    <li><strong>Entreprise :</strong> ${user.companyName}</li>
                    ${user.companySiren ? `<li><strong>SIREN :</strong> ${user.companySiren}</li>` : ''}
                    ${user.companyDomain ? `<li><strong>Site web :</strong> ${user.companyDomain}</li>` : ''}
                </ul>
                ` : ''}
                
                <p><strong>⚠️ Important :</strong></p>
                <ul>
                    <li>Ce lien est valable pendant <strong>24 heures</strong></li>
                    <li>Pour votre sécurité, ne partagez pas ce lien</li>
                    <li>Si vous n'avez pas demandé cette inscription, ignorez cet email</li>
                </ul>
                
                <p>Une fois votre mot de passe défini, vous pourrez vous connecter et profiter de toutes les fonctionnalités de CareerBoost.</p>
                
                <p>À bientôt sur CareerBoost ! 🎉</p>
            </div>
            
            <div class="footer">
                <p>Cet email a été envoyé par CareerBoost</p>
                <p>Si vous avez des questions, contactez-nous à support@careerboost.fr</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Email de confirmation après définition du mot de passe
  async sendPasswordSetConfirmation(user) {
    const loginUrl = `${process.env.FRONTEND_URL}/login`;
    
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM}>`,
      to: user.email,
      subject: 'Votre compte CareerBoost est maintenant actif !',
      html: this.getPasswordSetConfirmationTemplate(user, loginUrl)
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de confirmation envoyé:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Erreur envoi email confirmation:', error);
      throw new Error('Erreur lors de l\'envoi de l\'email de confirmation');
    }
  }

  getPasswordSetConfirmationTemplate(user, loginUrl) {
    const roleText = user.role === 'RECRUITER' ? 'recruteur' : 'candidat';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Compte CareerBoost activé</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .logo { font-size: 24px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🎉 CareerBoost</div>
                <h1>Votre compte est maintenant actif !</h1>
            </div>
            
            <div class="content">
                <h2>Félicitations ${user.name} !</h2>
                
                <p>Votre mot de passe a été défini avec succès. Votre compte ${roleText} CareerBoost est maintenant entièrement activé.</p>
                
                <div style="text-align: center;">
                    <a href="${loginUrl}" class="button">Se connecter maintenant</a>
                </div>
                
                <p><strong>Prochaines étapes :</strong></p>
                ${user.role === 'RECRUITER' ? `
                <ul>
                    <li>🏢 Complétez le profil de votre entreprise</li>
                    <li>📝 Publiez votre première offre d'emploi</li>
                    <li>👥 Découvrez les candidats qui correspondent à vos besoins</li>
                    <li>📊 Suivez vos statistiques de recrutement</li>
                </ul>
                ` : `
                <ul>
                    <li>👤 Complétez votre profil candidat</li>
                    <li>🔍 Explorez les offres d'emploi disponibles</li>
                    <li>📄 Postulez aux offres qui vous intéressent</li>
                    <li>📈 Suivez l'état de vos candidatures</li>
                </ul>
                `}
                
                <p>Bienvenue dans la communauté CareerBoost ! 🚀</p>
            </div>
            
            <div class="footer">
                <p>Cet email a été envoyé par CareerBoost</p>
                <p>Si vous avez des questions, contactez-nous à support@careerboost.fr</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}

const emailService = new EmailService();

// Exporter les méthodes individuellement pour faciliter l'import
module.exports = emailService;
module.exports.sendApplicationEmail = emailService.sendApplicationEmail.bind(emailService);
