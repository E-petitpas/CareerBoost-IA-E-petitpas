# CareerBoost E-petitpas - Backend API

API REST pour la plateforme de recrutement CareerBoost E-petitpas.

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+ 
- npm ou yarn
- Base de données Supabase configurée

### Installation

1. Installer les dépendances :
```bash
npm install
```

2. Configurer les variables d'environnement :
```bash
cp .env.example .env
# Éditer le fichier .env avec vos configurations
```

3. Initialiser la base de données :
```bash
npm run init
```

4. Démarrer le serveur de développement :
```bash
npm run dev
```

L'API sera accessible sur `http://localhost:3001`

## 📁 Structure du projet

```
src/
├── config/          # Configuration (Supabase, etc.)
├── middleware/      # Middlewares Express
├── routes/          # Routes de l'API
├── services/        # Services métier
├── utils/           # Utilitaires
├── scripts/         # Scripts d'initialisation
└── server.js        # Point d'entrée
```

## 🔐 Authentification

L'API utilise JWT pour l'authentification. Incluez le token dans l'en-tête :
```
Authorization: Bearer <token>
```

## 📚 Endpoints principaux

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/verify` - Vérification du token

### Candidats
- `GET /api/candidate/profile` - Profil candidat
- `PUT /api/candidate/profile` - Mise à jour profil
- `POST /api/candidate/educations` - Ajouter formation
- `POST /api/candidate/experiences` - Ajouter expérience

### Recruteurs
- `GET /api/recruiter/dashboard` - Tableau de bord
- `GET /api/recruiter/companies/:id/offers` - Offres de l'entreprise
- `GET /api/recruiter/offers/:id/applications` - Candidatures

### Offres d'emploi
- `GET /api/offers/search` - Rechercher offres
- `GET /api/offers/:id` - Détail offre
- `POST /api/offers` - Créer offre (recruteurs)

### Candidatures
- `POST /api/applications/apply` - Postuler
- `GET /api/applications/my-applications` - Mes candidatures
- `PATCH /api/applications/:id/status` - Changer statut

### Compétences
- `GET /api/skills/search` - Rechercher compétences
- `GET /api/skills` - Toutes les compétences
- `POST /api/skills` - Créer compétence

### Notifications
- `GET /api/notifications` - Mes notifications
- `PATCH /api/notifications/:id/read` - Marquer comme lu

### Admin
- `GET /api/admin/dashboard` - Dashboard admin
- `GET /api/admin/companies/pending` - Entreprises en attente
- `PATCH /api/admin/companies/:id/status` - Valider entreprise

## 🛠️ Scripts disponibles

- `npm start` - Démarrer en production
- `npm run dev` - Démarrer en développement
- `npm run init` - Initialiser la base de données
- `npm test` - Lancer les tests
- `npm run test:watch` - Tests en mode watch

## 🔧 Configuration

### Variables d'environnement

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Serveur
PORT=3001
NODE_ENV=development
JWT_SECRET=your_jwt_secret

# OpenAI (pour le matching IA)
OPENAI_API_KEY=your_openai_key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
```

## 🧪 Tests

```bash
# Lancer tous les tests
npm test

# Tests en mode watch
npm run test:watch
```

## 📦 Déploiement

1. Configurer les variables d'environnement de production
2. Construire l'application :
```bash
npm run build
```
3. Démarrer :
```bash
npm start
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.
