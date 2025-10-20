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
${educations && educations.length > 0 ? educations.map(e => `- ${e.degree || 'Formation'} en ${e.field || 'Domaine non spécifié'} (${e.start_date || 'Date non spécifiée'}-${e.end_date || 'En cours'})`).join('\n') : 'Aucune formation renseignée'}

EXPÉRIENCES:
${experiences && experiences.length > 0 ? experiences.map(e => `- ${e.role_title || e.position || 'Poste'} chez ${e.company || 'Entreprise'} (${e.start_date || 'Date non spécifiée'} - ${e.end_date || 'En cours'}): ${e.description || 'Pas de description'}`).join('\n') : 'Aucune expérience renseignée'}

INSTRUCTIONS:
1. Crée un résumé professionnel accrocheur de 3-4 lignes
2. Organise les compétences par catégories pertinentes
3. Reformule les expériences pour mettre en valeur les réalisations
4. Ajoute des mots-clés pertinents pour le secteur
5. Garde un ton professionnel mais moderne
6. Retourne uniquement le contenu textuel, pas de formatage HTML

Format de réponse:
RÉSUMÉ PROFESSIONNEL:
[résumé de 3-4 lignes]

COMPÉTENCES:
[compétences organisées par catégories]

EXPÉRIENCES PROFESSIONNELLES:
[expériences reformulées avec réalisations]

FORMATIONS:
[formations avec détails pertinents]`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Tu es un expert en rédaction de CV qui aide les candidats à créer des CV professionnels et attractifs."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7
      });

      return response.choices[0].message.content;
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
}

// Instance singleton
const aiService = new AIService();

module.exports = {
  aiService,
  AIService
};
