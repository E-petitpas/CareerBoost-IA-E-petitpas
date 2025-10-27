const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const candidateRoutes = require('./routes/candidate');
const recruiterRoutes = require('./routes/recruiter');
const adminRoutes = require('./routes/admin');
const adminOffersRoutes = require('./routes/adminOffers');
const adminCompaniesRoutes = require('./routes/adminCompanies');
const offerRoutes = require('./routes/offers');
const applicationRoutes = require('./routes/applications');
const notificationRoutes = require('./routes/notifications');
const skillsRoutes = require('./routes/skills');
const companiesRoutes = require('./routes/companies');
const cvAnalysisRoutes = require('./routes/cvAnalysis');

// Services
const offerAggregationService = require('./services/offerAggregationService');

const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting (désactivé en développement)
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
  });
  app.use(limiter);
}

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Routes (ordre important : routes spécifiques avant routes générales)
app.use('/api/auth', authRoutes);
app.use('/api/candidate', authenticateToken, candidateRoutes);
app.use('/api/recruiter', authenticateToken, recruiterRoutes);
app.use('/api/admin/offers', adminOffersRoutes); // Route spécifique AVANT /api/admin
app.use('/api/admin/companies', authenticateToken, adminCompaniesRoutes); // Route spécifique AVANT /api/admin
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/companies', authenticateToken, companiesRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/applications', authenticateToken, applicationRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/cv-analysis', authenticateToken, cvAnalysisRoutes);


// Static files for uploads with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Permettre toutes les origines pour les images
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');

  // ✅ Permettre l’affichage en iframe
  res.header('X-Frame-Options', 'ALLOWALL');

  // ✅ Optionnel : certains navigateurs exigent aussi ce header
  res.header('Content-Security-Policy', "frame-ancestors *");

  // Log pour déboguer
  console.log(`📁 Static file request: ${req.method} ${req.url} from ${req.get('Origin') || 'direct'}`);

  next();
}, express.static(path.join(__dirname, '..', 'uploads')));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`📊 Environnement: ${process.env.NODE_ENV}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);

    // Démarrer la synchronisation automatique des offres France Travail
    if (process.env.FRANCE_TRAVAIL_SYNC_ENABLED === 'true') {
      console.log('🇫🇷 Démarrage de la synchronisation France Travail...');
      offerAggregationService.startAutoSync();
    }
  });

  // Configurer le timeout du serveur pour les requêtes longues (analyse CV)
  server.timeout = 120000; // 2 minutes
}

module.exports = app;
