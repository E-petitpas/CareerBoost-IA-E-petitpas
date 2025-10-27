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
      return { url, filepath: relativeFilepath, aiContent };

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
        * { 
            box-sizing: border-box; 
            margin: 0;
            padding: 0;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.3;
            color: #1f2937;
            background: #f8fafc;
            padding: 0;
            margin: 0;
        }
        .cv-container {
            width: 210mm;
            height: 297mm;
            margin: 0 auto;
            background: white;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            border-radius: 0;
            overflow: hidden;
            display: flex;
        }
        @media print {
            body {
                background: white;
                padding: 0;
                margin: 0;
            }
            .cv-container {
                box-shadow: none;
                border-radius: 0;
                margin: 0;
                page-break-after: avoid;
            }
        }

        /* Section gauche - Bleue */
        .left-section {
            width: 38%;
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            padding: 15px 12px;
            position: relative;
            display: flex;
            flex-direction: column;
        }
        
        /* Formes décoratives */
        .decoration-top {
            position: absolute;
            top: 0;
            right: 0;
            width: 80px;
            height: 80px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            transform: translate(40px, -40px);
        }
        .decoration-bottom {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 80px;
            height: 80px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            transform: translate(-40px, 40px);
        }
        
        /* Photo de profil */
        .profile-photo {
            position: relative;
            z-index: 10;
            margin-bottom: 12px;
            text-align: center;
        }
        .photo-container {
            width: 80px;
            height: 80px;
            margin: 0 auto 8px;
            border-radius: 50%;
            overflow: hidden;
            border: 3px solid rgba(255, 255, 255, 0.3);
            background: rgba(255, 255, 255, 0.2);
        }
        .photo-container img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        .photo-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255, 255, 255, 0.6);
        }
        .profile-name {
            font-size: 0.9em;
            font-weight: 500;
            margin-bottom: 4px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
            letter-spacing: 0.2px;
            opacity: 0.85;
        }
        .profile-title {
            font-size: 1.05em;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            margin-top: 4px;
            position: relative;
            background: linear-gradient(135deg, #ffffff 0%, #e0f2fe 50%, #ffffff 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: none;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
            font-family: 'Arial Black', Arial, sans-serif;
        }
        .profile-title::before {
            content: '';
            position: absolute;
            top: -4px;
            left: -8px;
            right: -8px;
            bottom: -4px;
            background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
            border-radius: 6px;
            z-index: -1;
        }
        
        /* Sections de la partie gauche */
        .info-section {
            margin-bottom: 10px;
        }
        .section-title {
            font-size: 0.9em;
            font-weight: 700;
            margin-bottom: 6px;
            padding-bottom: 4px;
            border-bottom: 1.5px solid rgba(255, 255, 255, 0.4);
            text-transform: uppercase;
            letter-spacing: 0.6px;
            position: relative;
        }
        .section-title::after {
            content: '';
            position: absolute;
            bottom: -1.5px;
            left: 0;
            width: 20px;
            height: 1.5px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 1px;
        }
        
        /* Informations de contact */
        .contact-item {
            display: flex;
            align-items: center;
            margin-bottom: 4px;
            font-size: 0.72em;
            line-height: 1.3;
        }
        .contact-icon {
            width: 12px;
            height: 12px;
            margin-right: 6px;
            flex-shrink: 0;
        }

        /* Compétences avec barres */
        .skill-item {
            margin-bottom: 5px;
        }
        .skill-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2px;
        }
        .skill-name {
            font-size: 0.72em;
            font-weight: 500;
        }
        .skill-bars {
            display: flex;
            gap: 2px;
        }
        .skill-bar {
            height: 5px;
            width: 16px;
            border-radius: 2px;
            background: rgba(255, 255, 255, 0.3);
        }
        .skill-bar.filled {
            background: white;
        }

        /* Catégories de compétences */
        .skills-category {
            margin-bottom: 8px;
        }
        .category-title {
            font-size: 0.7em;
            font-weight: 700;
            color: #fff;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid rgba(37, 99, 235, 0.2);
            padding-bottom: 2px;
        }
        .skills-list {
            display: flex;
            flex-direction: column;
            gap: 3px;
        }

        /* Listes à puces */
        .bullet-list {
            display: flex;
            flex-direction: column;
            gap: 3px;
        }
        .bullet-item {
            display: flex;
            align-items: center;
            font-size: 0.72em;
            line-height: 1.3;
        }
        .bullet {
            width: 4px;
            height: 4px;
            background: white;
            border-radius: 50%;
            margin-right: 6px;
            flex-shrink: 0;
        }

        /* Section droite */
        .right-section {
            width: 62%;
            padding: 15px 14px;
            background: #f8fafc;
        }

        /* Sections de contenu */
        .content-section {
            margin-bottom: 10px;
        }
        .content-title {
            font-size: 1.05em;
            font-weight: 700;
            color: #2563eb;
            margin-bottom: 8px;
            padding-bottom: 4px;
            border-bottom: 2px solid #dbeafe;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            position: relative;
        }
        .content-title::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 35px;
            height: 2px;
            background: linear-gradient(90deg, #2563eb, #3b82f6);
            border-radius: 2px;
        }

        /* Expériences et formations */
        .experience-item, .education-item {
            margin-bottom: 8px;
            position: relative;
            padding: 8px 10px;
            background: white;
            border-radius: 5px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
            border-left: 2px solid #2563eb;
        }
        .item-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 4px;
        }
        .item-title {
            font-weight: 600;
            color: #1f2937;
            font-size: 0.85em;
            line-height: 1.3;
        }
        .item-subtitle {
            color: #2563eb;
            font-weight: 500;
            font-size: 0.75em;
            margin-top: 1px;
        }
        .item-date {
            color: #6b7280;
            font-size: 0.7em;
            white-space: nowrap;
            margin-left: 8px;
        }
        .item-description {
            color: #4b5563;
            font-size: 0.75em;
            line-height: 1.35;
        }
        .description-line {
            display: flex;
            align-items: flex-start;
            margin-bottom: 3px;
            line-height: 1.4;
            padding: 1px 0;
        }
        .bullet-point {
            color: #2563eb;
            margin-right: 6px;
            flex-shrink: 0;
            font-weight: bold;
            font-size: 1em;
            margin-top: 0px;
            text-shadow: 0 1px 2px rgba(37, 99, 235, 0.2);
        }
    </style>
</head>
<body>
    <div class="cv-container">
        <!-- Section gauche -->
        <div class="left-section">
            <div class="decoration-top"></div>
            <div class="decoration-bottom"></div>
            
            <!-- Photo et nom -->
            <div class="profile-photo">
                ${user.photo_url ? `
                <div class="photo-container">
                    <img src="${user.photo_url.startsWith('http') ? user.photo_url : 'http://localhost:3001' + user.photo_url}" alt="${user.name}" />
                </div>
                ` : ''}
                <div class="profile-name">${user.name}</div>
                <div class="profile-title">${profile.title || 'Candidat'}</div>
            </div>
            
            <!-- Informations personnelles -->
            <div class="info-section">
                <h2 class="section-title">Informations personnelles</h2>
                <div class="contact-info">
                    ${user.email ? `
                    <div class="contact-item">
                        <svg class="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        <span>${user.email}</span>
                    </div>
                    ` : ''}
                    ${user.phone ? `
                    <div class="contact-item">
                        <svg class="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                        <span>${user.phone}</span>
                    </div>
                    ` : ''}
                    ${user.city ? `
                    <div class="contact-item">
                        <svg class="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>${user.city}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- Compétences -->
            ${(aiContent?.skills_categories && Object.keys(aiContent.skills_categories).length > 0) || (skills && skills.length > 0) ? `
            <div class="info-section">
                <h2 class="section-title">Compétences</h2>
                ${aiContent?.skills_categories && Object.keys(aiContent.skills_categories).length > 0 ? `
                    ${Object.entries(aiContent.skills_categories).slice(0, 3).map(([category, categorySkills]) => `
                    <div class="skills-category">
                        <h3 class="category-title">${category}</h3>
                        <div class="skills-list">
                            ${categorySkills.slice(0, 4).map(skill => `
                            <div class="skill-item">
                                <div class="skill-header">
                                    <span class="skill-name">${skill.name}</span>
                                </div>
                                <div class="skill-bars">
                                    ${Array(5).fill(0).map((_, i) => `
                                    <div class="skill-bar ${i < (skill.level || 3) ? 'filled' : ''}"></div>
                                    `).join('')}
                                </div>
                            </div>
                            `).join('')}
                        </div>
                    </div>
                    `).join('')}
                ` : `
                    <div class="skills-list">
                        ${skills.slice(0, 6).map(skill => `
                        <div class="skill-item">
                            <div class="skill-header">
                                <span class="skill-name">${skill.skills?.display_name || 'Compétence'}</span>
                            </div>
                            <div class="skill-bars">
                                ${Array(5).fill(0).map((_, i) => `
                                <div class="skill-bar ${i < (skill.proficiency_level || 3) ? 'filled' : ''}"></div>
                                `).join('')}
                            </div>
                        </div>
                        `).join('')}
                    </div>
                `}
            </div>
            ` : ''}

            <!-- Qualités -->
            <div class="info-section">
                <h2 class="section-title">Qualités</h2>
                <div class="bullet-list">
                    ${(aiContent?.qualities || ['Dynamique', 'Ponctuel(le)', 'Sérieux(se)', 'Motivé(e)']).slice(0, 4).map(quality => `
                    <div class="bullet-item">
                        <div class="bullet"></div>
                        <span>${quality}</span>
                    </div>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <!-- Section droite -->
        <div class="right-section">
            <!-- Profil -->
            ${(aiContent?.profile_summary || profile.summary) ? `
            <div class="content-section">
                <h2 class="content-title">Profil</h2>
                <p class="item-description">${aiContent?.profile_summary || profile.summary}</p>
            </div>
            ` : ''}

            <!-- Expériences professionnelles -->
            ${(aiContent?.experiences && aiContent.experiences.length > 0) || (experiences && experiences.length > 0) ? `
            <div class="content-section">
                <h2 class="content-title">Expériences Professionnelles</h2>
                ${(aiContent?.experiences && aiContent.experiences.length > 0 ? aiContent.experiences : experiences).slice(0, 2).map(exp => `
                <div class="experience-item">
                    <div class="item-header">
                        <div>
                            <div class="item-title">${exp.title || exp.role_title || exp.position || 'Poste'}</div>
                            <div class="item-subtitle">${exp.company || 'Entreprise'}</div>
                        </div>
                        <div class="item-date">${exp.period || `${this.formatDate(exp.start_date)} - ${this.formatDate(exp.end_date) || 'Présent'}`}</div>
                    </div>
                    ${exp.description ? `
                    <div class="item-description">
                        ${this.formatDescriptionAsBullets(exp.description, 2)}
                    </div>
                    ` : ''}
                </div>
                `).join('')}
            </div>
            ` : ''}

            <!-- Formation -->
            ${(aiContent?.educations && aiContent.educations.length > 0) || (educations && educations.length > 0) ? `
            <div class="content-section">
                <h2 class="content-title">Formation</h2>
                ${(aiContent?.educations && aiContent.educations.length > 0 ? aiContent.educations : educations).slice(0, 2).map(edu => `
                <div class="education-item">
                    <div class="item-header">
                        <div>
                            <div class="item-title">${edu.degree || 'Diplôme'} ${edu.field ? `en ${edu.field}` : ''}</div>
                            <div class="item-subtitle">${edu.school}</div>
                        </div>
                        <div class="item-date">${edu.period || `${this.formatDate(edu.start_date)} - ${this.formatDate(edu.end_date) || 'En cours'}`}</div>
                    </div>
                    ${edu.description ? `
                    <div class="item-description">${edu.description.length > 120 ? edu.description.substring(0, 120) + '...' : edu.description}</div>
                    ` : ''}
                </div>
                `).join('')}
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
   * Formate une description en puces (maximum 2 puces pour tenir sur une page)
   */
  formatDescriptionAsBullets(description, maxBullets = 2) {
    if (!description) return '';

    // Diviser le texte en phrases intelligemment
    let sentences = description
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 15); // Ignorer les phrases trop courtes

    // Limiter au nombre de puces maximum
    sentences = sentences.slice(0, maxBullets);

    // Si on a plusieurs phrases, les afficher en puces
    if (sentences.length > 1) {
      return sentences.map(sentence => {
        // Tronquer les phrases trop longues
        const truncated = sentence.length > 100 ? sentence.substring(0, 100) + '...' : sentence;
        return `
        <div class="description-line">
          <span class="bullet-point">•</span>
          <span>${truncated.trim()}${truncated.endsWith('.') || truncated.endsWith('!') || truncated.endsWith('?') || truncated.endsWith('...') ? '' : '.'}</span>
        </div>
      `;
      }).join('');
    } else {
      // Si c'est une seule phrase longue, la diviser par des mots-clés
      const keywords = [
        'Refonte', 'Conception', 'Développement', 'Intégration', 'Mise en place',
        'Déploiement', 'Optimisation', 'Collaboration', 'Contribution', 'Gestion',
        'Amélioration', 'Implémentation', 'Configuration', 'Maintenance'
      ];

      let bulletPoints = [];
      let currentText = description;

      // Chercher les mots-clés et créer des puces
      keywords.forEach(keyword => {
        const regex = new RegExp(`(${keyword}[^.]*?(?=[A-Z]|$))`, 'gi');
        const matches = currentText.match(regex);
        if (matches && bulletPoints.length < maxBullets) {
          matches.forEach(match => {
            if (bulletPoints.length < maxBullets) {
              bulletPoints.push(match.trim());
              currentText = currentText.replace(match, '').trim();
            }
          });
        }
      });

      // Si on a trouvé des points, les afficher en puces
      if (bulletPoints.length > 1) {
        return bulletPoints.slice(0, maxBullets).map(point => {
          const truncated = point.length > 100 ? point.substring(0, 100) + '...' : point;
          return `
          <div class="description-line">
            <span class="bullet-point">•</span>
            <span>${truncated.trim()}${truncated.endsWith('.') || truncated.endsWith('!') || truncated.endsWith('?') || truncated.endsWith('...') ? '' : '.'}</span>
          </div>
        `;
        }).join('');
      } else {
        // Sinon, affichage normal mais tronqué si trop long
        const truncatedDesc = description.length > 100 ? description.substring(0, 100) + '...' : description;
        return `<span>${truncatedDesc}</span>`;
      }
    }
  }

  /**
   * Formate une date pour l'affichage
   */
  formatDate(dateString) {
    if (!dateString) return null;

    try {
      // Si c'est déjà au format YYYY, on le garde tel quel
      if (/^\d{4}$/.test(dateString)) {
        return dateString;
      }

      // Si c'est au format YYYY-MM, on formate en "Mois YYYY"
      if (/^\d{4}-\d{2}$/.test(dateString)) {
        const [year, month] = dateString.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long'
        });
      }

      // Si c'est au format complet YYYY-MM-DD, on formate en "Mois YYYY"
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        return date.toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long'
        });
      }

      // Sinon, on retourne tel quel
      return dateString;
    } catch (error) {
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
