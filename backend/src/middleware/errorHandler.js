const errorHandler = (err, req, res, next) => {
  console.error('Erreur:', err);

  // Erreur de validation Joi
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Données invalides',
      details: err.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token invalide' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expiré' });
  }

  // Erreur Supabase
  if (err.code) {
    switch (err.code) {
      case '23505': // Violation de contrainte unique
        return res.status(409).json({ 
          error: 'Conflit de données',
          message: 'Cette ressource existe déjà'
        });
      case '23503': // Violation de clé étrangère
        return res.status(400).json({ 
          error: 'Référence invalide',
          message: 'La ressource référencée n\'existe pas'
        });
      case '23514': // Violation de contrainte de vérification
        return res.status(400).json({ 
          error: 'Données invalides',
          message: 'Les données ne respectent pas les contraintes'
        });
      default:
        console.error('Erreur base de données:', err);
        return res.status(500).json({ error: 'Erreur de base de données' });
    }
  }

  // Erreur de fichier trop volumineux
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ 
      error: 'Fichier trop volumineux',
      message: 'La taille du fichier dépasse la limite autorisée'
    });
  }

  // Erreur par défaut
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Erreur interne du serveur';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  asyncHandler
};
