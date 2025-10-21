-- ========================================
-- SEED COMPÉTENCES POUR PRODUCTION
-- CareerBoost E-petitpas
-- ========================================
-- Ce fichier contient toutes les compétences nécessaires pour le système de parsing
-- À exécuter en production pour initialiser la table skills

-- Insérer toutes les compétences du dictionnaire de parsing
INSERT INTO skills (slug, display_name, category) VALUES
  -- Langages de programmation
  ('java', 'Java', 'Développement'),
  ('javascript', 'JavaScript', 'Développement Web'),
  ('typescript', 'TypeScript', 'Développement Web'),
  ('python', 'Python', 'Développement'),
  ('php', 'PHP', 'Développement Web'),
  ('csharp', 'C#', 'Développement'),
  ('cpp', 'C++', 'Développement'),
  ('go', 'Go', 'Développement'),
  ('rust', 'Rust', 'Développement'),
  ('kotlin', 'Kotlin', 'Développement'),
  ('swift', 'Swift', 'Développement'),
  ('dart', 'Dart', 'Développement'),
  
  -- Frameworks Java
  ('spring', 'Spring', 'Framework Java'),
  ('spring-boot', 'Spring Boot', 'Framework Java'),
  ('hibernate', 'Hibernate', 'Framework Java'),
  ('struts', 'Struts', 'Framework Java'),
  ('quarkus', 'Quarkus', 'Framework Java'),
  ('jakarta-ee', 'Jakarta EE', 'Framework Java'),
  ('java-ee', 'Java EE', 'Framework Java'),
  
  -- Frameworks Frontend
  ('react', 'React', 'Développement Web'),
  ('vue-js', 'Vue.js', 'Développement Web'),
  ('angular', 'Angular', 'Développement Web'),
  ('nextjs', 'Next.js', 'Développement Web'),
  ('nuxtjs', 'Nuxt.js', 'Développement Web'),
  ('html5', 'HTML5', 'Développement Web'),
  ('css3', 'CSS3', 'Développement Web'),
  
  -- Backend
  ('nodejs', 'Node.js', 'Développement Backend'),
  ('express', 'Express.js', 'Développement Backend'),
  ('nestjs', 'NestJS', 'Développement Backend'),
  ('django', 'Django', 'Développement Backend'),
  ('flask', 'Flask', 'Développement Backend'),
  ('laravel', 'Laravel', 'Développement Backend'),
  ('rails', 'Ruby on Rails', 'Développement Backend'),
  
  -- Bases de données
  ('postgresql', 'PostgreSQL', 'Base de données'),
  ('mysql', 'MySQL', 'Base de données'),
  ('mongodb', 'MongoDB', 'Base de données'),
  ('redis', 'Redis', 'Base de données'),
  ('elasticsearch', 'Elasticsearch', 'Base de données'),
  ('sqlite', 'SQLite', 'Base de données'),
  ('oracle', 'Oracle', 'Base de données'),
  ('sql-server', 'SQL Server', 'Base de données'),
  ('cassandra', 'Cassandra', 'Base de données'),
  
  -- DevOps
  ('docker', 'Docker', 'DevOps'),
  ('kubernetes', 'Kubernetes', 'DevOps'),
  ('jenkins', 'Jenkins', 'DevOps'),
  ('gitlab-ci', 'GitLab CI', 'DevOps'),
  ('github-actions', 'GitHub Actions', 'DevOps'),
  ('git', 'Git', 'Outils de développement'),
  ('maven', 'Maven', 'Outils de développement'),
  ('gradle', 'Gradle', 'Outils de développement'),
  ('eclipse', 'Eclipse', 'Outils de développement'),
  ('intellij', 'IntelliJ IDEA', 'Outils de développement'),
  
  -- Cloud
  ('aws', 'AWS', 'Cloud'),
  ('azure', 'Azure', 'Cloud'),
  ('gcp', 'Google Cloud Platform', 'Cloud'),
  ('heroku', 'Heroku', 'Cloud'),
  ('digitalocean', 'DigitalOcean', 'Cloud'),
  
  -- Systèmes d'exploitation
  ('linux', 'Linux', 'Système'),
  ('ubuntu', 'Ubuntu', 'Système'),
  ('centos', 'CentOS', 'Système'),
  ('debian', 'Debian', 'Système'),
  ('redhat', 'Red Hat', 'Système'),
  ('windows', 'Windows', 'Système'),
  ('windows-10', 'Windows 10', 'Système'),
  ('windows-11', 'Windows 11', 'Système'),
  ('windows-server', 'Windows Server', 'Système'),
  ('macos', 'macOS', 'Système'),
  
  -- Réseau
  ('tcp-ip', 'TCP/IP', 'Réseau'),
  ('dns', 'DNS', 'Réseau'),
  ('dhcp', 'DHCP', 'Réseau'),
  ('vlan', 'VLAN', 'Réseau'),
  ('vpn', 'VPN', 'Réseau'),
  ('firewall', 'Firewall', 'Réseau'),
  ('cisco', 'Cisco', 'Réseau'),
  ('juniper', 'Juniper', 'Réseau'),
  ('routing', 'Routing', 'Réseau'),
  ('switching', 'Switching', 'Réseau'),
  
  -- Infrastructure
  ('active-directory', 'Active Directory', 'Infrastructure'),
  ('ldap', 'LDAP', 'Infrastructure'),
  ('gpo', 'GPO', 'Infrastructure'),
  ('serveur-impression', 'Serveur d''impression', 'Infrastructure'),
  
  -- Virtualisation
  ('vmware', 'VMware', 'Virtualisation'),
  ('hyper-v', 'Hyper-V', 'Virtualisation'),
  ('virtualbox', 'VirtualBox', 'Virtualisation'),
  ('citrix', 'Citrix', 'Virtualisation'),
  ('xenapp', 'XenApp', 'Virtualisation'),
  ('xendesktop', 'XenDesktop', 'Virtualisation'),
  
  -- Outils de déploiement et gestion
  ('sccm', 'SCCM', 'Déploiement'),
  ('intune', 'Microsoft Intune', 'Déploiement'),
  ('mdt', 'MDT', 'Déploiement'),
  ('wsus', 'WSUS', 'Déploiement'),
  ('powershell', 'PowerShell', 'Scripting'),
  
  -- Méthodologies
  ('itil', 'ITIL', 'Méthodologie'),
  ('agile', 'Agile', 'Méthodologie'),
  ('scrum', 'Scrum', 'Méthodologie'),
  ('kanban', 'Kanban', 'Méthodologie'),
  ('devops-methodology', 'DevOps', 'Méthodologie'),
  
  -- Sécurité
  ('antivirus', 'Antivirus', 'Sécurité'),
  ('ssl', 'SSL/TLS', 'Sécurité'),
  ('oauth', 'OAuth', 'Sécurité'),
  ('jwt', 'JWT', 'Sécurité'),
  ('iam', 'IAM', 'Sécurité'),
  
  -- ITSM
  ('glpi', 'GLPI', 'ITSM'),
  ('servicenow', 'ServiceNow', 'ITSM'),
  ('remedy', 'BMC Remedy', 'ITSM'),
  ('freshdesk', 'Freshdesk', 'ITSM'),
  ('zendesk', 'Zendesk', 'ITSM'),
  
  -- Matériel et périphériques
  ('serveur', 'Serveur', 'Matériel'),
  ('imprimante', 'Imprimante', 'Matériel'),
  ('switch', 'Switch', 'Réseau'),
  ('routeur', 'Routeur', 'Réseau'),
  
  -- ERP et solutions métier
  ('sage-x3', 'Sage X3', 'ERP'),
  ('microsoft-dynamics', 'Microsoft Dynamics', 'ERP'),
  ('dynamics-365', 'Dynamics 365', 'ERP'),
  ('dynamics-crm', 'Dynamics CRM', 'CRM'),
  ('dynamics-nav', 'Dynamics NAV', 'ERP'),
  ('dynamics-ax', 'Dynamics AX', 'ERP'),
  ('erp', 'ERP', 'ERP'),
  ('crm', 'CRM', 'CRM'),
  ('sap', 'SAP', 'ERP'),
  ('salesforce', 'Salesforce', 'CRM'),
  
  -- Monitoring et supervision
  ('nagios', 'Nagios', 'Monitoring'),
  ('zabbix', 'Zabbix', 'Monitoring'),
  ('prometheus', 'Prometheus', 'Monitoring'),
  ('grafana', 'Grafana', 'Monitoring'),
  ('elk', 'ELK Stack', 'Monitoring'),
  
  -- Systèmes industriels
  ('scada', 'SCADA', 'Industriel'),
  ('plc', 'PLC', 'Industriel'),
  ('mes', 'MES', 'Industriel'),
  ('dcs', 'DCS', 'Industriel'),
  
  -- Outils bureautiques
  ('microsoft-office', 'Microsoft Office', 'Bureautique'),
  ('office-365', 'Office 365', 'Bureautique'),
  ('teams', 'Microsoft Teams', 'Bureautique'),
  ('outlook', 'Outlook', 'Bureautique'),
  ('excel', 'Excel', 'Bureautique'),
  ('word', 'Word', 'Bureautique'),
  ('powerpoint', 'PowerPoint', 'Bureautique'),
  
  -- Outils de développement et versioning
  ('jira', 'Jira', 'Outils'),
  ('confluence', 'Confluence', 'Outils'),
  ('github', 'GitHub', 'Outils de développement'),
  ('gitlab', 'GitLab', 'Outils de développement'),
  ('bitbucket', 'Bitbucket', 'Outils de développement')

ON CONFLICT (slug) DO NOTHING;

-- Vérification du nombre de compétences insérées
SELECT 
  COUNT(*) as total_skills,
  COUNT(DISTINCT category) as total_categories
FROM skills;

-- Affichage des catégories et leur nombre de compétences
SELECT 
  category,
  COUNT(*) as skill_count
FROM skills 
WHERE category IS NOT NULL
GROUP BY category 
ORDER BY skill_count DESC;

-- Message de confirmation
SELECT '✅ Seed des compétences terminé avec succès!' as status;
