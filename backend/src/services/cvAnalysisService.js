const OpenAI = require('openai');

/**
 * Service d'analyse de CV avec OpenAI
 * Extrait les informations structurées d'un CV
 */
class CVAnalysisService {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OPENAI_API_KEY non configurée - Mode simulation activé');
      this.openai = null;
    } else {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 45000, // 45 secondes timeout pour OpenAI
      });
    }
  }

  /**
   * Analyse le contenu d'un CV et extrait les informations structurées
   * @param {string} cvText - Texte brut du CV
   * @returns {Promise<object>} - Informations extraites
   */
  async analyzeCVContent(cvText) {
    try {
      console.log('🤖 Début de l\'analyse du CV avec OpenAI...');
      
      if (!cvText || cvText.trim().length < 50) {
        throw new Error('Le contenu du CV est trop court pour être analysé');
      }

      // Mode simulation si OpenAI n'est pas configuré
      if (!this.openai) {
        console.log('🎭 Mode simulation OpenAI activé');
        return this.simulateAnalysis(cvText);
      }

      const prompt = this.buildAnalysisPrompt(cvText);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Tu es un expert en analyse de CV. Tu extrais les informations de manière précise et structurée."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const response = completion.choices[0].message.content;
      console.log('✅ Réponse OpenAI reçue');
      
      return this.parseOpenAIResponse(response);
      
    } catch (error) {
      console.error('❌ Erreur analyse OpenAI:', error);
      
      // Fallback en mode simulation en cas d'erreur
      if (error.message.includes('API key') || error.message.includes('quota')) {
        console.log('🎭 Fallback vers le mode simulation');
        return this.simulateAnalysis(cvText);
      }
      
      throw new Error(`Erreur lors de l'analyse du CV: ${error.message}`);
    }
  }

  /**
   * Construit le prompt pour l'analyse OpenAI
   * @param {string} cvText - Texte du CV
   * @returns {string} - Prompt formaté
   */
  buildAnalysisPrompt(cvText) {
    return `
Analyse ce CV et extrait les informations suivantes au format JSON strict :

{
  "personal_info": {
    "name": "Nom complet du candidat",
    "title": "Titre/poste recherché ou actuel",
    "email": "email si trouvé",
    "phone": "téléphone si trouvé",
    "location": "ville/région si trouvée"
  },
  "professional_summary": "Résumé professionnel en 2-3 phrases",
  "experience_years": "Nombre d'années d'expérience estimé (nombre entier)",
  "skills": [
    {
      "name": "Nom de la compétence",
      "category": "technique|métier|soft_skill",
      "level": "débutant|intermédiaire|avancé|expert"
    }
  ],
  "experiences": [
    {
      "company": "Nom de l'entreprise",
      "position": "Poste occupé",
      "start_date": "YYYY-MM ou YYYY",
      "end_date": "YYYY-MM ou YYYY ou 'En cours'",
      "description": "Description des missions principales"
    }
  ],
  "educations": [
    {
      "school": "Nom de l'établissement",
      "degree": "Diplôme obtenu",
      "field": "Domaine d'études",
      "start_date": "YYYY",
      "end_date": "YYYY",
      "description": "Détails si pertinents"
    }
  ]
}

IMPORTANT: 
- Réponds UNIQUEMENT avec le JSON, sans texte avant ou après
- Si une information n'est pas trouvée, utilise null
- Pour les dates, utilise le format YYYY-MM si possible, sinon YYYY
- Sois précis et factuel, n'invente pas d'informations

CV à analyser :
${cvText}
`;
  }

  /**
   * Parse la réponse JSON d'OpenAI
   * @param {string} response - Réponse brute d'OpenAI
   * @returns {object} - Données structurées
   */
  parseOpenAIResponse(response) {
    try {
      // Nettoyer la réponse pour extraire le JSON
      let cleanResponse = response.trim();
      
      // Supprimer les balises markdown si présentes
      cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      const parsed = JSON.parse(cleanResponse);
      
      // Valider la structure
      return this.validateAndCleanResponse(parsed);
      
    } catch (error) {
      console.error('❌ Erreur parsing réponse OpenAI:', error);
      console.log('Réponse brute:', response);
      throw new Error('Réponse OpenAI invalide');
    }
  }

  /**
   * Valide et nettoie la réponse parsée
   * @param {object} data - Données à valider
   * @returns {object} - Données validées
   */
  validateAndCleanResponse(data) {
    const cleaned = {
      personal_info: {
        name: data.personal_info?.name || null,
        title: data.personal_info?.title || null,
        email: data.personal_info?.email || null,
        phone: data.personal_info?.phone || null,
        location: data.personal_info?.location || null
      },
      professional_summary: data.professional_summary || null,
      experience_years: parseInt(data.experience_years) || 0,
      skills: Array.isArray(data.skills) ? data.skills.map(skill => ({
        name: skill.name || '',
        category: skill.category || 'technique',
        level: skill.level || 'intermédiaire'
      })) : [],
      experiences: Array.isArray(data.experiences) ? data.experiences.map(exp => ({
        company: exp.company || '',
        position: exp.position || '',
        start_date: exp.start_date || null,
        end_date: exp.end_date || null,
        description: exp.description || ''
      })) : [],
      educations: Array.isArray(data.educations) ? data.educations.map(edu => ({
        school: edu.school || '',
        degree: edu.degree || '',
        field: edu.field || '',
        start_date: edu.start_date || null,
        end_date: edu.end_date || null,
        description: edu.description || ''
      })) : []
    };

    console.log(`✅ Analyse terminée: ${cleaned.skills.length} compétences, ${cleaned.experiences.length} expériences, ${cleaned.educations.length} formations`);
    
    return cleaned;
  }

  /**
   * Simulation d'analyse pour les tests ou quand OpenAI n'est pas disponible
   * @param {string} cvText - Texte du CV
   * @returns {object} - Données simulées
   */
  simulateAnalysis(cvText) {
    console.log('🎭 Simulation d\'analyse de CV...');
    
    // Extraction basique de patterns courants
    const emailMatch = cvText.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    const phoneMatch = cvText.match(/(?:\+33|0)[1-9](?:[0-9]{8})/);
    
    return {
      personal_info: {
        name: "Candidat Exemple",
        title: "Développeur Full Stack",
        email: emailMatch ? emailMatch[0] : null,
        phone: phoneMatch ? phoneMatch[0] : null,
        location: "Paris, France"
      },
      professional_summary: "Professionnel expérimenté avec de solides compétences techniques et une approche orientée résultats.",
      experience_years: 3,
      skills: [
        { name: "JavaScript", category: "technique", level: "avancé" },
        { name: "React", category: "technique", level: "intermédiaire" },
        { name: "Node.js", category: "technique", level: "intermédiaire" },
        { name: "Communication", category: "soft_skill", level: "avancé" }
      ],
      experiences: [
        {
          company: "Entreprise Exemple",
          position: "Développeur Full Stack",
          start_date: "2021-01",
          end_date: "En cours",
          description: "Développement d'applications web modernes avec React et Node.js"
        }
      ],
      educations: [
        {
          school: "École d'Ingénieurs",
          degree: "Master en Informatique",
          field: "Développement logiciel",
          start_date: "2018",
          end_date: "2020",
          description: "Formation complète en développement logiciel et gestion de projet"
        }
      ]
    };
  }
}

module.exports = new CVAnalysisService();
