const { supabase } = require('../config/supabase');

// Référentiel de compétences prédéfinies (synchronisé avec skillsParsingService.js)
const predefinedSkills = [
  // Langages de programmation
  { slug: 'java', display_name: 'Java' },
  { slug: 'javascript', display_name: 'JavaScript' },
  { slug: 'typescript', display_name: 'TypeScript' },
  { slug: 'python', display_name: 'Python' },
  { slug: 'php', display_name: 'PHP' },
  { slug: 'csharp', display_name: 'C#' },
  { slug: 'cpp', display_name: 'C++' },
  { slug: 'go', display_name: 'Go' },
  { slug: 'rust', display_name: 'Rust' },
  { slug: 'kotlin', display_name: 'Kotlin' },
  { slug: 'ruby', display_name: 'Ruby' },
  { slug: 'swift', display_name: 'Swift' },
  { slug: 'dart', display_name: 'Dart' },

  // Frameworks Java
  { slug: 'spring', display_name: 'Spring' },
  { slug: 'spring-boot', display_name: 'Spring Boot' },
  { slug: 'hibernate', display_name: 'Hibernate' },
  { slug: 'quarkus', display_name: 'Quarkus' },
  { slug: 'jakarta-ee', display_name: 'Jakarta EE' },
  { slug: 'java-ee', display_name: 'Java EE' },

  // Frameworks Frontend
  { slug: 'react', display_name: 'React' },
  { slug: 'vue-js', display_name: 'Vue.js' },
  { slug: 'angular', display_name: 'Angular' },
  { slug: 'nextjs', display_name: 'Next.js' },
  { slug: 'nuxtjs', display_name: 'Nuxt.js' },
  { slug: 'svelte', display_name: 'Svelte' },

  // Frameworks Backend
  { slug: 'nodejs', display_name: 'Node.js' },
  { slug: 'express', display_name: 'Express.js' },
  { slug: 'nestjs', display_name: 'NestJS' },
  { slug: 'django', display_name: 'Django' },
  { slug: 'flask', display_name: 'Flask' },
  { slug: 'laravel', display_name: 'Laravel' },
  { slug: 'rails', display_name: 'Ruby on Rails' },

  // Bases de données
  { slug: 'postgresql', display_name: 'PostgreSQL' },
  { slug: 'mysql', display_name: 'MySQL' },
  { slug: 'mongodb', display_name: 'MongoDB' },
  { slug: 'redis', display_name: 'Redis' },
  { slug: 'elasticsearch', display_name: 'Elasticsearch' },
  { slug: 'sqlite', display_name: 'SQLite' },

  // DevOps
  { slug: 'docker', display_name: 'Docker' },
  { slug: 'kubernetes', display_name: 'Kubernetes' },
  { slug: 'jenkins', display_name: 'Jenkins' },
  { slug: 'gitlab-ci', display_name: 'GitLab CI' },
  { slug: 'github-actions', display_name: 'GitHub Actions' },

  // Cloud
  { slug: 'aws', display_name: 'AWS' },
  { slug: 'azure', display_name: 'Azure' },
  { slug: 'gcp', display_name: 'Google Cloud Platform' },

  // Méthodologies
  { slug: 'agile', display_name: 'Agile' },
  { slug: 'scrum', display_name: 'Scrum' },
  { slug: 'kanban', display_name: 'Kanban' },
  { slug: 'clean-code', display_name: 'Clean Code' },
  { slug: 'tdd', display_name: 'TDD' },

  // Systèmes d'exploitation
  { slug: 'windows', display_name: 'Windows' },
  { slug: 'windows-10', display_name: 'Windows 10' },
  { slug: 'windows-11', display_name: 'Windows 11' },
  { slug: 'windows-server', display_name: 'Windows Server' },
  { slug: 'linux', display_name: 'Linux' },
  { slug: 'ubuntu', display_name: 'Ubuntu' },
  { slug: 'centos', display_name: 'CentOS' },
  { slug: 'red-hat', display_name: 'Red Hat' },

  // Infrastructure et réseaux
  { slug: 'active-directory', display_name: 'Active Directory' },
  { slug: 'dns', display_name: 'DNS' },
  { slug: 'dhcp', display_name: 'DHCP' },
  { slug: 'tcp-ip', display_name: 'TCP/IP' },
  { slug: 'vpn', display_name: 'VPN' },
  { slug: 'vlan', display_name: 'VLAN' },
  { slug: 'firewall', display_name: 'Firewall' },
  { slug: 'gpo', display_name: 'GPO' },

  // Virtualisation et conteneurs
  { slug: 'citrix', display_name: 'Citrix' },
  { slug: 'xenapp', display_name: 'XenApp' },
  { slug: 'xendesktop', display_name: 'XenDesktop' },
  { slug: 'citrix-workspace', display_name: 'Citrix Workspace' },
  { slug: 'vmware', display_name: 'VMware' },
  { slug: 'hyper-v', display_name: 'Hyper-V' },
  { slug: 'virtualbox', display_name: 'VirtualBox' },

  // Outils de déploiement et gestion
  { slug: 'sccm', display_name: 'SCCM' },
  { slug: 'intune', display_name: 'Microsoft Intune' },
  { slug: 'mdt', display_name: 'MDT' },
  { slug: 'wsus', display_name: 'WSUS' },
  { slug: 'powershell', display_name: 'PowerShell' },
  { slug: 'batch', display_name: 'Batch' },

  // Outils de ticketing et ITSM
  { slug: 'glpi', display_name: 'GLPI' },
  { slug: 'servicenow', display_name: 'ServiceNow' },
  { slug: 'remedy', display_name: 'BMC Remedy' },
  { slug: 'itil', display_name: 'ITIL' },
  { slug: 'freshdesk', display_name: 'Freshdesk' },
  { slug: 'zendesk', display_name: 'Zendesk' },

  // Sécurité
  { slug: 'antivirus', display_name: 'Antivirus' },
  { slug: 'endpoint-protection', display_name: 'Endpoint Protection' },
  { slug: 'bitlocker', display_name: 'BitLocker' },
  { slug: 'pki', display_name: 'PKI' },
  { slug: 'ssl', display_name: 'SSL/TLS' },

  // Matériel et périphériques
  { slug: 'serveur', display_name: 'Serveur' },
  { slug: 'imprimante', display_name: 'Imprimante' },
  { slug: 'serveur-impression', display_name: 'Serveur d\'impression' },
  { slug: 'switch', display_name: 'Switch' },
  { slug: 'routeur', display_name: 'Routeur' },

  // Outils de développement et versioning
  { slug: 'git', display_name: 'Git' },
  { slug: 'jira', display_name: 'Jira' },
  { slug: 'confluence', display_name: 'Confluence' },

  // Monitoring et supervision
  { slug: 'nagios', display_name: 'Nagios' },
  { slug: 'zabbix', display_name: 'Zabbix' },
  { slug: 'prtg', display_name: 'PRTG' },
  { slug: 'snmp', display_name: 'SNMP' },
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

  // Extraire les compétences depuis un texte
  static async extractSkillsFromText(text) {
    try {
      if (!text) {
        return [];
      }

      const textLower = text.toLowerCase();
      const extractedSkills = [];

      // Chercher les compétences prédéfinies dans le texte
      for (const skill of predefinedSkills) {
        const skillName = skill.display_name.toLowerCase();
        if (textLower.includes(skillName)) {
          extractedSkills.push({
            name: skill.display_name,
            slug: skill.slug,
            is_required: false
          });
        }
      }

      return extractedSkills;
    } catch (error) {
      console.error('Erreur extraction compétences depuis texte:', error);
      return [];
    }
  }
}

module.exports = SkillsService;
