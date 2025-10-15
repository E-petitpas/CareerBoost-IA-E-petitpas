const { supabase } = require('../config/supabase');

// Référentiel de compétences prédéfinies
const predefinedSkills = [
  // Langages de programmation
  { slug: 'javascript', display_name: 'JavaScript' },
  { slug: 'typescript', display_name: 'TypeScript' },
  { slug: 'python', display_name: 'Python' },
  { slug: 'java', display_name: 'Java' },
  { slug: 'csharp', display_name: 'C#' },
  { slug: 'php', display_name: 'PHP' },
  { slug: 'ruby', display_name: 'Ruby' },
  { slug: 'go', display_name: 'Go' },
  { slug: 'rust', display_name: 'Rust' },
  { slug: 'swift', display_name: 'Swift' },
  { slug: 'kotlin', display_name: 'Kotlin' },
  { slug: 'dart', display_name: 'Dart' },

  // Frameworks Frontend
  { slug: 'react', display_name: 'React' },
  { slug: 'vue', display_name: 'Vue.js' },
  { slug: 'angular', display_name: 'Angular' },
  { slug: 'svelte', display_name: 'Svelte' },
  { slug: 'nextjs', display_name: 'Next.js' },
  { slug: 'nuxtjs', display_name: 'Nuxt.js' },

  // Frameworks Backend
  { slug: 'nodejs', display_name: 'Node.js' },
  { slug: 'express', display_name: 'Express.js' },
  { slug: 'nestjs', display_name: 'NestJS' },
  { slug: 'django', display_name: 'Django' },
  { slug: 'flask', display_name: 'Flask' },
  { slug: 'spring', display_name: 'Spring Boot' },
  { slug: 'laravel', display_name: 'Laravel' },
  { slug: 'rails', display_name: 'Ruby on Rails' },

  // Bases de données
  { slug: 'mysql', display_name: 'MySQL' },
  { slug: 'postgresql', display_name: 'PostgreSQL' },
  { slug: 'mongodb', display_name: 'MongoDB' },
  { slug: 'redis', display_name: 'Redis' },
  { slug: 'elasticsearch', display_name: 'Elasticsearch' },
  { slug: 'sqlite', display_name: 'SQLite' },

  // DevOps & Cloud
  { slug: 'docker', display_name: 'Docker' },
  { slug: 'kubernetes', display_name: 'Kubernetes' },
  { slug: 'aws', display_name: 'Amazon Web Services' },
  { slug: 'azure', display_name: 'Microsoft Azure' },
  { slug: 'gcp', display_name: 'Google Cloud Platform' },
  { slug: 'terraform', display_name: 'Terraform' },
  { slug: 'ansible', display_name: 'Ansible' },
  { slug: 'jenkins', display_name: 'Jenkins' },
  { slug: 'gitlab-ci', display_name: 'GitLab CI' },
  { slug: 'github-actions', display_name: 'GitHub Actions' },

  // Outils & Technologies
  { slug: 'git', display_name: 'Git' },
  { slug: 'linux', display_name: 'Linux' },
  { slug: 'bash', display_name: 'Bash' },
  { slug: 'nginx', display_name: 'Nginx' },
  { slug: 'apache', display_name: 'Apache' },

  // Design & Frontend
  { slug: 'html', display_name: 'HTML' },
  { slug: 'css', display_name: 'CSS' },
  { slug: 'sass', display_name: 'Sass' },
  { slug: 'tailwindcss', display_name: 'Tailwind CSS' },
  { slug: 'bootstrap', display_name: 'Bootstrap' },
  { slug: 'figma', display_name: 'Figma' },
  { slug: 'adobe-xd', display_name: 'Adobe XD' },

  // Méthodologies
  { slug: 'agile', display_name: 'Méthodologie Agile' },
  { slug: 'scrum', display_name: 'Scrum' },
  { slug: 'kanban', display_name: 'Kanban' },
  { slug: 'tdd', display_name: 'Test Driven Development' },
  { slug: 'ci-cd', display_name: 'CI/CD' },

  // Compétences transversales
  { slug: 'gestion-projet', display_name: 'Gestion de projet' },
  { slug: 'communication', display_name: 'Communication' },
  { slug: 'travail-equipe', display_name: 'Travail en équipe' },
  { slug: 'leadership', display_name: 'Leadership' },
  { slug: 'problem-solving', display_name: 'Résolution de problèmes' },
  { slug: 'anglais', display_name: 'Anglais' },
  { slug: 'espagnol', display_name: 'Espagnol' },
  { slug: 'allemand', display_name: 'Allemand' }
];

class SkillsService {
  // Initialiser le référentiel de compétences
  static async initializeSkills() {
    try {
      console.log('Initialisation du référentiel de compétences...');
      
      for (const skill of predefinedSkills) {
        const { error } = await supabase
          .from('skills')
          .upsert(skill, { 
            onConflict: 'slug',
            ignoreDuplicates: true 
          });

        if (error && error.code !== '23505') { // Ignorer les erreurs de doublons
          console.error('Erreur lors de l\'ajout de la compétence:', skill.slug, error);
        }
      }

      console.log(`✅ ${predefinedSkills.length} compétences initialisées`);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des compétences:', error);
    }
  }

  // Rechercher des compétences par nom
  static async searchSkills(query, limit = 20) {
    try {
      const { data: skills, error } = await supabase
        .from('skills')
        .select('*')
        .or(`slug.ilike.%${query}%,display_name.ilike.%${query}%`)
        .order('display_name')
        .limit(limit);

      if (error) {
        throw error;
      }

      return skills;
    } catch (error) {
      console.error('Erreur recherche compétences:', error);
      return [];
    }
  }

  // Obtenir toutes les compétences
  static async getAllSkills() {
    try {
      const { data: skills, error } = await supabase
        .from('skills')
        .select('*')
        .order('display_name');

      if (error) {
        throw error;
      }

      return skills;
    } catch (error) {
      console.error('Erreur récupération compétences:', error);
      return [];
    }
  }

  // Créer une nouvelle compétence
  static async createSkill(displayName) {
    try {
      const slug = displayName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const { data: skill, error } = await supabase
        .from('skills')
        .insert({
          slug,
          display_name: displayName
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return skill;
    } catch (error) {
      console.error('Erreur création compétence:', error);
      throw error;
    }
  }

  // Obtenir les compétences d'un candidat
  static async getCandidateSkills(candidateId) {
    try {
      const { data: skills, error } = await supabase
        .from('candidate_skills')
        .select(`
          proficiency_level,
          last_used_on,
          skills (
            id,
            slug,
            display_name
          )
        `)
        .eq('candidate_user_id', candidateId);

      if (error) {
        throw error;
      }

      return skills;
    } catch (error) {
      console.error('Erreur récupération compétences candidat:', error);
      return [];
    }
  }

  // Obtenir les compétences d'une offre
  static async getOfferSkills(offerId) {
    try {
      const { data: skills, error } = await supabase
        .from('job_offer_skills')
        .select(`
          is_required,
          weight,
          skills (
            id,
            slug,
            display_name
          )
        `)
        .eq('job_offer_id', offerId);

      if (error) {
        throw error;
      }

      return {
        required: skills.filter(s => s.is_required),
        optional: skills.filter(s => !s.is_required)
      };
    } catch (error) {
      console.error('Erreur récupération compétences offre:', error);
      return { required: [], optional: [] };
    }
  }

  // Obtenir les compétences les plus demandées
  static async getTopSkills(limit = 20) {
    try {
      const { data: skills, error } = await supabase
        .from('job_offer_skills')
        .select(`
          skill_id,
          skills (
            slug,
            display_name
          )
        `)
        .eq('is_required', true);

      if (error) {
        throw error;
      }

      // Compter les occurrences
      const skillCounts = skills.reduce((acc, skill) => {
        const skillId = skill.skill_id;
        if (!acc[skillId]) {
          acc[skillId] = {
            ...skill.skills,
            count: 0
          };
        }
        acc[skillId].count++;
        return acc;
      }, {});

      // Trier par popularité
      const topSkills = Object.values(skillCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      return topSkills;
    } catch (error) {
      console.error('Erreur récupération top compétences:', error);
      return [];
    }
  }
}

module.exports = SkillsService;
