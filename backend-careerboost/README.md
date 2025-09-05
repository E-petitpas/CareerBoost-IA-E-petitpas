# 🚀 API CareerBoost E-petitpas

API complète pour la plateforme de matching emploi avec IA CareerBoost E-petitpas.

## 📋 Table des matières

- [Installation](#installation)
- [Configuration](#configuration)
- [Démarrage](#démarrage)
- [Architecture](#architecture)
- [Endpoints](#endpoints)
- [Authentification](#authentification)
- [Tests](#tests)

## 🛠 Installation

```bash
# Cloner le projet
git clone <repository-url>
cd backend-careerboost

# Installer les dépendances
npm install
```

## ⚙️ Configuration

Créer un fichier `.env` à la racine du projet :

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Server Configuration
PORT=4000
NODE_ENV=development
```

## 🚀 Démarrage

```bash
# Mode développement
npm run dev

# Mode production
npm start
```

L'API sera accessible sur `http://localhost:4000`
Documentation Swagger : `http://localhost:4000/api-docs`

## 🏗 Architecture

### Structure des dossiers

```
backend-careerboost/
├── controllers/          # Logique métier
│   ├── authController.js
│   ├── usersController.js
│   ├── companiesController.js
│   ├── candidatesController.js
│   ├── skillsController.js
│   ├── jobOffersController.js
│   ├── applicationsController.js
│   └── adminController.js
├── routes/               # Définition des routes
│   ├── auth.js
│   ├── users.js
│   ├── companies.js
│   ├── candidates.js
│   ├── skills.js
│   ├── job-offers.js
│   ├── applications.js
│   └── admin.js
├── middleware/           # Middlewares
│   └── auth.js
├── config/              # Configuration
│   └── supabase.js
├── docs/                # Documentation
│   └── swagger.js
└── index.js             # Point d'entrée
```

### Base de données

L'API utilise Supabase (PostgreSQL) avec le schéma suivant :

- **users** : Utilisateurs (candidats, recruteurs, admins)
- **companies** : Entreprises
- **company_memberships** : Membres d'entreprises
- **candidate_profiles** : Profils candidats
- **educations** : Formations
- **experiences** : Expériences professionnelles
- **skills** : Référentiel de compétences
- **candidate_skills** : Compétences des candidats
- **job_offers** : Offres d'emploi
- **job_offer_skills** : Compétences requises pour les offres
- **applications** : Candidatures
- **application_events** : Timeline des candidatures
- **match_traces** : Traces du matching IA
- **notifications** : Notifications
- **documents** : Documents (CV/LM)
- **audit_logs** : Logs d'audit

## 🔗 Endpoints

### 🔐 Authentification (`/auth`)

- `POST /auth/register` - Inscription
- `POST /auth/login` - Connexion
- `POST /auth/verify-email` - Vérification email
- `POST /auth/logout` - Déconnexion
- `POST /auth/forgot-password` - Mot de passe oublié
- `POST /auth/reset-password` - Réinitialiser mot de passe

### 👥 Utilisateurs (`/users`)

- `GET /users` - Liste utilisateurs (admin)
- `GET /users/profile` - Mon profil
- `PUT /users/profile` - Modifier mon profil
- `GET /users/:id` - Utilisateur par ID (admin)
- `DELETE /users/account` - Supprimer mon compte

### 🏢 Entreprises (`/companies`)

- `POST /companies` - Créer entreprise
- `GET /companies` - Liste entreprises (admin)
- `GET /companies/:id` - Détails entreprise
- `PUT /companies/:id` - Modifier entreprise
- `PUT /companies/:id/validate` - Valider entreprise (admin)
- `GET /companies/:id/members` - Membres entreprise
- `POST /companies/:id/members` - Inviter membre

### 👨‍💼 Candidats (`/candidates`)

- `GET /candidates/profile` - Profil candidat
- `PUT /candidates/profile` - Modifier profil candidat
- `GET /candidates/educations` - Formations
- `POST /candidates/educations` - Ajouter formation
- `PUT /candidates/educations/:id` - Modifier formation
- `DELETE /candidates/educations/:id` - Supprimer formation
- `GET /candidates/experiences` - Expériences
- `POST /candidates/experiences` - Ajouter expérience
- `PUT /candidates/experiences/:id` - Modifier expérience
- `DELETE /candidates/experiences/:id` - Supprimer expérience
- `GET /candidates/skills` - Compétences candidat
- `POST /candidates/skills` - Ajouter compétence
- `DELETE /candidates/skills/:skillId` - Supprimer compétence

### 🎯 Compétences (`/skills`)

- `GET /skills` - Liste compétences
- `GET /skills/:id` - Compétence par ID
- `POST /skills` - Créer compétence (admin)
- `POST /skills/batch` - Créer compétences en lot (admin)
- `PUT /skills/:id` - Modifier compétence (admin)
- `DELETE /skills/:id` - Supprimer compétence (admin)

### 💼 Offres d'emploi (`/job-offers`)

- `POST /job-offers` - Créer offre
- `GET /job-offers/search` - Rechercher offres
- `GET /job-offers/my-company` - Offres de mon entreprise
- `GET /job-offers/:id` - Détails offre
- `PUT /job-offers/:id` - Modifier offre
- `DELETE /job-offers/:id` - Supprimer offre

### 📝 Candidatures (`/applications`)

- `POST /applications/apply` - Postuler
- `GET /applications/my-applications` - Mes candidatures
- `GET /applications/received` - Candidatures reçues
- `PUT /applications/:id/status` - Changer statut
- `GET /applications/:id/timeline` - Timeline candidature

### ⚙️ Administration (`/admin`)

- `GET /admin/dashboard` - Tableau de bord
- `GET /admin/companies/pending` - Entreprises en attente
- `GET /admin/audit-logs` - Logs d'audit
- `POST /admin/audit-logs` - Créer log d'audit
- `GET /admin/stats` - Statistiques détaillées
- `GET /admin/impact-report` - Rapport d'impact

## 🔒 Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification.

### Obtenir un token

```bash
POST /auth/login
{
  "email": "user@example.com",
  "password": "password"
}
```

### Utiliser le token

Ajouter le header `Authorization` à vos requêtes :

```
Authorization: Bearer <your_jwt_token>
```

### Rôles utilisateur

- **CANDIDATE** : Candidats
- **RECRUITER** : Recruteurs
- **ADMIN** : Administrateurs

## 🧪 Tests

Pour tester l'API, utilisez la documentation Swagger interactive :

1. Démarrer le serveur : `npm run dev`
2. Ouvrir : `http://localhost:4000/api-docs`
3. Utiliser l'interface Swagger pour tester les endpoints

### Exemple de test complet

1. **Inscription candidat** :
   ```json
   POST /auth/register
   {
     "role": "CANDIDATE",
     "name": "Jean Dupont",
     "email": "jean@example.com",
     "password": "password123",
     "city": "Paris"
   }
   ```

2. **Connexion** :
   ```json
   POST /auth/login
   {
     "email": "jean@example.com",
     "password": "password123"
   }
   ```

3. **Compléter profil candidat** :
   ```json
   PUT /candidates/profile
   {
     "title": "Développeur Full Stack",
     "summary": "Passionné par le développement web...",
     "experience_years": 3,
     "mobility_km": 50,
     "preferred_contracts": ["CDI", "CDD"]
   }
   ```

## 🔧 Fonctionnalités principales

### Matching IA
- Calcul automatique du score de compatibilité candidat/offre
- Analyse des compétences requises vs possédées
- Explication du score de matching

### Pipeline de recrutement
- Suivi des candidatures en temps réel
- Timeline des événements
- Changement de statut automatisé

### Administration
- Validation des entreprises
- Tableau de bord avec métriques
- Rapports d'impact pour les financeurs
- Logs d'audit complets

### Sécurité
- Authentification JWT
- Contrôle d'accès basé sur les rôles
- Validation des données
- Protection contre les injections SQL

## 📊 Métriques et Analytics

L'API fournit des métriques détaillées :
- Nombre d'utilisateurs inscrits
- Taux de conversion candidature → embauche
- Scores de matching moyens
- Évolution temporelle des inscriptions
- Top des compétences demandées

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou support :
- Email : support@careerboost.com
- Documentation : `http://localhost:4000/api-docs`
