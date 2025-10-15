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
      
      const prompt = `Tu es un expert en rédaction de CV. Génère un CV professionnel et attractif en français pour ce candidat.

INFORMATIONS DU CANDIDAT:
Nom: ${user.name}
Email: ${user.email}
Téléphone: ${user.phone || 'Non renseigné'}
Titre recherché: ${profile.title || 'Non spécifié'}
Résumé: ${profile.summary || 'Aucun résumé fourni'}
Années d'expérience: ${profile.experience_years || 0}
Localisation: ${user.location?.city || 'Non spécifiée'}

COMPÉTENCES:
${skills.map(s => `- ${s.skills.display_name}`).join('\n')}

FORMATIONS:
${educations.map(e => `- ${e.degree} en ${e.field_of_study} (${e.start_year}-${e.end_year || 'En cours'})`).join('\n')}

EXPÉRIENCES:
${experiences.map(e => `- ${e.title} chez ${e.company} (${e.start_date} - ${e.end_date || 'En cours'}): ${e.description}`).join('\n')}

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
      
      const prompt = `Tu es un expert en rédaction de lettres de motivation. Génère une lettre de motivation personnalisée et convaincante en français.

INFORMATIONS DU CANDIDAT:
Nom: ${user.name}
Titre recherché: ${profile.title || 'Non spécifié'}
Résumé: ${profile.summary || 'Aucun résumé fourni'}
Années d'expérience: ${profile.experience_years || 0}
Localisation: ${user.location?.city || 'Non spécifiée'}

OFFRE D'EMPLOI:
Titre: ${offer.title}
Entreprise: ${offer.company_name || 'Non spécifiée'}
Description: ${offer.description || 'Non fournie'}
Compétences requises: ${offer.required_skills?.join(', ') || 'Non spécifiées'}
Localisation: ${offer.location?.city || 'Non spécifiée'}

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
