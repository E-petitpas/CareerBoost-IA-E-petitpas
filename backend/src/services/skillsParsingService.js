/**
 * Service pour parser automatiquement les compétences depuis les descriptions d'offres
 */

class SkillsParsingService {
  constructor() {
    // Dictionnaire des compétences techniques courantes
    this.skillsKeywords = {
      // Langages de programmation
      'java': { slug: 'java', display_name: 'Java', category: 'Développement', weight: 3 },
      'javascript': { slug: 'javascript', display_name: 'JavaScript', category: 'Développement Web', weight: 3 },
      'typescript': { slug: 'typescript', display_name: 'TypeScript', category: 'Développement Web', weight: 3 },
      'python': { slug: 'python', display_name: 'Python', category: 'Développement', weight: 3 },
      'php': { slug: 'php', display_name: 'PHP', category: 'Développement Web', weight: 3 },
      'c#': { slug: 'csharp', display_name: 'C#', category: 'Développement', weight: 3 },
      'c++': { slug: 'cpp', display_name: 'C++', category: 'Développement', weight: 3 },
      'go': { slug: 'go', display_name: 'Go', category: 'Développement', weight: 2 },
      'rust': { slug: 'rust', display_name: 'Rust', category: 'Développement', weight: 2 },
      
      // Frameworks Java
      'spring': { slug: 'spring', display_name: 'Spring', category: 'Framework Java', weight: 3 },
      'spring boot': { slug: 'spring-boot', display_name: 'Spring Boot', category: 'Framework Java', weight: 3 },
      'hibernate': { slug: 'hibernate', display_name: 'Hibernate', category: 'Framework Java', weight: 2 },
      'quarkus': { slug: 'quarkus', display_name: 'Quarkus', category: 'Framework Java', weight: 2 },
      'jakarta ee': { slug: 'jakarta-ee', display_name: 'Jakarta EE', category: 'Framework Java', weight: 2 },
      'java ee': { slug: 'java-ee', display_name: 'Java EE', category: 'Framework Java', weight: 2 },
      
      // Frameworks Frontend
      'react': { slug: 'react', display_name: 'React', category: 'Développement Web', weight: 3 },
      'react.js': { slug: 'react', display_name: 'React', category: 'Développement Web', weight: 3 },
      'vue': { slug: 'vue-js', display_name: 'Vue.js', category: 'Développement Web', weight: 3 },
      'vue.js': { slug: 'vue-js', display_name: 'Vue.js', category: 'Développement Web', weight: 3 },
      'angular': { slug: 'angular', display_name: 'Angular', category: 'Développement Web', weight: 3 },
      'next.js': { slug: 'nextjs', display_name: 'Next.js', category: 'Développement Web', weight: 2 },
      'nuxt.js': { slug: 'nuxtjs', display_name: 'Nuxt.js', category: 'Développement Web', weight: 2 },
      
      // Backend
      'node.js': { slug: 'nodejs', display_name: 'Node.js', category: 'Développement Backend', weight: 3 },
      'nodejs': { slug: 'nodejs', display_name: 'Node.js', category: 'Développement Backend', weight: 3 },
      'node js': { slug: 'nodejs', display_name: 'Node.js', category: 'Développement Backend', weight: 3 },
      'express': { slug: 'express', display_name: 'Express.js', category: 'Développement Backend', weight: 2 },
      'nestjs': { slug: 'nestjs', display_name: 'NestJS', category: 'Développement Backend', weight: 2 },
      
      // Bases de données
      'postgresql': { slug: 'postgresql', display_name: 'PostgreSQL', category: 'Base de données', weight: 3 },
      'mysql': { slug: 'mysql', display_name: 'MySQL', category: 'Base de données', weight: 3 },
      'mongodb': { slug: 'mongodb', display_name: 'MongoDB', category: 'Base de données', weight: 2 },
      'redis': { slug: 'redis', display_name: 'Redis', category: 'Base de données', weight: 2 },
      'elasticsearch': { slug: 'elasticsearch', display_name: 'Elasticsearch', category: 'Base de données', weight: 2 },
      
      // DevOps
      'docker': { slug: 'docker', display_name: 'Docker', category: 'DevOps', weight: 3 },
      'kubernetes': { slug: 'kubernetes', display_name: 'Kubernetes', category: 'DevOps', weight: 2 },
      'jenkins': { slug: 'jenkins', display_name: 'Jenkins', category: 'DevOps', weight: 2 },
      'gitlab ci': { slug: 'gitlab-ci', display_name: 'GitLab CI', category: 'DevOps', weight: 2 },
      'github actions': { slug: 'github-actions', display_name: 'GitHub Actions', category: 'DevOps', weight: 2 },
      
      // Cloud
      'aws': { slug: 'aws', display_name: 'AWS', category: 'Cloud', weight: 2 },
      'azure': { slug: 'azure', display_name: 'Azure', category: 'Cloud', weight: 2 },
      'gcp': { slug: 'gcp', display_name: 'Google Cloud Platform', category: 'Cloud', weight: 2 },
      
      // Méthodologies
      'agile': { slug: 'agile', display_name: 'Agile', category: 'Méthodologie', weight: 1 },
      'scrum': { slug: 'scrum', display_name: 'Scrum', category: 'Méthodologie', weight: 1 },
      'kanban': { slug: 'kanban', display_name: 'Kanban', category: 'Méthodologie', weight: 1 },
      'clean code': { slug: 'clean-code', display_name: 'Clean Code', category: 'Méthodologie', weight: 1 },
      'tdd': { slug: 'tdd', display_name: 'TDD', category: 'Méthodologie', weight: 1 },
      
      // Outils
      'git': { slug: 'git', display_name: 'Git', category: 'Outils', weight: 2 },
      'jira': { slug: 'jira', display_name: 'Jira', category: 'Outils', weight: 1 },
      'confluence': { slug: 'confluence', display_name: 'Confluence', category: 'Outils', weight: 1 }
    };
  }

  /**
   * Parse les compétences depuis une description d'offre
   * @param {string} description - Description de l'offre
   * @param {string} title - Titre de l'offre (optionnel)
   * @returns {Array} Liste des compétences trouvées
   */
  parseSkillsFromDescription(description, title = '') {
    const foundSkills = [];
    const text = (description + ' ' + title).toLowerCase();
    
    // Chercher chaque compétence dans le texte
    Object.entries(this.skillsKeywords).forEach(([keyword, skillInfo]) => {
      if (text.includes(keyword)) {
        // Déterminer si la compétence est obligatoire ou optionnelle
        const isRequired = this.isSkillRequired(keyword, text, title);
        
        foundSkills.push({
          ...skillInfo,
          keyword,
          is_required: isRequired,
          weight: isRequired ? skillInfo.weight * 2 : skillInfo.weight
        });
      }
    });
    
    // Trier par poids décroissant
    return foundSkills.sort((a, b) => b.weight - a.weight);
  }

  /**
   * Détermine si une compétence est obligatoire ou optionnelle
   * @param {string} keyword - Mot-clé de la compétence
   * @param {string} text - Texte complet
   * @param {string} title - Titre de l'offre
   * @returns {boolean} True si obligatoire
   */
  isSkillRequired(keyword, text, title) {
    const titleLower = title.toLowerCase();
    
    // Si la compétence est dans le titre, elle est probablement obligatoire
    if (titleLower.includes(keyword)) {
      return true;
    }
    
    // Chercher des indicateurs d'obligation dans le contexte
    const requiredIndicators = [
      'obligatoire',
      'requis',
      'indispensable',
      'nécessaire',
      'maîtrise',
      'expertise',
      'expérience en',
      'connaissance approfondie'
    ];
    
    const optionalIndicators = [
      'souhaité',
      'apprécié',
      'un plus',
      'bonus',
      'idéalement',
      'de préférence'
    ];
    
    // Extraire le contexte autour du mot-clé (50 caractères avant et après)
    const keywordIndex = text.indexOf(keyword);
    if (keywordIndex === -1) return false;
    
    const contextStart = Math.max(0, keywordIndex - 50);
    const contextEnd = Math.min(text.length, keywordIndex + keyword.length + 50);
    const context = text.substring(contextStart, contextEnd);
    
    // Vérifier les indicateurs d'obligation
    const hasRequiredIndicator = requiredIndicators.some(indicator => 
      context.includes(indicator)
    );
    
    const hasOptionalIndicator = optionalIndicators.some(indicator => 
      context.includes(indicator)
    );
    
    // Si indicateur d'obligation trouvé et pas d'indicateur optionnel
    if (hasRequiredIndicator && !hasOptionalIndicator) {
      return true;
    }
    
    // Si indicateur optionnel trouvé
    if (hasOptionalIndicator) {
      return false;
    }
    
    // Par défaut, considérer comme obligatoire si c'est une compétence technique majeure
    const majorSkills = ['java', 'javascript', 'typescript', 'python', 'react', 'angular', 'vue.js', 'spring'];
    return majorSkills.includes(keyword);
  }

  /**
   * Associe les compétences parsées aux compétences existantes dans la base de données
   * @param {Array} parsedSkills - Compétences parsées
   * @param {Object} supabase - Client Supabase
   * @returns {Array} Compétences avec IDs de la base de données
   */
  async matchSkillsToDatabase(parsedSkills, supabase) {
    const matchedSkills = [];
    
    for (const parsedSkill of parsedSkills) {
      // Chercher la compétence dans la base de données
      const { data: existingSkill } = await supabase
        .from('skills')
        .select('id, slug, display_name, category')
        .or(`slug.eq.${parsedSkill.slug},display_name.ilike.%${parsedSkill.display_name}%`)
        .single();
      
      if (existingSkill) {
        matchedSkills.push({
          skill_id: existingSkill.id,
          is_required: parsedSkill.is_required,
          weight: parsedSkill.weight,
          skills: existingSkill
        });
      } else {
        console.log(`⚠️ Compétence non trouvée dans la DB: ${parsedSkill.display_name} (${parsedSkill.slug})`);
      }
    }
    
    return matchedSkills;
  }

  /**
   * Met à jour une offre avec les compétences parsées
   * @param {string} offerId - ID de l'offre
   * @param {Array} skills - Compétences à associer
   * @param {Object} supabase - Client Supabase
   */
  async updateOfferSkills(offerId, skills, supabase) {
    // Supprimer les anciennes compétences de l'offre
    await supabase
      .from('job_offer_skills')
      .delete()
      .eq('offer_id', offerId);
    
    // Ajouter les nouvelles compétences
    if (skills.length > 0) {
      const skillsToInsert = skills.map(skill => ({
        offer_id: offerId,
        skill_id: skill.skill_id,
        is_required: skill.is_required,
        weight: skill.weight
      }));
      
      const { error } = await supabase
        .from('job_offer_skills')
        .insert(skillsToInsert);
      
      if (error) {
        console.error('Erreur insertion compétences offre:', error);
      } else {
        console.log(`✅ ${skills.length} compétences ajoutées à l'offre ${offerId}`);
      }
    }
  }
}

module.exports = new SkillsParsingService();
