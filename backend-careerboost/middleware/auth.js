const jwt = require("jsonwebtoken");
const supabase = require("../config/supabase");

// 🔹 Middleware d'authentification
exports.authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; 
    
    if (!token) {
      return res.status(401).json({ error: "Token d'accès requis" });
    }
    
    // Vérifier le token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    
    // Vérifier que l'utilisateur existe toujours
    const { data: user, error } = await supabase
      .from("users")
      .select("id, role, email, verified")
      .eq("id", decoded.id)
      .is("deleted_at", null)
      .single();
    
    if (error || !user) {
      return res.status(401).json({ error: "Utilisateur non trouvé" });
    }
    
    // Ajouter les infos utilisateur à la requête
    req.user = user;
    next();
    
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Token invalide" });
    }
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expiré" });
    }
    console.error("Erreur authentification:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 Middleware de vérification des rôles
exports.requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentification requise" });
    }
    
    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: `Accès refusé. Rôles autorisés: ${allowedRoles.join(", ")}` 
      });
    }
    
    next();
  };
};

// 🔹 Middleware pour vérifier que l'email est vérifié
exports.requireVerifiedEmail = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentification requise" });
  }
  
  if (!req.user.verified) {
    return res.status(403).json({ 
      error: "Email non vérifié. Veuillez vérifier votre email avant de continuer." 
    });
  }
  
  next();
};

// 🔹 Middleware optionnel (utilisateur connecté ou non)
exports.optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    
    if (!token) {
      req.user = null;
      return next();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    
    const { data: user, error } = await supabase
      .from("users")
      .select("id, role, email, verified")
      .eq("id", decoded.id)
      .is("deleted_at", null)
      .single();
    
    req.user = error ? null : user;
    next();
    
  } catch (err) {
    req.user = null;
    next();
  }
};
