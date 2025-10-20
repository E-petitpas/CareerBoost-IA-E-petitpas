const fs = require('fs').promises;
const path = require('path');
const { aiService } = require('./aiService');

/**
 * Service de génération de documents (CV et LM) avec IA
 */
class DocumentService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../../uploads');
    this.ensureUploadsDir();
  }

  async ensureUploadsDir() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      await fs.mkdir(path.join(this.uploadsDir, 'cv'), { recursive: true });
      await fs.mkdir(path.join(this.uploadsDir, 'lm'), { recursive: true });
    } catch (error) {
      console.error('Erreur création dossiers uploads:', error);
    }
  }

  /**
   * Génère un CV en format HTML/PDF avec IA
   */
  async generateCV(candidateData, useAI = true) {
    try {
      const { user, profile, educations, experiences, skills } = candidateData;

      let aiContent = null;
      if (useAI) {
        try {
          // Générer le contenu amélioré avec l'IA
          aiContent = await aiService.generateCVContent(candidateData);
          console.log('Contenu IA généré pour le CV');
        } catch (error) {
          console.warn('Erreur génération IA, utilisation du template standard:', error.message);
        }
      }

      // Générer le contenu HTML du CV
      const cvContent = this.generateCVHTML({
        user,
        profile,
        educations,
        experiences,
        skills,
        aiContent
      });

      // Générer un nom de fichier unique
      const userName = (user.name || 'cv').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
      const filename = `cv_${userName}_${Date.now()}.html`;
      const filepath = path.join(this.uploadsDir, 'cv', filename);

      // Sauvegarder le fichier
      await fs.writeFile(filepath, cvContent, 'utf8');

      // Retourner l'URL d'accès
      const url = `/uploads/cv/${filename}`;
      const relativeFilepath = `uploads/cv/${filename}`;

      console.log('CV généré:', url);
      return { url, filepath: relativeFilepath };

    } catch (error) {
      console.error('Erreur génération CV:', error);
      throw new Error('Erreur lors de la génération du CV');
    }
  }

  /**
   * Génère une lettre de motivation avec IA
   */
  async generateCoverLetter(data, useAI = true) {
    try {
      const { user, profile, offer, customMessage } = data;

      let aiContent = null;
      if (useAI) {
        try {
          // Générer le contenu personnalisé avec l'IA
          aiContent = await aiService.generateCoverLetterContent(data);
          console.log('Contenu IA généré pour la LM');
        } catch (error) {
          console.warn('Erreur génération IA, utilisation du template standard:', error.message);
        }
      }

      // Générer le contenu HTML de la LM
      const lmContent = this.generateCoverLetterHTML({
        user,
        profile,
        offer,
        customMessage,
        aiContent
      });

      // Générer un nom de fichier unique
      const userName = (user.name || 'lm').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
      const offerTitle = (offer.title || 'offer').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
      const filename = `lm_${userName}_${offerTitle}_${Date.now()}.html`;
      const filepath = path.join(this.uploadsDir, 'lm', filename);

      // Sauvegarder le fichier
      await fs.writeFile(filepath, lmContent, 'utf8');

      // Retourner l'URL d'accès
      const url = `/uploads/lm/${filename}`;
      const relativeFilepath = `uploads/lm/${filename}`;

      console.log('LM générée:', url);
      return { url, filepath: relativeFilepath };

    } catch (error) {
      console.error('Erreur génération LM:', error);
      throw new Error('Erreur lors de la génération de la lettre de motivation');
    }
  }

  /**
   * Génère le HTML du CV
   */
  generateCVHTML({ user, profile, educations, experiences, skills, aiContent }) {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV - ${user.name}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { margin: 0; color: #2563eb; font-size: 2.5em; }
        .header p { margin: 5px 0; color: #666; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
        .item { margin-bottom: 15px; }
        .item h3 { margin: 0 0 5px 0; color: #374151; }
        .item .meta { color: #6b7280; font-style: italic; margin-bottom: 5px; }
        .skills { display: flex; flex-wrap: wrap; gap: 10px; }
        .skill { background: #eff6ff; color: #2563eb; padding: 5px 10px; border-radius: 15px; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${user.name}</h1>
        <p>${profile.title || 'Candidat'}</p>
        <p>${user.email} | ${user.phone || ''} | ${user.city || ''}</p>
    </div>

    ${aiContent ? `
    <div class="section">
        <h2>Contenu généré par IA</h2>
        <div style="white-space: pre-line; background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
            ${aiContent}
        </div>
    </div>
    ` : ''}

    ${profile.summary ? `
    <div class="section">
        <h2>Profil</h2>
        <p>${profile.summary}</p>
    </div>
    ` : ''}

    ${experiences && experiences.length > 0 ? `
    <div class="section">
        <h2>Expériences professionnelles</h2>
        ${experiences.map(exp => `
        <div class="item">
            <h3>${exp.role_title || exp.position || 'Poste'}</h3>
            <div class="meta">${exp.company || 'Entreprise'} | ${this.formatDate(exp.start_date)} - ${this.formatDate(exp.end_date) || 'Présent'}</div>
            ${exp.description ? `<p>${exp.description}</p>` : ''}
        </div>
        `).join('')}
    </div>
    ` : ''}

    ${educations.length > 0 ? `
    <div class="section">
        <h2>Formation</h2>
        ${educations.map(edu => `
        <div class="item">
            <h3>${edu.degree || 'Diplôme'} ${edu.field ? `en ${edu.field}` : ''}</h3>
            <div class="meta">${edu.school} | ${this.formatDate(edu.start_date)} - ${this.formatDate(edu.end_date) || 'En cours'}</div>
            ${edu.description ? `<p>${edu.description}</p>` : ''}
        </div>
        `).join('')}
    </div>
    ` : ''}

    ${skills && skills.length > 0 ? `
    <div class="section">
        <h2>Compétences</h2>
        <div class="skills">
            ${skills.map(skill => `<span class="skill">${skill.skills?.display_name || 'Compétence'}</span>`).join('')}
        </div>
    </div>
    ` : ''}

    <div class="section">
        <p style="text-align: center; color: #6b7280; font-size: 0.9em;">
            CV généré automatiquement le ${new Date().toLocaleDateString('fr-FR')}
        </p>
    </div>
</body>
</html>`;
  }

  /**
   * Génère le HTML de la lettre de motivation
   */
  generateCoverLetterHTML({ user, profile, offer, customMessage, aiContent }) {
    const today = new Date().toLocaleDateString('fr-FR');
    
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lettre de motivation - ${user.name}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 40px; color: #333; max-width: 800px; }
        .header { margin-bottom: 40px; }
        .sender { text-align: right; margin-bottom: 30px; }
        .recipient { margin-bottom: 30px; }
        .date { text-align: right; margin-bottom: 30px; }
        .subject { font-weight: bold; margin-bottom: 30px; }
        .content { margin-bottom: 30px; }
        .content p { margin-bottom: 15px; text-align: justify; }
        .signature { margin-top: 40px; }
    </style>
</head>
<body>
    <div class="sender">
        <strong>${user.name}</strong><br>
        ${user.email}<br>
        ${user.phone || ''}<br>
        ${user.city || ''}
    </div>

    <div class="recipient">
        <strong>${offer.companies?.name || 'Entreprise'}</strong><br>
        Service Ressources Humaines
    </div>

    <div class="date">
        ${user.city || 'Paris'}, le ${today}
    </div>

    <div class="subject">
        <strong>Objet :</strong> Candidature pour le poste de ${offer.title}
    </div>

    <div class="content">
        ${aiContent ? `
        <div style="white-space: pre-line; margin-bottom: 20px;">
            ${aiContent}
        </div>
        ` : `
        <p>Madame, Monsieur,</p>

        <p>Je me permets de vous adresser ma candidature pour le poste de <strong>${offer.title}</strong> au sein de votre entreprise ${offer.companies?.name || 'votre entreprise'}.</p>

        ${profile.summary ? `
        <p>${profile.summary}</p>
        ` : `
        <p>Fort(e) de ${profile.experience_years || 0} année(s) d'expérience, je suis convaincu(e) que mon profil correspond aux exigences de ce poste.</p>
        `}

        ${customMessage ? `
        <p>${customMessage}</p>
        ` : `
        <p>Mes compétences et mon expérience me permettront de contribuer efficacement aux objectifs de votre équipe. Je suis particulièrement motivé(e) par les défis que représente ce poste et l'opportunité de rejoindre une entreprise dynamique comme la vôtre.</p>
        `}

        <p>Je reste à votre disposition pour un entretien afin de vous présenter plus en détail ma motivation et mes compétences.</p>

        <p>Dans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.</p>
        `}
    </div>

    <div class="signature">
        <p>${user.name}</p>
    </div>

    <div style="text-align: center; color: #6b7280; font-size: 0.9em; margin-top: 40px;">
        Lettre de motivation générée automatiquement le ${today}
    </div>
</body>
</html>`;
  }

  /**
   * Formate une date
   */
  formatDate(dateString) {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long'
      });
    } catch {
      return dateString;
    }
  }
}

// Instance singleton
const documentService = new DocumentService();

// Fonctions exportées
const generateCVService = (candidateData) => documentService.generateCV(candidateData);
const generateCoverLetterService = (data) => documentService.generateCoverLetter(data);

module.exports = {
  generateCVService,
  generateCoverLetterService,
  DocumentService
};
