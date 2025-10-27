const OpenAI = require('openai');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Génère un CV amélioré avec l'IA
   */
  async generateCVContent(candidateData) {
    try {
      const { user, profile, educations, experiences, skills } = candidateData;

      // Gestion sécurisée des données
      const userName = user?.name || 'Candidat';
      const userEmail = user?.email || 'Non renseigné';
      const userPhone = user?.phone || 'Non renseigné';
      const userCity = user?.city || 'Non spécifiée';
      const profileTitle = profile?.title || 'Non spécifié';
      const profileSummary = profile?.summary || 'Aucun résumé fourni';
      const experienceYears = profile?.experience_years || 0;

      const prompt = `Tu es un expert en rédaction de CV. Génère un CV professionnel et attractif en français pour ce candidat.

INFORMATIONS DU CANDIDAT:
Nom: ${userName}
Email: ${userEmail}
Téléphone: ${userPhone}
Titre recherché: ${profileTitle}
Résumé: ${profileSummary}
Années d'expérience: ${experienceYears}
Localisation: ${userCity}

COMPÉTENCES:
${skills && skills.length > 0 ? skills.map(s => `- ${s.skills?.display_name || 'Compétence'}`).join('\n') : 'Aucune compétence renseignée'}

FORMATIONS:
${educations && educations.length > 0 ? educations.map(e => `- Diplôme: ${e.degree || 'Formation'} en ${e.field || 'Domaine non spécifié'}
  École: ${e.school || 'École non spécifiée'}
  Période: ${e.start_date || 'Date non spécifiée'} - ${e.end_date || 'En cours'}
  Description: ${e.description || 'Pas de description'}`).join('\n') : 'Aucune formation renseignée'}

EXPÉRIENCES:
${experiences && experiences.length > 0 ? experiences.map(e => `- Poste: ${e.role_title || e.position || 'Poste'}
  Entreprise: ${e.company || 'Entreprise'}
  Période: ${e.start_date || 'Date non spécifiée'} - ${e.end_date || 'En cours'}
  Description: ${e.description || 'Pas de description'}`).join('\n') : 'Aucune expérience renseignée'}

INSTRUCTIONS:
- Utilise EXACTEMENT les noms d'entreprises et d'écoles fournis dans les données ci-dessus
- Si une école s'appelle "Université de Paris", écris "Université de Paris", pas "VRAI nom de l'école"
- Si une entreprise s'appelle "Google", écris "Google", pas "Nom de l'entreprise du candidat"
- IMPORTANT: Le CV doit tenir sur UNE SEULE PAGE - sois concis et synthétique
- Limite les descriptions à 2-3 points clés maximum par expérience
- Résumé professionnel: maximum 2 phrases courtes et percutantes
- Compétences: organise en 3-4 catégories maximum (Langages, Frameworks, Outils, Bases de données, etc.)
- Maximum 2-3 compétences par catégorie pour tenir sur une page
- Expériences: maximum 3 expériences les plus récentes/importantes
- Formations: maximum 2-3 formations les plus pertinentes
- Descriptions: phrases courtes, mots-clés techniques, résultats concrets
- Formate les dates de manière lisible (ex: "Jan 2020 - Déc 2023")

Retourne UNIQUEMENT un objet JSON valide avec cette structure:
{
  "profile_summary": "Résumé professionnel concis en 1-2 phrases maximum",
  "skills_categories": {
    "Langages de programmation": [
      {"name": "JavaScript", "level": 4},
      {"name": "Python", "level": 3}
    ],
    "Frameworks & Librairies": [
      {"name": "React", "level": 4},
      {"name": "Node.js", "level": 3}
    ],
    "Outils & Technologies": [
      {"name": "Git", "level": 4},
      {"name": "Docker", "level": 3}
    ]
  },
  "experiences": [
    {
      "title": "Titre du poste",
      "company": "Nom exact de l'entreprise",
      "period": "Période courte (ex: Jan 2020 - Déc 2023)",
      "description": "2-3 réalisations clés séparées par des points. Développement d'applications web modernes. Optimisation des performances et qualité du code. Collaboration équipe technique."
    }
  ],
  "educations": [
    {
      "degree": "Diplôme exact",
      "school": "Nom exact de l'école",
      "period": "Période courte",
      "description": "Description courte si pertinente (optionnel)"
    }
  ],
  "qualities": ["Qualité 1", "Qualité 2", "Qualité 3", "Qualité 4"]
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Tu es un expert en rédaction de CV qui aide les candidats à créer des CV professionnels et attractifs. Tu retournes toujours du JSON valide."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7
      });

      const content = response.choices[0].message.content;

      try {
        // Parser le JSON retourné par l'IA
        const aiData = JSON.parse(content);
        return aiData;
      } catch (parseError) {
        console.warn('Erreur parsing JSON IA, retour du contenu brut:', parseError);
        return { raw_content: content };
      }
    } catch (error) {
      console.error('Erreur génération CV IA:', error);
      throw new Error('Erreur lors de la génération du CV avec l\'IA');
    }
  }

  /**
   * Génère une lettre de motivation personnalisée avec l'IA
   */
  async generateCoverLetterContent(data) {
    try {
      const { user, profile, offer, customMessage } = data;

      // Gestion sécurisée des données
      const userName = user?.name || 'Candidat';
      const userCity = user?.city || 'Non spécifiée';
      const profileTitle = profile?.title || 'Non spécifié';
      const profileSummary = profile?.summary || 'Aucun résumé fourni';
      const experienceYears = profile?.experience_years || 0;
      const offerTitle = offer?.title || 'Poste';
      const companyName = offer?.companies?.name || 'Non spécifiée';
      const offerDescription = offer?.description || 'Non fournie';
      const requiredSkills = offer?.required_skills?.join(', ') || 'Non spécifiées';
      const offerLocation = offer?.location?.city || 'Non spécifiée';

      const prompt = `Tu es un expert en rédaction de lettres de motivation. Génère une lettre de motivation personnalisée et convaincante en français.

INFORMATIONS DU CANDIDAT:
Nom: ${userName}
Titre recherché: ${profileTitle}
Résumé: ${profileSummary}
Années d'expérience: ${experienceYears}
Localisation: ${userCity}

OFFRE D'EMPLOI:
Titre: ${offerTitle}
Entreprise: ${companyName}
Description: ${offerDescription}
Compétences requises: ${requiredSkills}
Localisation: ${offerLocation}

MESSAGE PERSONNALISÉ DU CANDIDAT:
${customMessage || 'Aucun message personnalisé'}

INSTRUCTIONS:
1. Crée une lettre de motivation de 3-4 paragraphes
2. Commence par une accroche qui montre l'intérêt pour l'entreprise/poste
3. Mets en avant les compétences et expériences pertinentes pour ce poste
4. Intègre le message personnalisé du candidat s'il y en a un
5. Termine par une formule de politesse et une demande d'entretien
6. Utilise un ton professionnel mais authentique
7. Personnalise selon l'entreprise et le poste
8. Retourne uniquement le contenu de la lettre, sans en-tête ni signature

La lettre doit être convaincante et montrer pourquoi ce candidat est le bon choix pour ce poste.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Tu es un expert en rédaction de lettres de motivation qui aide les candidats à créer des lettres personnalisées et convaincantes."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Erreur génération LM IA:', error);
      throw new Error('Erreur lors de la génération de la lettre de motivation avec l\'IA');
    }
  }

  /**
   * Améliore un texte existant avec l'IA
   */
  async improveText(text, type = 'general') {
    try {
      const prompts = {
        summary: "Améliore ce résumé professionnel pour le rendre plus accrocheur et impactant:",
        experience: "Reformule cette description d'expérience pour mettre en valeur les réalisations:",
        general: "Améliore ce texte pour le rendre plus professionnel et attractif:"
      };

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Tu es un expert en rédaction professionnelle qui améliore les textes pour les rendre plus impactants."
          },
          {
            role: "user",
            content: `${prompts[type] || prompts.general}\n\n"${text}"`
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Erreur amélioration texte IA:', error);
      throw new Error('Erreur lors de l\'amélioration du texte avec l\'IA');
    }
  }

  /**
   * Génère du texte avec l'IA à partir d'un prompt
   */
  async generateText(prompt, options = {}) {
    try {
      const {
        model = "gpt-3.5-turbo",
        maxTokens = 1000,
        temperature = 0.7,
        systemMessage = "Tu es un assistant IA spécialisé dans l'analyse de texte."
      } = options;

      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: systemMessage
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Erreur génération texte IA:', error);
      throw new Error('Erreur lors de la génération de texte avec l\'IA');
    }
  }

  /**
   * Extrait les compétences et expériences depuis le contenu d'un CV
   */
  async extractSkillsAndExperiencesFromCV(cvContent) {
    try {
      const prompt = `Analyse ce CV et extrait les compétences et expériences professionnelles.

CV Content:
${cvContent}

Retourne UNIQUEMENT un objet JSON valide avec cette structure exacte:
{
  "skills": [
    {
      "name": "nom de la compétence",
      "category": "technique|soft|langue|autre",
      "level": 1-5
    }
  ],
  "experiences": [
    {
      "company": "nom de l'entreprise",
      "position": "poste occupé",
      "start_date": "YYYY-MM-DD ou YYYY-MM ou YYYY",
      "end_date": "YYYY-MM-DD ou YYYY-MM ou YYYY ou null si en cours",
      "description": "description des missions et réalisations",
      "location": "ville, pays (si mentionné)"
    }
  ]
}

Instructions:
- Extrait UNIQUEMENT les compétences explicitement mentionnées
- Pour les expériences, inclus tous les postes professionnels mentionnés
- Utilise des dates au format ISO quand possible
- Si une date est incomplète, utilise ce qui est disponible
- Pour les compétences techniques, privilégie la catégorie "technique"
- Pour les langues, utilise la catégorie "langue"
- Estime le niveau de compétence de 1 (débutant) à 5 (expert) selon le contexte`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Tu es un expert en analyse de CV qui extrait des informations structurées. Tu retournes UNIQUEMENT du JSON valide."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      });

      const aiResponse = response.choices[0].message.content;

      // Extraire le JSON de la réponse
      let extractedData = {};
      try {
        // Chercher le JSON dans la réponse
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
        } else {
          console.log('❌ Format JSON non trouvé dans la réponse IA');
          return { skills: [], experiences: [] };
        }
      } catch (parseError) {
        console.log('❌ Erreur parsing JSON IA:', parseError.message);
        return { skills: [], experiences: [] };
      }

      // Valider la structure
      const skills = Array.isArray(extractedData.skills) ? extractedData.skills : [];
      const experiences = Array.isArray(extractedData.experiences) ? extractedData.experiences : [];

      console.log(`✅ Extraction CV: ${skills.length} compétences, ${experiences.length} expériences`);

      return { skills, experiences };
    } catch (error) {
      console.error('Erreur extraction CV IA:', error);
      return { skills: [], experiences: [] };
    }
  }
}

// Instance singleton
const aiService = new AIService();

module.exports = {
  aiService,
  AIService
};
