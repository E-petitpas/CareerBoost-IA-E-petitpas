# 🛠️ Scripts de Gestion des Compétences - CareerBoost

## 📋 Vue d'ensemble

Ce dossier contient les scripts essentiels pour la gestion du système de parsing des compétences de CareerBoost. Ces outils permettent l'installation, la maintenance et le monitoring du système en production.

## 📁 Scripts disponibles

### 🚀 Production & Installation

#### `production-skills-seed.js`
**Objectif** : Initialise la table `skills` avec toutes les compétences nécessaires

**Usage** :
```bash
node scripts/production-skills-seed.js
```

**Fonctionnalités** :
- ✅ Insertion de 267+ compétences par batch
- ✅ Gestion automatique des doublons
- ✅ Statistiques détaillées par catégorie
- ✅ Vérification de la connexion base de données

**Sortie attendue** :
```
🎉 Seed terminé avec succès !
📈 Total compétences en base: 267
✅ Nouvelles compétences ajoutées: 142
⚠️ Compétences ignorées (doublons): 0
```

#### `production-skills-seed.sql`
**Objectif** : Script SQL pur pour l'initialisation des compétences

**Usage** :
- Copiez le contenu dans l'éditeur SQL de Supabase
- Ou exécutez via psql : `psql -f production-skills-seed.sql`

**Avantages** :
- ✅ Exécution directe sans Node.js
- ✅ Gestion des conflits avec `ON CONFLICT DO NOTHING`
- ✅ Requêtes de vérification incluses

### 🔍 Vérification & Diagnostic

#### `verify-skills-sync.js`
**Objectif** : Vérifie la synchronisation entre le dictionnaire de parsing et la base de données

**Usage** :
```bash
node scripts/verify-skills-sync.js
```

**Vérifications effectuées** :
- ✅ Compétences manquantes en base
- ✅ Compétences non référencées dans le parsing
- ✅ Incohérences de noms/catégories
- ✅ Génération automatique de SQL de correction

**Sortie type** :
```
🎯 RÉSUMÉ DE LA SYNCHRONISATION
📊 Compétences en base: 267
📖 Compétences dans le parsing: 121
❌ Manquantes en base: 0
📈 Taux de synchronisation: 100.0%
```

### 📊 Processing & Monitoring

#### `parseAllOffers.js`
**Objectif** : Parse toutes les offres d'emploi pour extraire les compétences

**Usage** :
```bash
node scripts/parseAllOffers.js
```

**Fonctionnalités** :
- ✅ Traitement par batch pour éviter les timeouts
- ✅ Logging détaillé du progrès
- ✅ Gestion des erreurs et reprises
- ✅ Statistiques finales

#### `checkProgress.js`
**Objectif** : Affiche les statistiques actuelles du parsing

**Usage** :
```bash
node scripts/checkProgress.js
```

**Informations affichées** :
- Nombre total d'offres
- Offres avec compétences détectées
- Moyenne de compétences par offre
- Répartition par catégories

#### `rerunParsing.js`
**Objectif** : Supprime toutes les données de parsing et relance le traitement complet

**Usage** :
```bash
node scripts/rerunParsing.js
```

**⚠️ Attention** : Supprime toutes les données de `job_offer_skills` !

## 🔄 Workflows recommandés

### 🆕 Installation initiale en production

1. **Préparez l'environnement** :
```bash
# Vérifiez les variables d'environnement
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
```

2. **Initialisez les compétences** :
```bash
node scripts/production-skills-seed.js
```

3. **Vérifiez l'installation** :
```bash
node scripts/verify-skills-sync.js
```

4. **Lancez le parsing initial** :
```bash
node scripts/parseAllOffers.js
```

5. **Contrôlez les résultats** :
```bash
node scripts/checkProgress.js
```

### 🔧 Maintenance régulière

#### Ajout de nouvelles compétences
1. Modifiez `src/services/skillsParsingService.js`
2. Ajoutez les compétences en base :
```bash
node scripts/production-skills-seed.js
```
3. Vérifiez la synchronisation :
```bash
node scripts/verify-skills-sync.js
```

#### Mise à jour du parsing
1. Relancez le parsing complet :
```bash
node scripts/rerunParsing.js
```
2. Surveillez les progrès :
```bash
node scripts/checkProgress.js
```

### 🐛 Dépannage

#### Problème : Compétences non détectées
```bash
# 1. Vérifiez la synchronisation
node scripts/verify-skills-sync.js

# 2. Si des compétences manquent, ajoutez-les
node scripts/production-skills-seed.js

# 3. Relancez le parsing
node scripts/parseAllOffers.js
```

#### Problème : Performance lente
```bash
# 1. Vérifiez les statistiques
node scripts/checkProgress.js

# 2. Analysez les logs dans la console
# 3. Réduisez la taille des batches si nécessaire
```

## 📋 Prérequis techniques

### Variables d'environnement requises
```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Dépendances Node.js
- `@supabase/supabase-js`
- `dotenv`

### Structure de base de données
Tables requises :
- `skills` (id, slug, display_name, category, created_at)
- `job_offers` (id, title, description, france_travail_data, ...)
- `job_offer_skills` (offer_id, skill_id, is_required, weight)

## 📊 Métriques de performance

### Résultats attendus après installation complète
- **451 offres** traitées
- **167 offres avec compétences** (37% de taux de détection)
- **1910 compétences** détectées au total
- **Moyenne de 11.4 compétences/offre**

### Temps d'exécution typiques
- `production-skills-seed.js` : ~30 secondes
- `verify-skills-sync.js` : ~10 secondes
- `parseAllOffers.js` : ~5-10 minutes (selon le nombre d'offres)
- `checkProgress.js` : ~5 secondes

## 🔒 Sécurité et bonnes pratiques

### Gestion des erreurs
- Tous les scripts incluent une gestion d'erreurs robuste
- Les transactions sont utilisées pour les opérations critiques
- Les conflits de données sont gérés automatiquement

### Logging
- Logs détaillés avec emojis pour la lisibilité
- Statistiques de progression en temps réel
- Messages d'erreur explicites avec suggestions de résolution

### Performance
- Traitement par batch pour éviter les timeouts
- Utilisation d'upsert pour gérer les doublons
- Index optimisés sur les colonnes de recherche

---

## 🆘 Support

En cas de problème :
1. Vérifiez les logs d'erreur dans la console
2. Consultez la documentation dans `docs/SKILLS_PARSING_SYSTEM.md`
3. Utilisez `verify-skills-sync.js` pour diagnostiquer les problèmes de synchronisation
4. Contactez l'équipe de développement avec les logs d'erreur

✅ **Ces scripts garantissent un système de parsing robuste et maintenable !**
