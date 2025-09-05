const supabase = require("../config/supabase");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// 🔹 POST Inscription utilisateur
exports.register = async (req, res) => {
  try {
    const { role, name, email, phone, password, city, latitude, longitude } = req.body;
    
    // Validation des champs requis
    if (!role || !name || !email || !password) {
      return res.status(400).json({ 
        error: "Les champs role, name, email et password sont requis" 
      });
    }
    
    // Vérifier si l'email existe déjà
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .is("deleted_at", null)
      .single();
    
    if (existingUser) {
      return res.status(409).json({ error: "Cet email est déjà utilisé" });
    }
    
    // Hasher le mot de passe
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    // Créer l'utilisateur
    const userData = {
      role: role.toUpperCase(),
      name,
      email: email.toLowerCase(),
      phone,
      password_hash,
      city,
      latitude,
      longitude,
      verified: false
    };
    
    const { data, error } = await supabase
      .from("users")
      .insert([userData])
      .select("id, role, name, email, phone, verified, city, created_at");
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    // Générer un token JWT
    const token = jwt.sign(
      { id: data[0].id, email: data[0].email, role: data[0].role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );
    
    res.status(201).json({
      message: "Inscription réussie",
      user: data[0],
      token
    });
    
  } catch (err) {
    console.error("Erreur inscription:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 POST Connexion utilisateur
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: "Email et mot de passe requis" 
      });
    }
    
    // Récupérer l'utilisateur
    const { data: user, error } = await supabase
      .from("users")
      .select("id, role, name, email, password_hash, verified")
      .eq("email", email.toLowerCase())
      .is("deleted_at", null)
      .single();
    
    if (error || !user) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }
    
    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }
    
    // Générer un token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );
    
    // Retourner les données sans le hash du mot de passe
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({
      message: "Connexion réussie",
      user: userWithoutPassword,
      token
    });
    
  } catch (err) {
    console.error("Erreur connexion:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 POST Vérification email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: "Token de vérification requis" });
    }
    
    // Ici vous pourriez décoder un token de vérification spécifique
    // Pour l'exemple, on utilise le token JWT standard
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    
    const { error } = await supabase
      .from("users")
      .update({ verified: true })
      .eq("id", decoded.id);
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json({ message: "Email vérifié avec succès" });
    
  } catch (err) {
    res.status(400).json({ error: "Token invalide ou expiré" });
  }
};

// 🔹 POST Déconnexion (côté client principalement)
exports.logout = async (req, res) => {
  // Dans une vraie app, vous pourriez blacklister le token
  res.json({ message: "Déconnexion réussie" });
};

// 🔹 POST Mot de passe oublié
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email requis" });
    }
    
    // Vérifier si l'utilisateur existe
    const { data: user } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email.toLowerCase())
      .is("deleted_at", null)
      .single();
    
    if (!user) {
      // Pour la sécurité, on ne révèle pas si l'email existe
      return res.json({ message: "Si cet email existe, un lien de réinitialisation a été envoyé" });
    }
    
    // Générer un token de réinitialisation
    const resetToken = jwt.sign(
      { id: user.id, email: user.email, type: "password_reset" },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "1h" }
    );
    
    // Ici vous enverriez un email avec le token
    console.log(`Token de réinitialisation pour ${email}: ${resetToken}`);
    
    res.json({ message: "Si cet email existe, un lien de réinitialisation a été envoyé" });
    
  } catch (err) {
    console.error("Erreur mot de passe oublié:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 POST Réinitialiser mot de passe
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token et nouveau mot de passe requis" });
    }
    
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    
    if (decoded.type !== "password_reset") {
      return res.status(400).json({ error: "Token invalide" });
    }
    
    // Hasher le nouveau mot de passe
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);
    
    const { error } = await supabase
      .from("users")
      .update({ password_hash })
      .eq("id", decoded.id);
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json({ message: "Mot de passe réinitialisé avec succès" });
    
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(400).json({ error: "Token invalide ou expiré" });
    }
    console.error("Erreur réinitialisation:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
