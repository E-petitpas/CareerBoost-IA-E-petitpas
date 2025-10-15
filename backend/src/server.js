const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const candidateRoutes = require('./routes/candidate');
const recruiterRoutes = require('./routes/recruiter');
const adminRoutes = require('./routes/admin');
const adminOffersRoutes = require('./routes/adminOffers');
const offerRoutes = require('./routes/offers');
const applicationRoutes = require('./routes/applications');
const notificationRoutes = require('./routes/notifications');
const skillsRoutes = require('./routes/skills');

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
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/applications', authenticateToken, applicationRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/skills', skillsRoutes);

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`📊 Environnement: ${process.env.NODE_ENV}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);

    // Démarrer la synchronisation automatique des offres France Travail
    if (process.env.FRANCE_TRAVAIL_SYNC_ENABLED === 'true') {
      console.log('🇫🇷 Démarrage de la synchronisation France Travail...');
      offerAggregationService.startAutoSync();
    }
  });
}

module.exports = app;
