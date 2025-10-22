const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');
const { aiService } = require('./aiService');

/**
 * Service de génération de documents (CV et LM) avec IA
 * Génère des documents au format PDF
 */
class DocumentService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../../uploads');
    this.ensureUploadsDir();
    this.browser = null;
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
   * Obtient une instance de browser Puppeteer (réutilisation pour performance)
   */
  async getBrowser() {
    if (!this.browser) {
      try {
        console.log('🚀 Lancement de Puppeteer...');
        this.browser = await puppeteer.launch({
          headless: 'new',
          args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ],
          timeout: 60000 // 60 secondes pour le lancement
        });
        console.log('✅ Puppeteer lancé avec succès');
      } catch (error) {
        console.error('❌ Erreur lancement Puppeteer:', error);
        throw new Error('Impossible de lancer le navigateur pour générer le PDF');
      }
    }
    return this.browser;
  }

  /**
   * Ferme le browser Puppeteer
   */
  async closeBrowser() {
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
        console.log('✅ Browser Puppeteer fermé');
      } catch (error) {
        console.error('⚠️ Erreur fermeture browser:', error);
        this.browser = null;
      }
    }
  }

  /**
   * Convertit du HTML en PDF avec Puppeteer
   */
  async convertHTMLToPDF(htmlContent, outputPath) {
    let browser = null;
    let page = null;
    
    try {
      console.log('📄 Début conversion HTML → PDF...');
      
      // Utiliser une instance temporaire pour éviter les conflits
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ],
        timeout: 60000
      });

      page = await browser.newPage();
      
      // Augmenter le timeout et simplifier le wait
      await page.setContent(htmlContent, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      // Attendre un peu pour que les styles se chargent
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Générer le PDF
      await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm'
        }
      });
      
      console.log('✅ PDF généré avec succès:', outputPath);
      
    } catch (error) {
      console.error('❌ Erreur conversion HTML vers PDF:', error);
      console.error('Stack:', error.stack);
      throw new Error(`Échec de la génération du PDF: ${error.message}`);
    } finally {
      // Toujours fermer la page et le browser
      try {
        if (page) await page.close();
        if (browser) await browser.close();
        console.log('🧹 Nettoyage Puppeteer terminé');
      } catch (cleanupError) {
        console.error('⚠️ Erreur nettoyage Puppeteer:', cleanupError);
      }
    }
  }

  /**
   * Génère un CV en format PDF avec IA
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

      // Générer un nom de fichier unique en PDF
      const userName = (user.name || 'cv').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
      const filename = `cv_${userName}_${Date.now()}.pdf`;
      const filepath = path.join(this.uploadsDir, 'cv', filename);

      // Convertir HTML en PDF
      await this.convertHTMLToPDF(cvContent, filepath);

      // Retourner l'URL d'accès
      const url = `/uploads/cv/${filename}`;
      const relativeFilepath = `uploads/cv/${filename}`;

      console.log('CV PDF généré:', url);
      return { url, filepath: relativeFilepath };

    } catch (error) {
      console.error('Erreur génération CV:', error);
      throw new Error('Erreur lors de la génération du CV');
    }
  }

  /**
   * Génère une lettre de motivation en PDF avec IA
   */
  async generateCoverLetter(data, useAI = true) {
    try {
      const { user, profile, offer, customMessage } = data;

      console.log('DocumentService.generateCoverLetter - Début génération');
      console.log('User:', user?.name, 'Offer:', offer?.title);

      let aiContent = null;
      if (useAI) {
        try {
          // Générer le contenu personnalisé avec l'IA
          console.log('Appel à l\'IA pour générer le contenu...');
          aiContent = await aiService.generateCoverLetterContent(data);
          console.log('Contenu IA généré pour la LM');
        } catch (error) {
          console.warn('Erreur génération IA, utilisation du template standard:', error.message);
          console.error('Détails erreur IA:', error);
        }
      }

      // Générer le contenu HTML de la LM
      console.log('Génération du HTML...');
      const lmContent = this.generateCoverLetterHTML({
        user,
        profile,
        offer,
        customMessage,
        aiContent
      });

      // Générer un nom de fichier unique en PDF
      const userName = (user?.name || 'lm').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
      const offerTitle = (offer?.title || 'offer').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
      const filename = `lm_${userName}_${offerTitle}_${Date.now()}.pdf`;
      const filepath = path.join(this.uploadsDir, 'lm', filename);

      console.log('Conversion en PDF:', filepath);

      // Convertir HTML en PDF
      await this.convertHTMLToPDF(lmContent, filepath);

      // Retourner l'URL d'accès
      const url = `/uploads/lm/${filename}`;
      const relativeFilepath = `uploads/lm/${filename}`;

      console.log('LM PDF générée avec succès:', url);
      return { url, filepath: relativeFilepath };

    } catch (error) {
      console.error('Erreur génération LM:', error);
      console.error('Stack trace:', error.stack);
      throw new Error(`Erreur lors de la génération de la lettre de motivation: ${error.message}`);
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
        * { box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.4;
          margin: 0;
          padding: 0;
          color: #1f2937;
          background: white;
        }
        .container {
          max-width: 210mm;
          height: 297mm;
          margin: 0 auto;
          background: white;
          padding: 15mm;
          box-sizing: border-box;
        }
        @media print {
          body { background: white; padding: 0; margin: 0; }
          .container { 
            box-shadow: none; 
            border-radius: 0; 
            padding: 10mm;
            page-break-after: avoid;
          }
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
          padding: 20px 25px;
          margin-bottom: 15px;
          border-radius: 8px;
        }
        .header h1 {
          margin: 0 0 5px 0;
          font-size: 2em;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        .header .title {
          font-size: 1.1em;
          margin: 5px 0;
          opacity: 0.95;
          font-weight: 500;
        }
        .header .contact {
          margin: 8px 0 0 0;
          opacity: 0.9;
          font-size: 0.85em;
        }
        .content-wrapper {
          padding: 0;
        }
        .section {
          margin-bottom: 15px;
          page-break-inside: avoid;
        }
        .section h2 {
          color: #667eea;
          font-size: 1.1em;
          font-weight: 600;
          margin: 0 0 10px 0;
          padding-bottom: 5px;
          border-bottom: 2px solid #667eea;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .item {
          margin-bottom: 12px;
          padding-left: 12px;
          border-left: 2px solid #e5e7eb;
        }
        .item h3 {
          margin: 0 0 4px 0;
          color: #1f2937;
          font-size: 1em;
          font-weight: 600;
        }
        .item .meta {
          color: #6b7280;
          font-style: italic;
          margin-bottom: 4px;
          font-size: 0.85em;
        }
        .item p {
          color: #4b5563;
          line-height: 1.4;
          margin: 4px 0 0 0;
          font-size: 0.9em;
        }
        .skills {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .skill {
          background: linear-gradient(135deg, #eff6ff 0%, #f0f4ff 100%);
          color: #667eea;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.8em;
          font-weight: 500;
          border: 1px solid #dbeafe;
        }
        .footer {
          text-align: center;
          padding: 10px;
          color: #9ca3af;
          font-size: 0.7em;
          margin-top: 15px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${user.name}</h1>
            <div class="title">${profile.title || 'Candidat'}</div>
            <div class="contact">${user.email} ${user.phone ? '• ' + user.phone : ''} ${user.city ? '• ' + user.city : ''}</div>
        </div>

        <div class="content-wrapper">

            ${profile.summary ? `
            <div class="section">
                <h2>👤 À propos</h2>
                <p style="color: #4b5563; line-height: 1.4; font-size: 0.9em; margin: 0;">${profile.summary}</p>
            </div>
            ` : ''}

            ${experiences && experiences.length > 0 ? `
            <div class="section">
                <h2>💼 Expériences Professionnelles</h2>
                ${experiences.map(exp => `
                <div class="item">
                    <h3>${exp.role_title || exp.position || 'Poste'}</h3>
                    <div class="meta">📍 ${exp.company || 'Entreprise'} • ${this.formatDate(exp.start_date)} - ${this.formatDate(exp.end_date) || 'Présent'}</div>
                    ${exp.description ? `<p>${exp.description}</p>` : ''}
                </div>
                `).join('')}
            </div>
            ` : ''}

            ${educations.length > 0 ? `
            <div class="section">
                <h2>🎓 Formation</h2>
                ${educations.map(edu => `
                <div class="item">
                    <h3>${edu.degree || 'Diplôme'} ${edu.field ? `en ${edu.field}` : ''}</h3>
                    <div class="meta">🏫 ${edu.school} • ${this.formatDate(edu.start_date)} - ${this.formatDate(edu.end_date) || 'En cours'}</div>
                    ${edu.description ? `<p>${edu.description}</p>` : ''}
                </div>
                `).join('')}
            </div>
            ` : ''}

            ${skills && skills.length > 0 ? `
            <div class="section">
                <h2>🚀 Compétences</h2>
                <div class="skills">
                    ${skills.map(skill => `<span class="skill">${skill.skills?.display_name || 'Compétence'}</span>`).join('')}
                </div>
            </div>
            ` : ''}
        </div>
      
    </div>
</body>
</html>`;
  }

  /**
   * Génère le HTML de la lettre de motivation
   */
  generateCoverLetterHTML({ user, profile, offer, customMessage, aiContent }) {
    const today = new Date().toLocaleDateString('fr-FR');

    // Gestion sécurisée des données
    const userName = user?.name || 'Candidat';
    const userEmail = user?.email || '';
    const userPhone = user?.phone || '';
    const userCity = user?.city || '';
    const companyName = offer?.companies?.name || offer?.company_name || 'Entreprise';
    const offerTitle = offer?.title || 'Poste';
    const profileSummary = profile?.summary || '';
    const experienceYears = profile?.experience_years || 0;

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lettre de motivation - ${userName}</title>
    <style>
        * { box-sizing: border-box; }
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.4; 
          margin: 0; 
          padding: 0; 
          color: #333; 
          background: white;
        }
        .container {
          max-width: 210mm;
          height: 297mm;
          margin: 0 auto;
          padding: 15mm;
          box-sizing: border-box;
        }
        @media print { 
          body { padding: 0; margin: 0; }
          .container { padding: 10mm; }
        }
        .sender { text-align: right; margin-bottom: 15px; font-size: 0.9em; line-height: 1.3; }
        .recipient { margin-bottom: 15px; font-size: 0.9em; line-height: 1.3; }
        .date { text-align: right; margin-bottom: 15px; font-size: 0.9em; }
        .subject { font-weight: bold; margin-bottom: 15px; font-size: 0.95em; }
        .content { margin-bottom: 15px; }
        .content p { margin-bottom: 10px; text-align: justify; font-size: 0.9em; line-height: 1.4; }
        .signature { margin-top: 20px; font-size: 0.9em; }
        .footer { text-align: center; color: #9ca3af; font-size: 0.7em; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="sender">
            <strong>${userName}</strong><br>
            ${userEmail}<br>
            ${userPhone ? userPhone + '<br>' : ''}
            ${userCity}
        </div>

        <div class="recipient">
            <strong>${companyName}</strong><br>
            Service Ressources Humaines
        </div>

        <div class="date">
            ${userCity || 'Paris'}, le ${today}
        </div>

        <div class="subject">
            <strong>Objet :</strong> Candidature pour le poste de ${offerTitle}
        </div>

        <div class="content">
            ${aiContent ? `
            <div style="white-space: pre-line;">
                ${aiContent}
            </div>
            ` : `
            <p>Madame, Monsieur,</p>

            <p>Je me permets de vous adresser ma candidature pour le poste de <strong>${offerTitle}</strong> au sein de votre entreprise ${companyName}.</p>

            ${profileSummary ? `
            <p>${profileSummary}</p>
            ` : `
            <p>Fort(e) de ${experienceYears} année(s) d'expérience, je suis convaincu(e) que mon profil correspond aux exigences de ce poste.</p>
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
            <p>${userName}</p>
        </div>
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
