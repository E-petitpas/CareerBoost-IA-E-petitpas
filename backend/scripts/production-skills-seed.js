require('dotenv').config();
const { supabase } = require('../src/config/supabase');

/**
 * Script de seed pour initialiser la table skills en production
 * Contient toutes les compétences du dictionnaire de parsing
 */

const skillsData = [
  // Langages de programmation
  { slug: 'java', display_name: 'Java', category: 'Développement' },
  { slug: 'javascript', display_name: 'JavaScript', category: 'Développement Web' },
  { slug: 'typescript', display_name: 'TypeScript', category: 'Développement Web' },
  { slug: 'python', display_name: 'Python', category: 'Développement' },
  { slug: 'php', display_name: 'PHP', category: 'Développement Web' },
  { slug: 'csharp', display_name: 'C#', category: 'Développement' },
  { slug: 'cpp', display_name: 'C++', category: 'Développement' },
  { slug: 'go', display_name: 'Go', category: 'Développement' },
  { slug: 'rust', display_name: 'Rust', category: 'Développement' },
  { slug: 'kotlin', display_name: 'Kotlin', category: 'Développement' },
  { slug: 'swift', display_name: 'Swift', category: 'Développement' },
  { slug: 'dart', display_name: 'Dart', category: 'Développement' },
  
  // Frameworks Java
  { slug: 'spring', display_name: 'Spring', category: 'Framework Java' },
  { slug: 'spring-boot', display_name: 'Spring Boot', category: 'Framework Java' },
  { slug: 'hibernate', display_name: 'Hibernate', category: 'Framework Java' },
  { slug: 'struts', display_name: 'Struts', category: 'Framework Java' },
  { slug: 'quarkus', display_name: 'Quarkus', category: 'Framework Java' },
  { slug: 'jakarta-ee', display_name: 'Jakarta EE', category: 'Framework Java' },
  { slug: 'java-ee', display_name: 'Java EE', category: 'Framework Java' },
  
  // Frameworks Frontend
  { slug: 'react', display_name: 'React', category: 'Développement Web' },
  { slug: 'vue-js', display_name: 'Vue.js', category: 'Développement Web' },
  { slug: 'angular', display_name: 'Angular', category: 'Développement Web' },
  { slug: 'nextjs', display_name: 'Next.js', category: 'Développement Web' },
  { slug: 'nuxtjs', display_name: 'Nuxt.js', category: 'Développement Web' },
  { slug: 'html5', display_name: 'HTML5', category: 'Développement Web' },
  { slug: 'css3', display_name: 'CSS3', category: 'Développement Web' },
  
  // Backend
  { slug: 'nodejs', display_name: 'Node.js', category: 'Développement Backend' },
  { slug: 'express', display_name: 'Express.js', category: 'Développement Backend' },
  { slug: 'nestjs', display_name: 'NestJS', category: 'Développement Backend' },
  { slug: 'django', display_name: 'Django', category: 'Développement Backend' },
  { slug: 'flask', display_name: 'Flask', category: 'Développement Backend' },
  { slug: 'laravel', display_name: 'Laravel', category: 'Développement Backend' },
  { slug: 'rails', display_name: 'Ruby on Rails', category: 'Développement Backend' },
  
  // Bases de données
  { slug: 'postgresql', display_name: 'PostgreSQL', category: 'Base de données' },
  { slug: 'mysql', display_name: 'MySQL', category: 'Base de données' },
  { slug: 'mongodb', display_name: 'MongoDB', category: 'Base de données' },
  { slug: 'redis', display_name: 'Redis', category: 'Base de données' },
  { slug: 'elasticsearch', display_name: 'Elasticsearch', category: 'Base de données' },
  { slug: 'sqlite', display_name: 'SQLite', category: 'Base de données' },
  { slug: 'oracle', display_name: 'Oracle', category: 'Base de données' },
  { slug: 'sql-server', display_name: 'SQL Server', category: 'Base de données' },
  { slug: 'cassandra', display_name: 'Cassandra', category: 'Base de données' },
  
  // DevOps
  { slug: 'docker', display_name: 'Docker', category: 'DevOps' },
  { slug: 'kubernetes', display_name: 'Kubernetes', category: 'DevOps' },
  { slug: 'jenkins', display_name: 'Jenkins', category: 'DevOps' },
  { slug: 'gitlab-ci', display_name: 'GitLab CI', category: 'DevOps' },
  { slug: 'github-actions', display_name: 'GitHub Actions', category: 'DevOps' },
  { slug: 'git', display_name: 'Git', category: 'Outils de développement' },
  { slug: 'maven', display_name: 'Maven', category: 'Outils de développement' },
  { slug: 'gradle', display_name: 'Gradle', category: 'Outils de développement' },
  { slug: 'eclipse', display_name: 'Eclipse', category: 'Outils de développement' },
  { slug: 'intellij', display_name: 'IntelliJ IDEA', category: 'Outils de développement' },
  
  // Cloud
  { slug: 'aws', display_name: 'AWS', category: 'Cloud' },
  { slug: 'azure', display_name: 'Azure', category: 'Cloud' },
  { slug: 'gcp', display_name: 'Google Cloud Platform', category: 'Cloud' },
  { slug: 'heroku', display_name: 'Heroku', category: 'Cloud' },
  { slug: 'digitalocean', display_name: 'DigitalOcean', category: 'Cloud' },
  
  // Systèmes d'exploitation
  { slug: 'linux', display_name: 'Linux', category: 'Système' },
  { slug: 'ubuntu', display_name: 'Ubuntu', category: 'Système' },
  { slug: 'centos', display_name: 'CentOS', category: 'Système' },
  { slug: 'debian', display_name: 'Debian', category: 'Système' },
  { slug: 'redhat', display_name: 'Red Hat', category: 'Système' },
  { slug: 'windows', display_name: 'Windows', category: 'Système' },
  { slug: 'windows-10', display_name: 'Windows 10', category: 'Système' },
  { slug: 'windows-11', display_name: 'Windows 11', category: 'Système' },
  { slug: 'windows-server', display_name: 'Windows Server', category: 'Système' },
  { slug: 'macos', display_name: 'macOS', category: 'Système' },
  
  // Réseau
  { slug: 'tcp-ip', display_name: 'TCP/IP', category: 'Réseau' },
  { slug: 'dns', display_name: 'DNS', category: 'Réseau' },
  { slug: 'dhcp', display_name: 'DHCP', category: 'Réseau' },
  { slug: 'vlan', display_name: 'VLAN', category: 'Réseau' },
  { slug: 'vpn', display_name: 'VPN', category: 'Réseau' },
  { slug: 'firewall', display_name: 'Firewall', category: 'Réseau' },
  { slug: 'cisco', display_name: 'Cisco', category: 'Réseau' },
  { slug: 'juniper', display_name: 'Juniper', category: 'Réseau' },
  { slug: 'routing', display_name: 'Routing', category: 'Réseau' },
  { slug: 'switching', display_name: 'Switching', category: 'Réseau' },
  
  // Infrastructure
  { slug: 'active-directory', display_name: 'Active Directory', category: 'Infrastructure' },
  { slug: 'ldap', display_name: 'LDAP', category: 'Infrastructure' },
  { slug: 'gpo', display_name: 'GPO', category: 'Infrastructure' },
  { slug: 'serveur-impression', display_name: 'Serveur d\'impression', category: 'Infrastructure' },
  
  // Virtualisation
  { slug: 'vmware', display_name: 'VMware', category: 'Virtualisation' },
  { slug: 'hyper-v', display_name: 'Hyper-V', category: 'Virtualisation' },
  { slug: 'virtualbox', display_name: 'VirtualBox', category: 'Virtualisation' },
  { slug: 'citrix', display_name: 'Citrix', category: 'Virtualisation' },
  { slug: 'xenapp', display_name: 'XenApp', category: 'Virtualisation' },
  { slug: 'xendesktop', display_name: 'XenDesktop', category: 'Virtualisation' },
  
  // Outils de déploiement et gestion
  { slug: 'sccm', display_name: 'SCCM', category: 'Déploiement' },
  { slug: 'intune', display_name: 'Microsoft Intune', category: 'Déploiement' },
  { slug: 'mdt', display_name: 'MDT', category: 'Déploiement' },
  { slug: 'wsus', display_name: 'WSUS', category: 'Déploiement' },
  { slug: 'powershell', display_name: 'PowerShell', category: 'Scripting' },
  
  // Méthodologies
  { slug: 'itil', display_name: 'ITIL', category: 'Méthodologie' },
  { slug: 'agile', display_name: 'Agile', category: 'Méthodologie' },
  { slug: 'scrum', display_name: 'Scrum', category: 'Méthodologie' },
  { slug: 'kanban', display_name: 'Kanban', category: 'Méthodologie' },
  { slug: 'devops-methodology', display_name: 'DevOps', category: 'Méthodologie' },
  
  // Sécurité
  { slug: 'antivirus', display_name: 'Antivirus', category: 'Sécurité' },
  { slug: 'ssl', display_name: 'SSL/TLS', category: 'Sécurité' },
  { slug: 'oauth', display_name: 'OAuth', category: 'Sécurité' },
  { slug: 'jwt', display_name: 'JWT', category: 'Sécurité' },
  { slug: 'iam', display_name: 'IAM', category: 'Sécurité' },
  
  // ITSM
  { slug: 'glpi', display_name: 'GLPI', category: 'ITSM' },
  { slug: 'servicenow', display_name: 'ServiceNow', category: 'ITSM' },
  { slug: 'remedy', display_name: 'BMC Remedy', category: 'ITSM' },
  { slug: 'freshdesk', display_name: 'Freshdesk', category: 'ITSM' },
  { slug: 'zendesk', display_name: 'Zendesk', category: 'ITSM' },
  
  // Matériel et périphériques
  { slug: 'serveur', display_name: 'Serveur', category: 'Matériel' },
  { slug: 'imprimante', display_name: 'Imprimante', category: 'Matériel' },
  { slug: 'switch', display_name: 'Switch', category: 'Réseau' },
  { slug: 'routeur', display_name: 'Routeur', category: 'Réseau' },
  
  // ERP et solutions métier
  { slug: 'sage-x3', display_name: 'Sage X3', category: 'ERP' },
  { slug: 'microsoft-dynamics', display_name: 'Microsoft Dynamics', category: 'ERP' },
  { slug: 'dynamics-365', display_name: 'Dynamics 365', category: 'ERP' },
  { slug: 'dynamics-crm', display_name: 'Dynamics CRM', category: 'CRM' },
  { slug: 'dynamics-nav', display_name: 'Dynamics NAV', category: 'ERP' },
  { slug: 'dynamics-ax', display_name: 'Dynamics AX', category: 'ERP' },
  { slug: 'erp', display_name: 'ERP', category: 'ERP' },
  { slug: 'crm', display_name: 'CRM', category: 'CRM' },
  { slug: 'sap', display_name: 'SAP', category: 'ERP' },
  { slug: 'salesforce', display_name: 'Salesforce', category: 'CRM' },
  
  // Monitoring et supervision
  { slug: 'nagios', display_name: 'Nagios', category: 'Monitoring' },
  { slug: 'zabbix', display_name: 'Zabbix', category: 'Monitoring' },
  { slug: 'prometheus', display_name: 'Prometheus', category: 'Monitoring' },
  { slug: 'grafana', display_name: 'Grafana', category: 'Monitoring' },
  { slug: 'elk', display_name: 'ELK Stack', category: 'Monitoring' },
  
  // Systèmes industriels
  { slug: 'scada', display_name: 'SCADA', category: 'Industriel' },
  { slug: 'plc', display_name: 'PLC', category: 'Industriel' },
  { slug: 'mes', display_name: 'MES', category: 'Industriel' },
  { slug: 'dcs', display_name: 'DCS', category: 'Industriel' },
  
  // Outils bureautiques
  { slug: 'microsoft-office', display_name: 'Microsoft Office', category: 'Bureautique' },
  { slug: 'office-365', display_name: 'Office 365', category: 'Bureautique' },
  { slug: 'teams', display_name: 'Microsoft Teams', category: 'Bureautique' },
  { slug: 'outlook', display_name: 'Outlook', category: 'Bureautique' },
  { slug: 'excel', display_name: 'Excel', category: 'Bureautique' },
  { slug: 'word', display_name: 'Word', category: 'Bureautique' },
  { slug: 'powerpoint', display_name: 'PowerPoint', category: 'Bureautique' },
  
  // Outils de développement et versioning
  { slug: 'jira', display_name: 'Jira', category: 'Outils' },
  { slug: 'confluence', display_name: 'Confluence', category: 'Outils' },
  { slug: 'github', display_name: 'GitHub', category: 'Outils de développement' },
  { slug: 'gitlab', display_name: 'GitLab', category: 'Outils de développement' },
  { slug: 'bitbucket', display_name: 'Bitbucket', category: 'Outils de développement' }
];

async function seedSkills() {
  console.log('🚀 Initialisation des compétences pour la production...\n');
  
  try {
    // Vérifier la connexion
    console.log('🔍 Vérification de la connexion à la base de données...');
    const { data: testData, error: testError } = await supabase
      .from('skills')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erreur de connexion:', testError.message);
      return;
    }
    console.log('✅ Connexion établie\n');
    
    // Compter les compétences existantes
    const { count: existingCount, error: countError } = await supabase
      .from('skills')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Erreur lors du comptage:', countError.message);
      return;
    }
    
    console.log(`📊 Compétences existantes: ${existingCount}`);
    console.log(`📦 Compétences à insérer: ${skillsData.length}\n`);
    
    // Insérer les compétences par batch pour éviter les timeouts
    const batchSize = 50;
    let inserted = 0;
    let skipped = 0;
    
    for (let i = 0; i < skillsData.length; i += batchSize) {
      const batch = skillsData.slice(i, i + batchSize);
      console.log(`📤 Insertion du batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(skillsData.length/batchSize)} (${batch.length} compétences)...`);
      
      const { data: insertedData, error: insertError } = await supabase
        .from('skills')
        .upsert(batch, { 
          onConflict: 'slug',
          ignoreDuplicates: false 
        })
        .select();
      
      if (insertError) {
        console.error(`❌ Erreur batch ${Math.floor(i/batchSize) + 1}:`, insertError.message);
        continue;
      }
      
      const batchInserted = insertedData ? insertedData.length : 0;
      inserted += batchInserted;
      skipped += (batch.length - batchInserted);
      
      console.log(`   ✅ ${batchInserted} insérées, ${batch.length - batchInserted} ignorées (doublons)`);
    }
    
    // Vérification finale
    console.log('\n🔍 Vérification finale...');
    const { count: finalCount, error: finalCountError } = await supabase
      .from('skills')
      .select('*', { count: 'exact', head: true });
    
    if (finalCountError) {
      console.error('❌ Erreur lors de la vérification finale:', finalCountError.message);
      return;
    }
    
    // Statistiques par catégorie
    const { data: categoryStats, error: categoryError } = await supabase
      .from('skills')
      .select('category')
      .not('category', 'is', null);
    
    if (!categoryError && categoryStats) {
      const categoryCounts = categoryStats.reduce((acc, skill) => {
        acc[skill.category] = (acc[skill.category] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📊 Répartition par catégorie:');
      Object.entries(categoryCounts)
        .sort(([,a], [,b]) => b - a)
        .forEach(([category, count]) => {
          console.log(`   ${category}: ${count} compétences`);
        });
    }
    
    console.log('\n🎉 Seed terminé avec succès !');
    console.log('=====================================');
    console.log(`📈 Total compétences en base: ${finalCount}`);
    console.log(`✅ Nouvelles compétences ajoutées: ${inserted}`);
    console.log(`⚠️ Compétences ignorées (doublons): ${skipped}`);
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    console.error(error);
  }
}

if (require.main === module) {
  seedSkills().catch(console.error);
}

module.exports = { seedSkills, skillsData };
