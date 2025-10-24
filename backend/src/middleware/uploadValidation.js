const multer = require('multer');
const path = require('path');

/**
 * Middleware de validation pour les uploads de fichiers
 */

// Configuration des types de fichiers autorisés
const ALLOWED_MIME_TYPES = {
  CV: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  IMAGE: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
};

// Tailles maximales par type de fichier (en bytes)
const MAX_FILE_SIZES = {
  CV: 10 * 1024 * 1024, // 10MB
  IMAGE: 5 * 1024 * 1024, // 5MB
  DEFAULT: 10 * 1024 * 1024 // 10MB
};

/**
 * Valide le type MIME d'un fichier
 * @param {string} mimetype - Type MIME du fichier
 * @param {string} fileType - Type de fichier attendu (CV, IMAGE, etc.)
 * @returns {boolean}
 */
const isValidMimeType = (mimetype, fileType = 'CV') => {
  const allowedTypes = ALLOWED_MIME_TYPES[fileType] || ALLOWED_MIME_TYPES.CV;
  return allowedTypes.includes(mimetype);
};

/**
 * Valide la taille d'un fichier
 * @param {number} size - Taille du fichier en bytes
 * @param {string} fileType - Type de fichier
 * @returns {boolean}
 */
const isValidFileSize = (size, fileType = 'CV') => {
  const maxSize = MAX_FILE_SIZES[fileType] || MAX_FILE_SIZES.DEFAULT;
  return size <= maxSize;
};

/**
 * Génère un nom de fichier sécurisé
 * @param {string} originalName - Nom original du fichier
 * @param {string} userId - ID de l'utilisateur
 * @param {string} prefix - Préfixe pour le nom de fichier
 * @returns {string}
 */
const generateSecureFilename = (originalName, userId, prefix = 'file') => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const extension = path.extname(originalName).toLowerCase();
  
  // Nettoyer le nom original
  const cleanName = path.basename(originalName, extension)
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 50);
  
  return `${prefix}-${userId}-${timestamp}-${random}-${cleanName}${extension}`;
};

/**
 * Middleware de validation pour les uploads de CV
 */
const validateCVUpload = (req, file, cb) => {
  try {
    // Vérifier le type MIME
    if (!isValidMimeType(file.mimetype, 'CV')) {
      const error = new Error('Type de fichier non supporté. Seuls PDF, DOC et DOCX sont acceptés.');
      error.code = 'INVALID_FILE_TYPE';
      return cb(error, false);
    }

    // Le fichier est valide
    cb(null, true);
  } catch (error) {
    console.error('Erreur validation upload:', error);
    cb(new Error('Erreur lors de la validation du fichier'), false);
  }
};

/**
 * Middleware de validation de taille de fichier
 */
const validateFileSize = (fileType = 'CV') => {
  return (req, res, next) => {
    const maxSize = MAX_FILE_SIZES[fileType] || MAX_FILE_SIZES.DEFAULT;
    
    // Vérifier la taille si le fichier est présent
    if (req.file && !isValidFileSize(req.file.size, fileType)) {
      const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);
      const fileSizeMB = (req.file.size / 1024 / 1024).toFixed(1);
      
      return res.status(400).json({
        error: 'Fichier trop volumineux',
        details: `Taille du fichier: ${fileSizeMB}MB. Taille maximale autorisée: ${maxSizeMB}MB.`,
        code: 'FILE_TOO_LARGE'
      });
    }
    
    next();
  };
};

/**
 * Middleware de validation générale des uploads
 */
const validateUpload = (options = {}) => {
  const {
    fileType = 'CV',
    required = true,
    fieldName = 'file'
  } = options;

  return (req, res, next) => {
    // Vérifier si le fichier est requis
    if (required && !req.file) {
      return res.status(400).json({
        error: 'Fichier manquant',
        details: `Le champ '${fieldName}' est requis.`,
        code: 'MISSING_FILE'
      });
    }

    // Si pas de fichier et pas requis, continuer
    if (!req.file) {
      return next();
    }

    // Valider le type MIME
    if (!isValidMimeType(req.file.mimetype, fileType)) {
      return res.status(400).json({
        error: 'Type de fichier non supporté',
        details: `Types acceptés: ${ALLOWED_MIME_TYPES[fileType].join(', ')}`,
        code: 'INVALID_FILE_TYPE'
      });
    }

    // Valider la taille
    if (!isValidFileSize(req.file.size, fileType)) {
      const maxSizeMB = (MAX_FILE_SIZES[fileType] / 1024 / 1024).toFixed(1);
      return res.status(400).json({
        error: 'Fichier trop volumineux',
        details: `Taille maximale autorisée: ${maxSizeMB}MB`,
        code: 'FILE_TOO_LARGE'
      });
    }

    // Ajouter des métadonnées utiles
    req.fileValidation = {
      isValid: true,
      fileType,
      originalSize: req.file.size,
      sizeMB: (req.file.size / 1024 / 1024).toFixed(2)
    };

    next();
  };
};

/**
 * Gestionnaire d'erreurs pour multer
 */
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          error: 'Fichier trop volumineux',
          details: 'La taille du fichier dépasse la limite autorisée.',
          code: 'FILE_TOO_LARGE'
        });
      
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          error: 'Trop de fichiers',
          details: 'Nombre maximum de fichiers dépassé.',
          code: 'TOO_MANY_FILES'
        });
      
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          error: 'Champ de fichier inattendu',
          details: 'Le champ de fichier fourni n\'est pas attendu.',
          code: 'UNEXPECTED_FIELD'
        });
      
      default:
        return res.status(400).json({
          error: 'Erreur d\'upload',
          details: error.message,
          code: 'UPLOAD_ERROR'
        });
    }
  }

  // Erreurs personnalisées
  if (error.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      error: 'Type de fichier non supporté',
      details: error.message,
      code: 'INVALID_FILE_TYPE'
    });
  }

  // Autres erreurs
  next(error);
};

/**
 * Utilitaires pour les validations côté client
 */
const getValidationRules = (fileType = 'CV') => {
  return {
    allowedTypes: ALLOWED_MIME_TYPES[fileType] || ALLOWED_MIME_TYPES.CV,
    maxSize: MAX_FILE_SIZES[fileType] || MAX_FILE_SIZES.DEFAULT,
    maxSizeMB: ((MAX_FILE_SIZES[fileType] || MAX_FILE_SIZES.DEFAULT) / 1024 / 1024).toFixed(1)
  };
};

module.exports = {
  validateCVUpload,
  validateFileSize,
  validateUpload,
  handleMulterError,
  generateSecureFilename,
  isValidMimeType,
  isValidFileSize,
  getValidationRules,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZES
};
