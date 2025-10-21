/**
 * Service pour parser automatiquement les compétences depuis les descriptions d'offres
 */

const aiService = require('./aiService');

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
      'html5': { slug: 'html5', display_name: 'HTML5', category: 'Développement Web', weight: 2 },
      'css3': { slug: 'css3', display_name: 'CSS3', category: 'Développement Web', weight: 2 },
      
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
      'git': { slug: 'git', display_name: 'Git', category: 'Outils de développement', weight: 2 },
      'maven': { slug: 'maven', display_name: 'Maven', category: 'Outils de développement', weight: 2 },
      'gradle': { slug: 'gradle', display_name: 'Gradle', category: 'Outils de développement', weight: 2 },
      'eclipse': { slug: 'eclipse', display_name: 'Eclipse', category: 'Outils de développement', weight: 2 },
      'intellij': { slug: 'intellij', display_name: 'IntelliJ IDEA', category: 'Outils de développement', weight: 2 },
      
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
      
      // Systèmes d'exploitation
      'windows': { slug: 'windows', display_name: 'Windows', category: 'Système', weight: 3 },
      'windows 10': { slug: 'windows-10', display_name: 'Windows 10', category: 'Système', weight: 3 },
      'windows 11': { slug: 'windows-11', display_name: 'Windows 11', category: 'Système', weight: 3 },
      'windows server': { slug: 'windows-server', display_name: 'Windows Server', category: 'Système', weight: 3 },
      'linux': { slug: 'linux', display_name: 'Linux', category: 'Système', weight: 3 },
      'ubuntu': { slug: 'ubuntu', display_name: 'Ubuntu', category: 'Système', weight: 2 },
      'centos': { slug: 'centos', display_name: 'CentOS', category: 'Système', weight: 2 },
      'red hat': { slug: 'red-hat', display_name: 'Red Hat', category: 'Système', weight: 2 },

      // Infrastructure et réseaux
      'active directory': { slug: 'active-directory', display_name: 'Active Directory', category: 'Infrastructure', weight: 3 },
      'ad': { slug: 'active-directory', display_name: 'Active Directory', category: 'Infrastructure', weight: 3 },
      'dns': { slug: 'dns', display_name: 'DNS', category: 'Réseau', weight: 3 },
      'dhcp': { slug: 'dhcp', display_name: 'DHCP', category: 'Réseau', weight: 3 },
      'tcp/ip': { slug: 'tcp-ip', display_name: 'TCP/IP', category: 'Réseau', weight: 3 },
      'ip': { slug: 'tcp-ip', display_name: 'TCP/IP', category: 'Réseau', weight: 2 },
      'vpn': { slug: 'vpn', display_name: 'VPN', category: 'Réseau', weight: 2 },
      'vlan': { slug: 'vlan', display_name: 'VLAN', category: 'Réseau', weight: 2 },
      'firewall': { slug: 'firewall', display_name: 'Firewall', category: 'Sécurité', weight: 2 },
      'gpo': { slug: 'gpo', display_name: 'GPO', category: 'Infrastructure', weight: 2 },
      'group policy': { slug: 'gpo', display_name: 'GPO', category: 'Infrastructure', weight: 2 },

      // Virtualisation et conteneurs
      'citrix': { slug: 'citrix', display_name: 'Citrix', category: 'Virtualisation', weight: 3 },
      'xenapp': { slug: 'xenapp', display_name: 'XenApp', category: 'Virtualisation', weight: 3 },
      'xendesktop': { slug: 'xendesktop', display_name: 'XenDesktop', category: 'Virtualisation', weight: 3 },
      'citrix workspace': { slug: 'citrix-workspace', display_name: 'Citrix Workspace', category: 'Virtualisation', weight: 3 },
      'vmware': { slug: 'vmware', display_name: 'VMware', category: 'Virtualisation', weight: 3 },
      'hyper-v': { slug: 'hyper-v', display_name: 'Hyper-V', category: 'Virtualisation', weight: 2 },
      'virtualbox': { slug: 'virtualbox', display_name: 'VirtualBox', category: 'Virtualisation', weight: 1 },

      // Outils de déploiement et gestion
      'sccm': { slug: 'sccm', display_name: 'SCCM', category: 'Déploiement', weight: 3 },
      'system center': { slug: 'sccm', display_name: 'SCCM', category: 'Déploiement', weight: 3 },
      'intune': { slug: 'intune', display_name: 'Microsoft Intune', category: 'Déploiement', weight: 3 },
      'mdt': { slug: 'mdt', display_name: 'MDT', category: 'Déploiement', weight: 2 },
      'microsoft deployment toolkit': { slug: 'mdt', display_name: 'MDT', category: 'Déploiement', weight: 2 },
      'wsus': { slug: 'wsus', display_name: 'WSUS', category: 'Déploiement', weight: 2 },
      'powershell': { slug: 'powershell', display_name: 'PowerShell', category: 'Scripting', weight: 2 },

      // Méthodologies
      'itil': { slug: 'itil', display_name: 'ITIL', category: 'Méthodologie', weight: 2 },

      // Sécurité
      'antivirus': { slug: 'antivirus', display_name: 'Antivirus', category: 'Sécurité', weight: 2 },
      'batch': { slug: 'batch', display_name: 'Batch', category: 'Scripting', weight: 1 },

      // Outils de ticketing et ITSM
      'glpi': { slug: 'glpi', display_name: 'GLPI', category: 'ITSM', weight: 2 },
      'servicenow': { slug: 'servicenow', display_name: 'ServiceNow', category: 'ITSM', weight: 3 },
      'remedy': { slug: 'remedy', display_name: 'BMC Remedy', category: 'ITSM', weight: 2 },
      'itil': { slug: 'itil', display_name: 'ITIL', category: 'ITSM', weight: 2 },
      'freshdesk': { slug: 'freshdesk', display_name: 'Freshdesk', category: 'ITSM', weight: 1 },
      'zendesk': { slug: 'zendesk', display_name: 'Zendesk', category: 'ITSM', weight: 1 },

      // Sécurité
      'antivirus': { slug: 'antivirus', display_name: 'Antivirus', category: 'Sécurité', weight: 2 },
      'endpoint protection': { slug: 'endpoint-protection', display_name: 'Endpoint Protection', category: 'Sécurité', weight: 2 },
      'bitlocker': { slug: 'bitlocker', display_name: 'BitLocker', category: 'Sécurité', weight: 2 },
      'pki': { slug: 'pki', display_name: 'PKI', category: 'Sécurité', weight: 2 },
      'ssl': { slug: 'ssl', display_name: 'SSL/TLS', category: 'Sécurité', weight: 2 },
      'tls': { slug: 'ssl', display_name: 'SSL/TLS', category: 'Sécurité', weight: 2 },

      // Matériel et périphériques
      'serveur': { slug: 'serveur', display_name: 'Serveur', category: 'Matériel', weight: 2 },
      'server': { slug: 'serveur', display_name: 'Serveur', category: 'Matériel', weight: 2 },
      'imprimante': { slug: 'imprimante', display_name: 'Imprimante', category: 'Matériel', weight: 2 },
      'printer': { slug: 'imprimante', display_name: 'Imprimante', category: 'Matériel', weight: 2 },
      'serveur d\'impression': { slug: 'serveur-impression', display_name: 'Serveur d\'impression', category: 'Infrastructure', weight: 2 },
      'print server': { slug: 'serveur-impression', display_name: 'Serveur d\'impression', category: 'Infrastructure', weight: 2 },
      'switch': { slug: 'switch', display_name: 'Switch', category: 'Réseau', weight: 2 },
      'routeur': { slug: 'routeur', display_name: 'Routeur', category: 'Réseau', weight: 2 },
      'router': { slug: 'routeur', display_name: 'Routeur', category: 'Réseau', weight: 2 },

      // Outils de développement et versioning
      'git': { slug: 'git', display_name: 'Git', category: 'Outils', weight: 2 },
      'jira': { slug: 'jira', display_name: 'Jira', category: 'Outils', weight: 1 },
      'confluence': { slug: 'confluence', display_name: 'Confluence', category: 'Outils', weight: 1 },

      // ERP et solutions métier
      'sage x3': { slug: 'sage-x3', display_name: 'Sage X3', category: 'ERP', weight: 3 },
      'microsoft dynamics': { slug: 'microsoft-dynamics', display_name: 'Microsoft Dynamics', category: 'ERP', weight: 3 },
      'dynamics 365': { slug: 'dynamics-365', display_name: 'Dynamics 365', category: 'ERP', weight: 3 },
      'dynamics crm': { slug: 'dynamics-crm', display_name: 'Dynamics CRM', category: 'CRM', weight: 3 },
      'dynamics nav': { slug: 'dynamics-nav', display_name: 'Dynamics NAV', category: 'ERP', weight: 2 },
      'dynamics ax': { slug: 'dynamics-ax', display_name: 'Dynamics AX', category: 'ERP', weight: 2 },
      'erp': { slug: 'erp', display_name: 'ERP', category: 'ERP', weight: 2 },
      'crm': { slug: 'crm', display_name: 'CRM', category: 'CRM', weight: 2 },

      // Monitoring et supervision
      'nagios': { slug: 'nagios', display_name: 'Nagios', category: 'Monitoring', weight: 2 },
      'zabbix': { slug: 'zabbix', display_name: 'Zabbix', category: 'Monitoring', weight: 2 },
      'prtg': { slug: 'prtg', display_name: 'PRTG', category: 'Monitoring', weight: 2 },
      'snmp': { slug: 'snmp', display_name: 'SNMP', category: 'Monitoring', weight: 2 }
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

    console.log(`🔍 Analyse de l'offre: "${title}"`);
    console.log(`📝 Texte original (extrait): ${text.substring(0, 200)}...`);

    // Normaliser le texte pour améliorer la détection
    const normalizedText = this.normalizeText(text);
    console.log(`📝 Texte normalisé (extrait): ${normalizedText.substring(0, 200)}...`);

    // 1. Recherche standard avec regex pour word boundaries
    this.findSkillsWithRegex(normalizedText, foundSkills, title);

    // 2. Détection spécifique dans les listes techniques
    this.detectSkillsInTechnicalLists(description, foundSkills, title);

    // 3. Si peu de compétences trouvées, essayer une recherche plus flexible
    if (foundSkills.length < 3) {
      console.log('⚠️ Peu de compétences trouvées, recherche flexible...');
      this.flexibleSkillsSearch(normalizedText, foundSkills, title);
    }

    // 4. Si toujours aucune compétence trouvée, utiliser l'IA comme fallback
    if (foundSkills.length === 0) {
      console.log('⚠️ Aucune compétence trouvée, fallback IA...');
      // Note: Cette méthode sera appelée de manière asynchrone depuis le service d'agrégation
      // pour éviter de bloquer le parsing synchrone
    }

    console.log(`✅ ${foundSkills.length} compétences trouvées:`,
      foundSkills.map(s => s.display_name));

    // Trier par poids décroissant
    return foundSkills.sort((a, b) => b.weight - a.weight);
  }

  /**
   * Normalise le texte pour améliorer la détection
   * @param {string} text - Texte à normaliser
   * @returns {string} Texte normalisé
   */
  normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[ñ]/g, 'n')
      // Plus permissif : garder les séparateurs importants comme espaces
      .replace(/[\/\\\(\)]/g, ' ') // Convertir /, \, (), en espaces
      .replace(/[^\w\s\-\.]/g, ' ') // Garder les tirets et points
      .replace(/\s+/g, ' ') // Normaliser les espaces multiples
      .trim();
  }

  /**
   * Recherche des compétences avec regex et word boundaries
   * @param {string} normalizedText - Texte normalisé
   * @param {Array} foundSkills - Array des compétences déjà trouvées
   * @param {string} title - Titre de l'offre
   */
  findSkillsWithRegex(normalizedText, foundSkills, title) {
    Object.entries(this.skillsKeywords).forEach(([keyword, skillInfo]) => {
      const normalizedKeyword = this.normalizeText(keyword);

      // Créer une regex avec word boundaries pour éviter les faux positifs
      const regex = new RegExp(`\\b${normalizedKeyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');

      if (regex.test(normalizedText)) {
        // Éviter les doublons (même slug)
        const alreadyFound = foundSkills.find(skill => skill.slug === skillInfo.slug);
        if (!alreadyFound) {
          // Validation contextuelle pour éviter les faux positifs
          if (this.isValidSkillInContext(keyword, normalizedText, skillInfo.category)) {
            // Déterminer si la compétence est obligatoire ou optionnelle
            const isRequired = this.isSkillRequired(keyword, normalizedText, title);

            foundSkills.push({
              ...skillInfo,
              keyword,
              is_required: isRequired,
              weight: isRequired ? skillInfo.weight * 2 : skillInfo.weight,
              source: 'regex'
            });
          }
        }
      }
    });
  }

  /**
   * Détection spécifique dans les listes techniques
   * @param {string} originalText - Texte original (non normalisé)
   * @param {Array} foundSkills - Array des compétences déjà trouvées
   * @param {string} title - Titre de l'offre
   */
  detectSkillsInTechnicalLists(originalText, foundSkills, title) {
    // Patterns pour identifier les listes techniques
    const listPatterns = [
      /(?:environnement|technique|compétences?|maîtrise|connaissance)[^.!?]*:[^.!?]*((?:\s*-\s*[^.!?]*)+)/gi,
      /(?:outils?|technologies?|systèmes?)[^.!?]*:[^.!?]*((?:\s*-\s*[^.!?]*)+)/gi,
      // Pattern pour les listes entre parenthèses comme "(XenApp / XenDesktop / Citrix Workspace)"
      /\([^)]*(?:xenapp|xendesktop|citrix|windows|dns|dhcp|sccm|intune|glpi|servicenow)[^)]*\)/gi,
      // Pattern pour les listes séparées par des virgules ou slashes
      /(?:citrix|windows|dns|dhcp|sccm|intune|glpi|servicenow)[^.!?]*(?:[,\/][^.!?]*){2,}/gi
    ];

    listPatterns.forEach(pattern => {
      const matches = originalText.match(pattern);
      if (matches) {
        matches.forEach(match => {
          console.log(`🔍 Liste technique détectée: ${match}`);
          this.extractSkillsFromTechnicalList(match, foundSkills, title);
        });
      }
    });
  }

  /**
   * Extrait les compétences d'une liste technique
   * @param {string} listText - Texte de la liste
   * @param {Array} foundSkills - Array des compétences déjà trouvées
   */
  extractSkillsFromTechnicalList(listText, foundSkills) {
    // Séparer par les délimiteurs courants
    const items = listText.split(/[,\/\-\(\)]/);

    items.forEach(item => {
      const cleanItem = item.trim().toLowerCase();
      if (cleanItem.length < 2) return; // Ignorer les éléments trop courts

      Object.entries(this.skillsKeywords).forEach(([keyword, skillInfo]) => {
        const normalizedKeyword = this.normalizeText(keyword);
        const normalizedItem = this.normalizeText(cleanItem);

        // Recherche plus stricte pour éviter les faux positifs
        // Vérifier que le mot-clé correspond bien au contexte
        if (this.isSkillRelevantInListContext(keyword, cleanItem, listText)) {
          if (normalizedItem.includes(normalizedKeyword) || normalizedKeyword.includes(normalizedItem)) {
            const alreadyFound = foundSkills.find(skill => skill.slug === skillInfo.slug);
            if (!alreadyFound) {
              console.log(`✅ Compétence trouvée dans liste: ${skillInfo.display_name} (${keyword})`);
              foundSkills.push({
                ...skillInfo,
                keyword,
                is_required: true, // Dans une liste technique, souvent requis
                weight: Math.round(skillInfo.weight * 1.5),
                source: 'technical_list'
              });
            }
          }
        }
      });
    });
  }

  /**
   * Vérifie si une compétence est pertinente dans le contexte d'une liste technique
   * @param {string} keyword - Mot-clé de la compétence
   * @param {string} listItem - Élément de la liste
   * @param {string} fullListText - Texte complet de la liste
   * @returns {boolean} True si la compétence est pertinente
   */
  isSkillRelevantInListContext(keyword, listItem, fullListText) {
    const lowerKeyword = keyword.toLowerCase();
    const lowerItem = listItem.toLowerCase();
    const lowerFullText = fullListText.toLowerCase();

    // Éviter les faux positifs pour les langages de programmation dans des contextes non-dev
    const programmingLanguages = ['javascript', 'typescript', 'c#', 'c++', 'java', 'python', 'php'];
    if (programmingLanguages.includes(lowerKeyword)) {
      // Contextes où les langages de programmation SONT pertinents (priorité)
      const devContexts = [
        'développement', 'développeur', 'developer', 'programmeur', 'programming',
        'frontend', 'backend', 'fullstack', 'web', 'mobile', 'application',
        'framework', 'library', 'api', 'microservice', 'architecture',
        'technologies', 'stack technique', 'environnement technique',
        'compétences techniques', 'outils de développement', 'ide',
        'spring', 'angular', 'react', 'vue', 'node', 'express',
        'database', 'sql', 'nosql', 'orm', 'mvc', 'rest', 'graphql',
        'version', 'git', 'ci/cd', 'devops', 'docker', 'kubernetes',
        'test', 'junit', 'selenium', 'cypress', 'jest', 'logiciel',
        'code', 'programmation', 'tech', 'lead tech', 'front-end', 'back-end'
      ];

      // Si le contexte contient des mots de développement, accepter
      const hasDevContext = devContexts.some(context =>
        lowerFullText.includes(context) || lowerItem.includes(context)
      );

      if (hasDevContext) {
        return true;
      }

      // Contextes clairement non-développement
      const nonDevContexts = [
        'ressources humaines', 'recrutement', 'formation générale',
        'commercial', 'vente', 'marketing', 'communication',
        'comptabilité', 'finance', 'gestion administrative',
        'logistique', 'supply chain', 'production industrielle',
        'juridique', 'legal', 'conformité', 'audit financier',
        'sécurité physique', 'gardiennage', 'nettoyage'
      ];

      // Si le contexte contient des mots clairement non-développement, ignorer
      const hasNonDevContext = nonDevContexts.some(context =>
        lowerFullText.includes(context) || lowerItem.includes(context)
      );

      if (hasNonDevContext) {
        console.log(`⚠️ Compétence ${keyword} ignorée - contexte non-développement: ${listItem.substring(0, 80)}`);
        return false;
      }
    }

    // Éviter les détections sur des mots trop courts ou ambigus
    if (lowerKeyword.length <= 2 && !lowerItem.includes(lowerKeyword + ' ') && !lowerItem.includes(' ' + lowerKeyword)) {
      return false;
    }

    return true;
  }

  /**
   * Recherche flexible des compétences avec des variantes et synonymes
   * @param {string} normalizedText - Texte normalisé
   * @param {Array} foundSkills - Array des compétences déjà trouvées
   * @param {string} title - Titre de l'offre
   */
  flexibleSkillsSearch(normalizedText, foundSkills, title) {
    // Dictionnaire de variantes et synonymes
    const skillVariants = {
      'windows': ['microsoft windows', 'ms windows', 'win10', 'win11'],
      'active-directory': ['annuaire active directory', 'microsoft ad', 'ms ad'],
      'citrix': ['citrix xenapp', 'citrix xendesktop', 'citrix workspace app'],
      'sccm': ['microsoft sccm', 'system center configuration manager', 'configuration manager'],
      'intune': ['microsoft intune', 'ms intune', 'microsoft endpoint manager'],
      'powershell': ['power shell', 'ps1', 'microsoft powershell'],
      'servicenow': ['service now', 'snow'],
      'vmware': ['vm ware', 'vsphere', 'vcenter'],
      'tcp-ip': ['tcp ip', 'protocole tcp', 'protocole ip', 'reseau tcp ip'],
      'dns': ['domain name system', 'serveur dns', 'resolution dns'],
      'dhcp': ['dynamic host configuration protocol', 'serveur dhcp'],
      'gpo': ['group policy object', 'strategie de groupe', 'policies'],
      'ssl': ['secure socket layer', 'transport layer security', 'certificat ssl'],
      'firewall': ['pare feu', 'pare-feu', 'security firewall']
    };

    // Rechercher les variantes
    Object.entries(this.skillsKeywords).forEach(([, skillInfo]) => {
      const variants = skillVariants[skillInfo.slug] || [];

      for (const variant of variants) {
        const normalizedVariant = this.normalizeText(variant);
        if (normalizedText.includes(normalizedVariant)) {
          // Éviter les doublons
          const alreadyFound = foundSkills.find(skill => skill.slug === skillInfo.slug);
          if (!alreadyFound) {
            const isRequired = this.isSkillRequired(variant, normalizedText, title);

            foundSkills.push({
              ...skillInfo,
              keyword: variant,
              is_required: isRequired,
              weight: isRequired ? skillInfo.weight * 2 : skillInfo.weight,
              source: 'flexible'
            });

            console.log(`✅ Compétence trouvée avec variante: ${skillInfo.display_name} (${variant})`);
          }
          break; // Sortir de la boucle des variantes une fois trouvé
        }
      }
    });
  }

  /**
   * Valide qu'une compétence est pertinente dans le contexte
   * @param {string} keyword - Mot-clé de la compétence
   * @param {string} normalizedText - Texte normalisé
   * @returns {boolean} True si la compétence est valide dans ce contexte
   */
  isValidSkillInContext(keyword, normalizedText) {
    // Éviter les faux positifs pour certains mots courts
    const shortWords = ['c', 'go', 'r'];
    if (shortWords.includes(keyword.toLowerCase())) {
      // Pour les mots courts, vérifier qu'ils sont entourés d'espaces ou de ponctuation
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'i');
      if (!regex.test(normalizedText)) {
        return false;
      }

      // Vérifier le contexte technique pour les langages courts
      const technicalContext = [
        'langage', 'programmation', 'développement', 'code', 'framework',
        'language', 'programming', 'development', 'coding'
      ];

      const keywordIndex = normalizedText.indexOf(keyword.toLowerCase());
      const contextStart = Math.max(0, keywordIndex - 50);
      const contextEnd = Math.min(normalizedText.length, keywordIndex + keyword.length + 50);
      const context = normalizedText.substring(contextStart, contextEnd);

      const hasTechnicalContext = technicalContext.some(tech => context.includes(tech));
      if (!hasTechnicalContext) {
        return false;
      }
    }

    // Éviter les faux positifs pour C# et C++ dans des contextes non techniques
    if (['c#', 'c++'].includes(keyword.toLowerCase())) {
      const technicalIndicators = [
        'développement', 'programmation', 'langage', 'framework', 'application',
        'development', 'programming', 'language', 'coding', 'software'
      ];

      const hasTechnicalIndicator = technicalIndicators.some(indicator =>
        normalizedText.includes(indicator)
      );

      if (!hasTechnicalIndicator) {
        return false;
      }
    }

    return true;
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
    const keywordLower = keyword.toLowerCase();

    // Si la compétence est dans le titre, elle est probablement obligatoire
    if (titleLower.includes(keywordLower)) {
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
      'connaissance approfondie',
      'compétences requises',
      'prérequis',
      'impératif'
    ];

    const optionalIndicators = [
      'souhaité',
      'apprécié',
      'un plus',
      'bonus',
      'idéalement',
      'de préférence',
      'serait un atout',
      'compétences appréciées',
      'optionnel'
    ];

    // Extraire le contexte autour du mot-clé (100 caractères avant et après)
    const keywordIndex = text.indexOf(keywordLower);
    if (keywordIndex === -1) return false;

    const contextStart = Math.max(0, keywordIndex - 100);
    const contextEnd = Math.min(text.length, keywordIndex + keywordLower.length + 100);
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

    // Logique contextuelle améliorée
    // Chercher des sections "Compétences requises" vs "Compétences souhaitées"
    const beforeKeyword = text.substring(0, keywordIndex);
    const lastRequiredSection = Math.max(
      beforeKeyword.lastIndexOf('compétences requises'),
      beforeKeyword.lastIndexOf('prérequis'),
      beforeKeyword.lastIndexOf('obligatoire'),
      beforeKeyword.lastIndexOf('indispensable')
    );

    const lastOptionalSection = Math.max(
      beforeKeyword.lastIndexOf('compétences souhaitées'),
      beforeKeyword.lastIndexOf('compétences appréciées'),
      beforeKeyword.lastIndexOf('un plus'),
      beforeKeyword.lastIndexOf('bonus')
    );

    // Si la compétence est plus proche d'une section "requise"
    if (lastRequiredSection > lastOptionalSection && lastRequiredSection !== -1) {
      return true;
    }

    // Si la compétence est plus proche d'une section "optionnelle"
    if (lastOptionalSection > lastRequiredSection && lastOptionalSection !== -1) {
      return false;
    }

    // Par défaut, considérer comme obligatoire si c'est une compétence technique majeure
    // ou si elle apparaît dans les premières sections de l'offre
    const majorSkills = [
      'java', 'javascript', 'typescript', 'python', 'react', 'angular', 'vue.js', 'spring',
      'citrix', 'xenapp', 'xendesktop', 'active directory', 'windows', 'linux',
      'sccm', 'intune', 'servicenow'
    ];

    const isMajorSkill = majorSkills.includes(keywordLower);
    const isInFirstHalf = keywordIndex < text.length / 2;

    return isMajorSkill && isInFirstHalf;
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
      // Chercher la compétence dans la base de données par slug d'abord
      let { data: existingSkill } = await supabase
        .from('skills')
        .select('id, slug, display_name, category')
        .eq('slug', parsedSkill.slug)
        .single();

      // Si pas trouvé par slug, chercher par nom
      if (!existingSkill) {
        const { data: skillByName } = await supabase
          .from('skills')
          .select('id, slug, display_name, category')
          .ilike('display_name', `%${parsedSkill.display_name}%`)
          .single();
        existingSkill = skillByName;
      }
      
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
   * Fallback avec IA pour extraire les compétences quand le parsing traditionnel échoue
   * @param {string} description - Description de l'offre
   * @param {string} title - Titre de l'offre
   * @returns {Array} Liste des compétences trouvées avec l'IA
   */
  async parseSkillsWithAI(description, title) {
    try {
      console.log('🤖 Tentative d\'extraction des compétences avec l\'IA...');

      const prompt = `
Analyse cette offre d'emploi et extrait UNIQUEMENT les compétences techniques spécifiques mentionnées.
Ne pas inventer de compétences qui ne sont pas explicitement mentionnées.

Titre: ${title}
Description: ${description}

Retourne une liste JSON des compétences trouvées avec ce format exact:
[
  {
    "name": "nom de la compétence",
    "category": "catégorie (Développement, Système, Réseau, etc.)",
    "is_required": true/false,
    "confidence": 0.8
  }
]

Concentre-toi sur les technologies, outils, langages, systèmes d'exploitation, frameworks mentionnés explicitement.
`;

      const aiResponse = await aiService.generateText(prompt);

      if (!aiResponse) {
        console.log('❌ Pas de réponse de l\'IA');
        return [];
      }

      // Parser la réponse JSON de l'IA
      let aiSkills = [];
      try {
        // Extraire le JSON de la réponse (au cas où il y aurait du texte autour)
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          aiSkills = JSON.parse(jsonMatch[0]);
        } else {
          console.log('❌ Format JSON non trouvé dans la réponse IA');
          return [];
        }
      } catch (parseError) {
        console.log('❌ Erreur parsing JSON IA:', parseError.message);
        return [];
      }

      // Convertir les compétences IA en format compatible
      const foundSkills = [];
      for (const aiSkill of aiSkills) {
        if (aiSkill.confidence && aiSkill.confidence >= 0.7) { // Seuil de confiance
          // Essayer de matcher avec notre dictionnaire existant
          const matchedKeyword = this.findMatchingKeyword(aiSkill.name);

          if (matchedKeyword) {
            const skillInfo = this.skillsKeywords[matchedKeyword];
            foundSkills.push({
              ...skillInfo,
              keyword: matchedKeyword,
              is_required: aiSkill.is_required || false,
              weight: aiSkill.is_required ? skillInfo.weight * 2 : skillInfo.weight,
              source: 'AI'
            });
          } else {
            // Créer une nouvelle compétence temporaire
            foundSkills.push({
              slug: aiSkill.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
              display_name: aiSkill.name,
              category: aiSkill.category || 'Technique',
              weight: aiSkill.is_required ? 4 : 2,
              keyword: aiSkill.name.toLowerCase(),
              is_required: aiSkill.is_required || false,
              source: 'AI'
            });
          }
        }
      }

      console.log(`🤖 IA a trouvé ${foundSkills.length} compétences`);
      return foundSkills;

    } catch (error) {
      console.error('❌ Erreur lors de l\'extraction IA:', error);
      return [];
    }
  }

  /**
   * Trouve un mot-clé correspondant dans notre dictionnaire
   * @param {string} skillName - Nom de la compétence à chercher
   * @returns {string|null} Mot-clé trouvé ou null
   */
  findMatchingKeyword(skillName) {
    const normalizedSkillName = this.normalizeText(skillName);

    // Recherche exacte d'abord
    for (const [keyword, skillInfo] of Object.entries(this.skillsKeywords)) {
      if (this.normalizeText(skillInfo.display_name) === normalizedSkillName) {
        return keyword;
      }
    }

    // Recherche partielle
    for (const [keyword, skillInfo] of Object.entries(this.skillsKeywords)) {
      const normalizedDisplayName = this.normalizeText(skillInfo.display_name);
      if (normalizedDisplayName.includes(normalizedSkillName) ||
          normalizedSkillName.includes(normalizedDisplayName)) {
        return keyword;
      }
    }

    return null;
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
