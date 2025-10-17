/**
 * Service de notifications
 * Gère l'envoi des emails et notifications
 */

const nodemailer = require('nodemailer');
const { supabase } = require('../config/supabase');

class NotificationService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialise le transporteur SMTP
   */
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      console.log('Transporteur SMTP initialisé');
    } catch (error) {
      console.error('Erreur initialisation SMTP:', error);
    }
  }

  /**
   * Envoie un email
   * @param {Object} options - Options d'envoi
   * @returns {Promise<Object>} Résultat d'envoi
   */
  async sendEmail(options) {
    if (!this.transporter) {
      console.warn('Transporteur SMTP non disponible');
      return { success: false, error: 'SMTP non configuré' };
    }

    try {
      const result = await this.transporter.sendMail({
        from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      });

      console.log('Email envoyé:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Erreur envoi email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Envoie un email de bienvenue à un recruteur
   * @param {Object} recruiter - Données du recruteur
   * @param {Object} company - Données de l'entreprise
   * @returns {Promise<Object>} Résultat d'envoi
   */
  async sendRecruiterWelcomeEmail(recruiter, company) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Bienvenue sur CareerBoost ! 🎉</h2>
        
        <p>Bonjour <strong>${recruiter.name}</strong>,</p>
        
        <p>Merci de vous être inscrit sur CareerBoost. Votre entreprise <strong>${company.name}</strong> a été créée avec succès.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-top: 0;">Statut de votre entreprise</h3>
          <p style="margin: 10px 0;">
            <strong>Statut actuel :</strong> <span style="color: #f59e0b; font-weight: bold;">En attente de validation</span>
          </p>
          <p style="margin: 10px 0; color: #6b7280;">
            Notre équipe vérifie actuellement les informations de votre entreprise. Ce processus prend généralement 24 à 48 heures ouvrées.
          </p>
        </div>
        
        <h3 style="color: #374151;">Prochaines étapes</h3>
        <ol style="color: #6b7280;">
          <li>Vous recevrez un email de confirmation une fois votre entreprise validée</li>
          <li>Vous pourrez alors publier vos offres d'emploi</li>
          <li>Commencez à recruter les meilleurs talents !</li>
        </ol>
        
        <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #1e40af;">
            <strong>💡 Conseil :</strong> En attendant la validation, vous pouvez compléter votre profil et vous familiariser avec la plateforme.
          </p>
        </div>
        
        <p style="color: #6b7280; margin-top: 30px;">
          Besoin d'aide ? Contactez-nous à <a href="mailto:support@careerboost.fr" style="color: #3b82f6;">support@careerboost.fr</a>
        </p>
        
        <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
          CareerBoost - Plateforme de recrutement intelligente
        </p>
      </div>
    `;

    return this.sendEmail({
      to: recruiter.email,
      subject: 'Bienvenue sur CareerBoost - Votre entreprise est en attente de validation',
      html
    });
  }

  /**
   * Envoie un email de validation d'entreprise
   * @param {Object} recruiter - Données du recruteur
   * @param {Object} company - Données de l'entreprise
   * @returns {Promise<Object>} Résultat d'envoi
   */
  async sendCompanyApprovedEmail(recruiter, company) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Votre entreprise a été validée ! ✅</h2>
        
        <p>Bonjour <strong>${recruiter.name}</strong>,</p>
        
        <p>Bonne nouvelle ! Votre entreprise <strong>${company.name}</strong> a été validée par notre équipe.</p>
        
        <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="color: #047857; margin-top: 0;">Vous pouvez maintenant :</h3>
          <ul style="color: #065f46;">
            <li>Publier vos offres d'emploi</li>
            <li>Recevoir des candidatures</li>
            <li>Gérer votre pipeline de recrutement</li>
            <li>Accéder à tous les outils de la plateforme</li>
          </ul>
        </div>
        
        <p style="margin: 20px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Accéder à mon dashboard
          </a>
        </p>
        
        <h3 style="color: #374151;">Conseils pour bien démarrer</h3>
        <ol style="color: #6b7280;">
          <li>Complétez les informations de votre entreprise</li>
          <li>Publiez votre première offre d'emploi</li>
          <li>Explorez les outils de matching IA</li>
          <li>Consultez les candidatures reçues</li>
        </ol>
        
        <p style="color: #6b7280; margin-top: 30px;">
          Besoin d'aide ? Consultez notre <a href="${process.env.FRONTEND_URL}/help" style="color: #3b82f6;">centre d'aide</a> ou contactez <a href="mailto:support@careerboost.fr" style="color: #3b82f6;">support@careerboost.fr</a>
        </p>
        
        <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
          CareerBoost - Plateforme de recrutement intelligente
        </p>
      </div>
    `;

    return this.sendEmail({
      to: recruiter.email,
      subject: 'Votre entreprise a été validée - Commencez à recruter !',
      html
    });
  }

  /**
   * Envoie un email de rejet d'entreprise
   * @param {Object} recruiter - Données du recruteur
   * @param {Object} company - Données de l'entreprise
   * @param {string} reason - Raison du rejet
   * @returns {Promise<Object>} Résultat d'envoi
   */
  async sendCompanyRejectedEmail(recruiter, company, reason = null) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Validation de votre entreprise</h2>
        
        <p>Bonjour <strong>${recruiter.name}</strong>,</p>
        
        <p>Nous avons examiné votre demande d'inscription pour l'entreprise <strong>${company.name}</strong>.</p>
        
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <h3 style="color: #991b1b; margin-top: 0;">Statut : Rejeté</h3>
          <p style="color: #7f1d1d; margin: 10px 0;">
            Malheureusement, votre demande n'a pas pu être approuvée à ce stade.
          </p>
          ${reason ? `<p style="color: #7f1d1d; margin: 10px 0;"><strong>Raison :</strong> ${reason}</p>` : ''}
        </div>
        
        <h3 style="color: #374151;">Raisons courantes de rejet</h3>
        <ul style="color: #6b7280;">
          <li>Informations d'entreprise incomplètes ou incorrectes</li>
          <li>SIREN invalide ou non vérifié</li>
          <li>Domaine email non professionnel</li>
          <li>Activité non conforme à nos conditions d'utilisation</li>
          <li>Documents justificatifs manquants</li>
        </ul>
        
        <h3 style="color: #374151;">Que faire maintenant ?</h3>
        <p style="color: #6b7280;">
          Vous pouvez contester cette décision en nous envoyant un email détaillé à 
          <a href="mailto:support@careerboost.fr" style="color: #3b82f6;">support@careerboost.fr</a> 
          avec les informations corrigées ou des documents justificatifs.
        </p>
        
        <p style="color: #6b7280; margin-top: 20px;">
          Vous pouvez également créer un nouveau compte avec une adresse email différente et des informations corrigées.
        </p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #374151;">
            <strong>Besoin d'aide ?</strong><br/>
            Notre équipe support est disponible du lundi au vendredi, de 9h à 18h.<br/>
            Email : <a href="mailto:support@careerboost.fr" style="color: #3b82f6;">support@careerboost.fr</a><br/>
            Téléphone : 01 23 45 67 89
          </p>
        </div>
        
        <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
          CareerBoost - Plateforme de recrutement intelligente
        </p>
      </div>
    `;

    return this.sendEmail({
      to: recruiter.email,
      subject: 'Validation de votre entreprise - Décision',
      html
    });
  }

  /**
   * Crée une notification in-app
   * @param {string} userId - ID de l'utilisateur
   * @param {string} type - Type de notification
   * @param {Object} payload - Données de la notification
   * @returns {Promise<Object>} Notification créée
   */
  async createNotification(userId, type, payload) {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        payload,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur création notification:', error);
      return null;
    }

    return notification;
  }
}

module.exports = new NotificationService();

