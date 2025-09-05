const supabase = require("../config/supabase");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// 🔹 GET tous les utilisateurs (admin seulement)
exports.getUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, role, name, email, phone, verified, city, created_at")
      .is("deleted_at", null);

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 GET un utilisateur par ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("users")
      .select("id, role, name, email, phone, verified, city, latitude, longitude, created_at")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error) return res.status(404).json({ error: "Utilisateur non trouvé" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 GET profil utilisateur connecté
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Depuis le middleware d'auth
    const { data, error } = await supabase
      .from("users")
      .select("id, role, name, email, phone, verified, city, latitude, longitude, created_at")
      .eq("id", userId)
      .is("deleted_at", null)
      .single();

    if (error) return res.status(404).json({ error: "Profil non trouvé" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 PUT mettre à jour le profil utilisateur
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, city, latitude, longitude } = req.body;

    const updateData = {
      name,
      phone,
      city,
      latitude,
      longitude,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .is("deleted_at", null)
      .select("id, role, name, email, phone, verified, city, latitude, longitude, updated_at");

    if (error) return res.status(400).json({ error: error.message });
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 DELETE supprimer le compte utilisateur (soft delete)
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    const { error } = await supabase
      .from("users")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Compte supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};