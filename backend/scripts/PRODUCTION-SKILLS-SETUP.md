# 🚀 Guide d'initialisation des compétences en production

Ce guide vous explique comment initialiser la table `skills` en production avec toutes les compétences nécessaires pour le système de parsing de CareerBoost.

## 📋 Contenu des fichiers

### 1. `production-skills-seed.sql`
- **Type** : Script SQL pur
- **Contenu** : 170+ compétences organisées par catégories
- **Usage** : À exécuter directement dans l'interface SQL de Supabase ou via psql

### 2. `production-skills-seed.js`
- **Type** : Script Node.js
- **Contenu** : Même données avec gestion d'erreurs et statistiques
- **Usage** : À exécuter via Node.js avec les variables d'environnement

## 🎯 Compétences incluses

Le seed contient **170+ compétences** réparties dans **20 catégories** :

### 💻 Développement (42 compétences)
- **Langages** : Java, JavaScript, TypeScript, Python, PHP, C#, C++, Go, Rust, Kotlin, Swift, Dart
- **Frameworks Java** : Spring, Spring Boot, Hibernate, Struts, Quarkus, Jakarta EE, Java EE
- **Frontend** : React, Vue.js, Angular, Next.js, Nuxt.js, HTML5, CSS3
- **Backend** : Node.js, Express.js, NestJS, Django, Flask, Laravel, Ruby on Rails

### 🗄️ Bases de données (9 compétences)
PostgreSQL, MySQL, MongoDB, Redis, Elasticsearch, SQLite, Oracle, SQL Server, Cassandra

### ☁️ Cloud & DevOps (15 compétences)
Docker, Kubernetes, Jenkins, GitLab CI, GitHub Actions, AWS, Azure, GCP, Heroku, DigitalOcean, Git, Maven, Gradle, Eclipse, IntelliJ IDEA

### 🖥️ Systèmes (10 compétences)
Linux, Ubuntu, CentOS, Debian, Red Hat, Windows, Windows 10, Windows 11, Windows Server, macOS

### 🌐 Réseau (10 compétences)
TCP/IP, DNS, DHCP, VLAN, VPN, Firewall, Cisco, Juniper, Routing, Switching

### 🏗️ Infrastructure (4 compétences)
Active Directory, LDAP, GPO, Serveur d'impression

### ☁️ Virtualisation (6 compétences)
VMware, Hyper-V, VirtualBox, Citrix, XenApp, XenDesktop

### 📦 Déploiement (5 compétences)
SCCM, Microsoft Intune, MDT, WSUS, PowerShell

### 📊 ERP & CRM (10 compétences)
Sage X3, Microsoft Dynamics, Dynamics 365, Dynamics CRM/NAV/AX, ERP, CRM, SAP, Salesforce

### 🔧 ITSM (5 compétences)
GLPI, ServiceNow, BMC Remedy, Freshdesk, Zendesk

### 📈 Monitoring (5 compétences)
Nagios, Zabbix, Prometheus, Grafana, ELK Stack

### 🏭 Industriel (4 compétences)
SCADA, PLC, MES, DCS

### 📄 Bureautique (7 compétences)
Microsoft Office, Office 365, Teams, Outlook, Excel, Word, PowerPoint

### 🔒 Sécurité (5 compétences)
Antivirus, SSL/TLS, OAuth, JWT, IAM

### 📋 Méthodologies (5 compétences)
ITIL, Agile, Scrum, Kanban, DevOps

## 🚀 Méthodes d'installation

### Méthode 1 : Script SQL (Recommandée pour Supabase)

1. **Connectez-vous à votre interface Supabase**
2. **Allez dans l'éditeur SQL**
3. **Copiez le contenu de `production-skills-seed.sql`**
4. **Exécutez le script**

```sql
-- Le script s'exécute automatiquement avec :
-- - Insertion de toutes les compétences
-- - Gestion des doublons (ON CONFLICT DO NOTHING)
-- - Statistiques finales
-- - Message de confirmation
```

### Méthode 2 : Script Node.js (Recommandée pour développement)

1. **Configurez vos variables d'environnement**
```bash
# .env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. **Exécutez le script**
```bash
cd backend
node scripts/production-skills-seed.js
```

### Méthode 3 : Via psql (Pour PostgreSQL direct)

```bash
psql -h your_host -U your_user -d your_database -f scripts/production-skills-seed.sql
```

## 📊 Vérification post-installation

Après l'exécution, vous devriez voir :

```sql
-- Vérifier le nombre total
SELECT COUNT(*) FROM skills;
-- Résultat attendu : 170+

-- Vérifier les catégories
SELECT category, COUNT(*) as count 
FROM skills 
WHERE category IS NOT NULL 
GROUP BY category 
ORDER BY count DESC;
```

## 🔄 Mise à jour des compétences

Si vous devez ajouter de nouvelles compétences :

1. **Modifiez les fichiers de seed**
2. **Réexécutez le script** (les doublons seront ignorés)
3. **Ou ajoutez manuellement** :

```sql
INSERT INTO skills (slug, display_name, category) VALUES
  ('nouvelle-competence', 'Nouvelle Compétence', 'Catégorie')
ON CONFLICT (slug) DO NOTHING;
```

## ⚠️ Points d'attention

### Slugs uniques
- Chaque compétence a un `slug` unique (clé primaire)
- Format : lowercase, tirets, pas d'espaces
- Exemple : `microsoft-dynamics` pour "Microsoft Dynamics"

### Catégories standardisées
- Utilisez les catégories existantes pour la cohérence
- Nouvelles catégories : ajoutez-les de manière réfléchie

### Synchronisation avec le parsing
- Ces compétences DOIVENT correspondre au dictionnaire dans `skillsParsingService.js`
- Toute modification doit être répercutée dans les deux endroits

## 🧪 Test du système

Après l'installation, testez le parsing :

```bash
# Testez le parsing sur quelques offres
node scripts/analyzeSpecificOffers.js

# Vérifiez les statistiques
node scripts/checkProgress.js
```

## 📞 Support

En cas de problème :
1. Vérifiez les logs d'erreur
2. Confirmez la structure de la table `skills`
3. Vérifiez les permissions Supabase
4. Contactez l'équipe de développement

---

✅ **Une fois ce seed exécuté, votre système de parsing sera opérationnel avec toutes les compétences nécessaires !**
