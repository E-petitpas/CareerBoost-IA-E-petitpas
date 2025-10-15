require('dotenv').config();
const { supabase } = require('../config/supabase');

async function approveCompany(companyName) {
  console.log(`🔍 Recherche de l'entreprise "${companyName}"...`);

  try {
    // Trouver l'entreprise par nom
    const { data: companies, error: searchError } = await supabase
      .from('companies')
      .select('*')
      .ilike('name', `%${companyName}%`);

    if (searchError) {
      console.error('❌ Erreur lors de la recherche:', searchError);
      return;
    }

    if (!companies || companies.length === 0) {
      console.log('❌ Aucune entreprise trouvée avec ce nom');
      return;
    }

    if (companies.length > 1) {
      console.log('⚠️  Plusieurs entreprises trouvées:');
      companies.forEach((company, index) => {
        console.log(`   ${index + 1}. ${company.name} (${company.status}) - SIREN: ${company.siren || 'N/A'}`);
      });
      console.log('Veuillez être plus spécifique dans le nom');
      return;
    }

    const company = companies[0];
    console.log(`📋 Entreprise trouvée: ${company.name} (Statut actuel: ${company.status})`);

    // Approuver l'entreprise
    const { data: updatedCompany, error: updateError } = await supabase
      .from('companies')
      .update({
        status: 'VERIFIED',
        validated_at: new Date().toISOString()
      })
      .eq('id', company.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erreur lors de l\'approbation:', updateError);
      return;
    }

    console.log(`✅ Entreprise "${company.name}" approuvée avec succès !`);
    console.log(`📊 Nouveau statut: ${updatedCompany.status}`);
    console.log(`📅 Date de validation: ${updatedCompany.validated_at}`);

  } catch (error) {
    console.error('💥 Erreur générale:', error);
  }
}

// Utilisation du script
const companyName = process.argv[2];

if (!companyName) {
  console.log('❌ Usage: npm run approve-company "Nom de l\'entreprise"');
  console.log('   Exemple: npm run approve-company "Favoris"');
  process.exit(1);
}

approveCompany(companyName)
  .then(() => {
    console.log('🎉 Script terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
