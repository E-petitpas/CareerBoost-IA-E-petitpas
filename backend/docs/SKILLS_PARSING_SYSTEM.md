# 🎯 Système de Parsing des Compétences - CareerBoost

## 📋 Vue d'ensemble

Le système de parsing des compétences de CareerBoost analyse automatiquement les descriptions d'offres d'emploi de France Travail pour extraire et identifier les compétences techniques requises. Cette documentation explique le fonctionnement du système, les améliorations apportées et comment l'installer en production.

## 🏗️ Architecture du système

### Composants principaux

1. **`skillsParsingService.js`** - Service principal de parsing
2. **Table `skills`** - Dictionnaire des compétences en base de données
3. **Table `job_offer_skills`** - Liaison entre offres et compétences détectées
4. **Scripts de production** - Outils d'installation et maintenance

### Flux de traitement

```
Offre d'emploi → Normalisation du texte → Détection des compétences → Matching en base → Stockage des résultats
```

## 🔧 Fonctionnalités du parsing

### 1. Normalisation intelligente du texte
- Préservation des séparateurs importants (`/`, `()`, `-`)
- Nettoyage des caractères parasites
- Conservation de la structure des listes techniques

### 2. Détection multi-méthodes
- **Regex avec word boundaries** : Évite les faux positifs
- **Listes techniques structurées** : Détection spécialisée pour les sections "Environnement technique", "Compétences requises", etc.
- **Recherche flexible** : Matching approximatif pour les variantes
- **Filtrage contextuel** : Évite les détections erronées selon le contexte

### 3. Pondération des compétences
- **Compétences requises** : Poids × 2
- **Compétences dans listes techniques** : Poids × 1.5
- **Compétences standard** : Poids × 1

### 4. Catégorisation automatique
- 20+ catégories : Développement, Système, Réseau, Cloud, etc.
- Classification automatique selon le dictionnaire

## 📊 Dictionnaire des compétences

Le système reconnaît **267+ compétences** réparties en catégories :

### 💻 Développement (42 compétences)
- **Langages** : Java, JavaScript, TypeScript, Python, PHP, C#, C++, Go, Rust, Kotlin, Swift, Dart
- **Frameworks Java** : Spring, Spring Boot, Hibernate, Struts, Quarkus, Jakarta EE
- **Frontend** : React, Vue.js, Angular, Next.js, HTML5, CSS3
- **Backend** : Node.js, Express.js, NestJS, Django, Flask, Laravel

### 🗄️ Infrastructure & Système (50+ compétences)
- **OS** : Linux, Ubuntu, Windows, CentOS, Debian, Red Hat
- **Virtualisation** : VMware, Hyper-V, Citrix, XenApp, XenDesktop
- **Réseau** : TCP/IP, DNS, DHCP, VLAN, Cisco, Juniper
- **Infrastructure** : Active Directory, LDAP, GPO

### ☁️ Cloud & DevOps (25+ compétences)
- **Cloud** : AWS, Azure, GCP, Heroku
- **DevOps** : Docker, Kubernetes, Jenkins, GitLab CI, GitHub Actions
- **Outils** : Git, Maven, Gradle, Eclipse, IntelliJ IDEA

### 📊 Données & Monitoring (30+ compétences)
- **Bases de données** : PostgreSQL, MySQL, MongoDB, Redis, Elasticsearch
- **Monitoring** : Nagios, Zabbix, Prometheus, Grafana, PRTG, SNMP
- **ERP/CRM** : Sage X3, Microsoft Dynamics, SAP, Salesforce

## 🚀 Installation en production

### Prérequis
- Base de données PostgreSQL/Supabase configurée
- Table `skills` créée (voir schema dans `SUPABASE_SIMPLE_SETUP.sql`)
- Variables d'environnement configurées

### Méthode 1 : Script SQL (Recommandée)

1. **Connectez-vous à Supabase**
2. **Ouvrez l'éditeur SQL**
3. **Exécutez le script** :
```bash
# Copiez le contenu de :
backend/scripts/production-skills-seed.sql
```

### Méthode 2 : Script Node.js

```bash
cd backend
node scripts/production-skills-seed.js
```

### Vérification de l'installation

```bash
# Vérifiez la synchronisation
node scripts/verify-skills-sync.js

# Testez le parsing sur toutes les offres
node scripts/parseAllOffers.js

# Surveillez les progrès
node scripts/checkProgress.js
```

## 🔄 Maintenance et monitoring

### Scripts disponibles

| Script | Description | Usage |
|--------|-------------|-------|
| `production-skills-seed.js` | Initialise les compétences en base | Production |
| `verify-skills-sync.js` | Vérifie la synchronisation | Maintenance |
| `parseAllOffers.js` | Parse toutes les offres | Batch processing |
| `checkProgress.js` | Affiche les statistiques | Monitoring |
| `rerunParsing.js` | Reparse toutes les offres | Maintenance |

### Ajout de nouvelles compétences

1. **Modifiez le dictionnaire** dans `skillsParsingService.js` :
```javascript
skillsKeywords: {
  'nouvelle-competence': {
    slug: 'nouvelle-competence',
    display_name: 'Nouvelle Compétence',
    category: 'Catégorie',
    weight: 1,
    variants: ['variante1', 'variante2']
  }
}
```

2. **Ajoutez en base de données** :
```sql
INSERT INTO skills (slug, display_name, category) VALUES
  ('nouvelle-competence', 'Nouvelle Compétence', 'Catégorie')
ON CONFLICT (slug) DO NOTHING;
```

3. **Vérifiez la synchronisation** :
```bash
node scripts/verify-skills-sync.js
```

## 📈 Performances et statistiques

### Métriques actuelles
- **451 offres** traitées
- **167 offres avec compétences** (37%)
- **1910 compétences** détectées au total
- **Moyenne de 11.4 compétences/offre**

### Optimisations appliquées
- **Parsing par batch** : Évite les timeouts
- **Mise en cache** : Réutilisation des résultats de matching
- **Indexation** : Index sur les slugs pour les recherches rapides
- **Logging détaillé** : Traçabilité complète du processus

## 🐛 Dépannage

### Problèmes courants

#### 1. Compétences non détectées
```bash
# Vérifiez la synchronisation
node scripts/verify-skills-sync.js

# Ajoutez les compétences manquantes
node scripts/production-skills-seed.js
```

#### 2. Faux positifs
- Vérifiez le filtrage contextuel dans `isSkillRelevantInListContext()`
- Ajustez les contextes de développement/non-développement

#### 3. Performance lente
- Vérifiez les index sur `skills.slug`
- Réduisez la taille des batches dans `parseAllOffers.js`

### Logs et debugging

```javascript
// Activez les logs détaillés
console.log('🔍 Parsing:', offerTitle);
console.log('✅ Compétences détectées:', skills.length);
```

## 🔒 Sécurité et bonnes pratiques

### Validation des données
- Sanitisation des entrées utilisateur
- Validation des slugs de compétences
- Gestion des erreurs de base de données

### Performance
- Utilisation de transactions pour les insertions en batch
- Gestion des conflits avec `ON CONFLICT DO NOTHING`
- Limitation des requêtes concurrentes

## 📚 Ressources supplémentaires

- **Schema de base** : `SUPABASE_SIMPLE_SETUP.sql`
- **Guide d'installation** : `scripts/PRODUCTION-SKILLS-SETUP.md`
- **Tests** : Utilisez `scripts/verify-skills-sync.js` pour valider

## 🤝 Contribution

### Ajout de nouvelles compétences
1. Identifiez les compétences manquantes via les logs
2. Ajoutez-les au dictionnaire `skillsKeywords`
3. Mettez à jour la base de données
4. Testez avec `verify-skills-sync.js`

### Amélioration du parsing
1. Analysez les faux positifs/négatifs
2. Ajustez les regex et le filtrage contextuel
3. Testez sur un échantillon d'offres
4. Déployez et surveillez les métriques

---

✅ **Le système de parsing des compétences est maintenant opérationnel et prêt pour la production !**
