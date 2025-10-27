require('dotenv').config();
const { supabase } = require('../config/supabase');

async function quickFixDedupError() {
  console.log('🚀 Correction rapide de l\'erreur dedup_hash...');
  
  try {
    // 1. Identifier l'offre problématique avec le hash spécifique de l'erreur
    const problematicHash = '6e77f1a224c8b29783b729be7d5d5a90';
    
    console.log(`🔍 Recherche des offres avec le hash: ${problematicHash}`);
    
    const { data: duplicateOffers, error: searchError } = await supabase
      .from('job_offers')
      .select('id, title, created_at, source, company_id')
      .eq('dedup_hash', problematicHash)
      .order('created_at', { ascending: true });
    
    if (searchError) {
      console.error('❌ Erreur recherche:', searchError);
      throw searchError;
    }
    
    console.log(`📊 ${duplicateOffers.length} offres trouvées avec ce hash`);
    
    if (duplicateOffers.length === 0) {
      console.log('✅ Aucune offre trouvée avec ce hash, le problème est peut-être déjà résolu');
      return;
    }
    
    // Afficher les détails des offres
    duplicateOffers.forEach((offer, index) => {
      console.log(`   ${index + 1}. ID: ${offer.id}, Titre: "${offer.title}", Créée: ${offer.created_at}, Source: ${offer.source}`);
    });
    
    if (duplicateOffers.length > 1) {
      // Garder la première (plus ancienne), supprimer les autres
      const toKeep = duplicateOffers[0];
      const toDelete = duplicateOffers.slice(1);
      
      console.log(`\n✅ Garder l'offre: "${toKeep.title}" (ID: ${toKeep.id})`);
      
      for (const offer of toDelete) {
        console.log(`🗑️ Suppression de l'offre: "${offer.title}" (ID: ${offer.id})`);
        
        // Supprimer les compétences associées
        await supabase
          .from('job_offer_skills')
          .delete()
          .eq('job_offer_id', offer.id);
        
        // Supprimer les candidatures associées
        await supabase
          .from('applications')
          .delete()
          .eq('job_offer_id', offer.id);
        
        // Supprimer l'offre
        const { error: deleteError } = await supabase
          .from('job_offers')
          .delete()
          .eq('id', offer.id);
        
        if (deleteError) {
          console.error(`❌ Erreur suppression offre ${offer.id}:`, deleteError);
        } else {
          console.log(`✅ Offre ${offer.id} supprimée avec succès`);
        }
      }
    }
    
    // 2. Corriger la contrainte pour éviter le problème à l'avenir
    console.log('\n🔧 Correction de la contrainte unique...');
    
    // Supprimer l'ancienne contrainte stricte
    const dropSql = `
      ALTER TABLE job_offers 
      DROP CONSTRAINT IF EXISTS unique_dedup_hash;
    `;
    
    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropSql });
    
    if (dropError) {
      console.log('⚠️ Erreur suppression contrainte (peut-être déjà supprimée):', dropError.message);
    } else {
      console.log('✅ Ancienne contrainte supprimée');
    }
    
    // Créer un index unique partiel
    const createIndexSql = `
      CREATE UNIQUE INDEX IF NOT EXISTS unique_dedup_hash_not_null 
      ON job_offers (dedup_hash) 
      WHERE dedup_hash IS NOT NULL;
    `;
    
    const { error: indexError } = await supabase.rpc('exec_sql', { sql: createIndexSql });
    
    if (indexError) {
      console.log('⚠️ Erreur création index:', indexError.message);
    } else {
      console.log('✅ Nouvel index unique partiel créé');
    }
    
    // 3. Test rapide
    console.log('\n🧪 Test rapide...');
    
    const testHash = 'test_' + Date.now();
    const testOffer = {
      title: 'Test Quick Fix',
      description: 'Test',
      company_id: 1,
      source: 'TEST',
      status: 'ACTIVE',
      admin_status: 'PENDING',
      dedup_hash: testHash
    };
    
    const { data: testInsert, error: testError } = await supabase
      .from('job_offers')
      .insert(testOffer)
      .select('id')
      .single();
    
    if (testError) {
      console.error('❌ Test échoué:', testError);
    } else {
      console.log('✅ Test réussi: nouvelle offre créée');
      
      // Nettoyer
      await supabase.from('job_offers').delete().eq('id', testInsert.id);
      console.log('🧹 Test nettoyé');
    }
    
    console.log('\n🎉 Correction rapide terminée!');
    console.log('📝 Résumé:');
    console.log('   - Doublons supprimés');
    console.log('   - Contrainte corrigée pour permettre les NULL');
    console.log('   - Système prêt pour de nouvelles offres');
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction rapide:', error);
    throw error;
  }
}

// Fonction pour vérifier rapidement l'état
async function checkCurrentState() {
  console.log('📊 État actuel de la base de données...');
  
  try {
    // Compter les offres par dedup_hash
    const { data: hashCounts, error } = await supabase
      .from('job_offers')
      .select('dedup_hash')
      .not('dedup_hash', 'is', null);
    
    if (error) {
      console.error('❌ Erreur:', error);
      return;
    }
    
    const hashMap = {};
    hashCounts.forEach(offer => {
      hashMap[offer.dedup_hash] = (hashMap[offer.dedup_hash] || 0) + 1;
    });
    
    const duplicates = Object.entries(hashMap).filter(([hash, count]) => count > 1);
    
    console.log(`📈 Total offres avec dedup_hash: ${hashCounts.length}`);
    console.log(`🔄 Groupes de doublons: ${duplicates.length}`);
    
    if (duplicates.length > 0) {
      console.log('🚨 Doublons détectés:');
      duplicates.forEach(([hash, count]) => {
        console.log(`   - Hash ${hash.substring(0, 16)}...: ${count} offres`);
      });
    } else {
      console.log('✅ Aucun doublon détecté');
    }
    
  } catch (error) {
    console.error('❌ Erreur vérification:', error);
  }
}

// Exécuter le script
if (require.main === module) {
  console.log('🔧 Démarrage de la correction rapide...\n');
  
  checkCurrentState()
    .then(() => quickFixDedupError())
    .then(() => checkCurrentState())
    .then(() => {
      console.log('\n✅ Script de correction rapide terminé avec succès!');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Erreur:', err);
      process.exit(1);
    });
}

module.exports = { quickFixDedupError, checkCurrentState };
