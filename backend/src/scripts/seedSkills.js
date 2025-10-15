require('dotenv').config();
const { supabase } = require('../config/supabase');

const skills = [
  // Développement Web
  'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Node.js', 'Express.js',
  'HTML', 'CSS', 'Sass', 'Tailwind CSS', 'Bootstrap',
  
  // Backend
  'Python', 'Django', 'Flask', 'FastAPI', 'Java', 'Spring Boot', 'PHP', 'Laravel',
  'C#', '.NET', 'Ruby', 'Ruby on Rails', 'Go', 'Rust',
  
  // Bases de données
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'SQLite',
  
  // DevOps & Cloud
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'Google Cloud', 'Jenkins', 'GitLab CI',
  'Terraform', 'Ansible', 'Linux', 'Nginx', 'Apache',
  
  // Mobile
  'React Native', 'Flutter', 'Swift', 'Kotlin', 'Ionic',
  
  // Data Science & IA
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
  'Scikit-learn', 'R', 'Jupyter', 'Power BI', 'Tableau',
  
  // Design & UX
  'Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'Sketch', 'UX Design', 'UI Design',
  
  // Gestion de projet
  'Scrum', 'Agile', 'Kanban', 'Jira', 'Trello', 'Confluence',
  
  // Outils
  'Git', 'GitHub', 'GitLab', 'Bitbucket', 'VS Code', 'IntelliJ', 'Postman',
  
  // Soft Skills
  'Communication', 'Leadership', 'Travail en équipe', 'Résolution de problèmes',
  'Gestion du temps', 'Adaptabilité', 'Créativité', 'Esprit critique'
];

async function seedSkills() {
  console.log('🌱 Début du seeding des compétences...');

  try {
    // Vérifier si des compétences existent déjà
    const { data: existingSkills, error: checkError } = await supabase
      .from('skills')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('❌ Erreur lors de la vérification:', checkError);
      return;
    }

    if (existingSkills && existingSkills.length > 0) {
      console.log('ℹ️  Des compétences existent déjà, ajout des nouvelles uniquement...');
    }

    // Préparer les données
    const skillsData = skills.map(skill => ({
      slug: skill.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      display_name: skill
    }));

    // Insérer les compétences (ignore les doublons)
    const { data: insertedSkills, error: insertError } = await supabase
      .from('skills')
      .upsert(skillsData, { 
        onConflict: 'slug',
        ignoreDuplicates: true 
      })
      .select();

    if (insertError) {
      console.error('❌ Erreur lors de l\'insertion:', insertError);
      return;
    }

    console.log(`✅ ${insertedSkills?.length || 0} compétences ajoutées avec succès !`);
    
    // Afficher quelques exemples
    if (insertedSkills && insertedSkills.length > 0) {
      console.log('📋 Exemples de compétences ajoutées:');
      insertedSkills.slice(0, 5).forEach(skill => {
        console.log(`   - ${skill.display_name} (${skill.slug})`);
      });
      if (insertedSkills.length > 5) {
        console.log(`   ... et ${insertedSkills.length - 5} autres`);
      }
    }

    // Statistiques finales
    const { data: totalSkills, error: countError } = await supabase
      .from('skills')
      .select('id', { count: 'exact' });

    if (!countError) {
      console.log(`📊 Total des compétences dans la base: ${totalSkills?.length || 0}`);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le script
if (require.main === module) {
  seedSkills()
    .then(() => {
      console.log('🎉 Seeding terminé !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { seedSkills };
