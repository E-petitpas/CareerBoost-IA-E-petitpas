const supabase = require("../config/supabase");

// 🔹 GET Profil candidat
exports.getCandidateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Récupérer le profil candidat avec les relations
    const { data: profile, error } = await supabase
      .from("candidate_profiles")
      .select(`
        *,
        users:user_id (
          id, name, email, phone, city, latitude, longitude
        )
      `)
      .eq("user_id", userId)
      .single();
    
    if (error && error.code !== "PGRST116") { // PGRST116 = pas de résultat
      return res.status(400).json({ error: error.message });
    }
    
    // Si pas de profil candidat, créer un profil vide
    if (!profile) {
      const { data: newProfile, error: createError } = await supabase
        .from("candidate_profiles")
        .insert([{ user_id: userId }])
        .select(`
          *,
          users:user_id (
            id, name, email, phone, city, latitude, longitude
          )
        `)
        .single();
      
      if (createError) {
        return res.status(400).json({ error: createError.message });
      }
      
      return res.json(newProfile);
    }
    
    res.json(profile);
    
  } catch (err) {
    console.error("Erreur récupération profil candidat:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 PUT Mettre à jour le profil candidat
exports.updateCandidateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      title, 
      summary, 
      experience_years, 
      mobility_km, 
      preferred_contracts 
    } = req.body;
    
    const updateData = {
      title,
      summary,
      experience_years,
      mobility_km,
      preferred_contracts,
      updated_at: new Date().toISOString()
    };
    
    // Supprimer les champs undefined
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );
    
    const { data, error } = await supabase
      .from("candidate_profiles")
      .upsert({ user_id: userId, ...updateData })
      .select(`
        *,
        users:user_id (
          id, name, email, phone, city, latitude, longitude
        )
      `)
      .single();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json(data);
    
  } catch (err) {
    console.error("Erreur mise à jour profil candidat:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 GET Formations du candidat
exports.getEducations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { data, error } = await supabase
      .from("educations")
      .select("*")
      .eq("user_id", userId)
      .order("start_date", { ascending: false });
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json(data);
    
  } catch (err) {
    console.error("Erreur récupération formations:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 POST Ajouter une formation
exports.createEducation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { school, degree, field, start_date, end_date, description } = req.body;
    
    if (!school) {
      return res.status(400).json({ error: "Le champ school est requis" });
    }
    
    const educationData = {
      user_id: userId,
      school,
      degree,
      field,
      start_date,
      end_date,
      description
    };
    
    const { data, error } = await supabase
      .from("educations")
      .insert([educationData])
      .select()
      .single();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(201).json(data);
    
  } catch (err) {
    console.error("Erreur création formation:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 PUT Modifier une formation
exports.updateEducation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { school, degree, field, start_date, end_date, description } = req.body;
    
    const updateData = {
      school,
      degree,
      field,
      start_date,
      end_date,
      description
    };
    
    // Supprimer les champs undefined
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );
    
    const { data, error } = await supabase
      .from("educations")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    if (!data) {
      return res.status(404).json({ error: "Formation non trouvée" });
    }
    
    res.json(data);
    
  } catch (err) {
    console.error("Erreur modification formation:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 DELETE Supprimer une formation
exports.deleteEducation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const { error } = await supabase
      .from("educations")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json({ message: "Formation supprimée avec succès" });
    
  } catch (err) {
    console.error("Erreur suppression formation:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 GET Expériences du candidat
exports.getExperiences = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { data, error } = await supabase
      .from("experiences")
      .select("*")
      .eq("user_id", userId)
      .order("start_date", { ascending: false });
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json(data);
    
  } catch (err) {
    console.error("Erreur récupération expériences:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 POST Ajouter une expérience
exports.createExperience = async (req, res) => {
  try {
    const userId = req.user.id;
    const { company, role_title, start_date, end_date, description } = req.body;
    
    if (!company || !role_title) {
      return res.status(400).json({ 
        error: "Les champs company et role_title sont requis" 
      });
    }
    
    const experienceData = {
      user_id: userId,
      company,
      role_title,
      start_date,
      end_date,
      description
    };
    
    const { data, error } = await supabase
      .from("experiences")
      .insert([experienceData])
      .select()
      .single();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(201).json(data);
    
  } catch (err) {
    console.error("Erreur création expérience:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 PUT Modifier une expérience
exports.updateExperience = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { company, role_title, start_date, end_date, description } = req.body;
    
    const updateData = {
      company,
      role_title,
      start_date,
      end_date,
      description
    };
    
    // Supprimer les champs undefined
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );
    
    const { data, error } = await supabase
      .from("experiences")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    if (!data) {
      return res.status(404).json({ error: "Expérience non trouvée" });
    }
    
    res.json(data);
    
  } catch (err) {
    console.error("Erreur modification expérience:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 DELETE Supprimer une expérience
exports.deleteExperience = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { error } = await supabase
      .from("experiences")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Expérience supprimée avec succès" });

  } catch (err) {
    console.error("Erreur suppression expérience:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 GET Compétences du candidat
exports.getCandidateSkills = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from("candidate_skills")
      .select(`
        proficiency_level,
        last_used_on,
        skills:skill_id (
          id,
          slug,
          display_name
        )
      `)
      .eq("candidate_user_id", userId)
      .order("proficiency_level", { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);

  } catch (err) {
    console.error("Erreur récupération compétences candidat:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 POST Ajouter une compétence au candidat
exports.addCandidateSkill = async (req, res) => {
  try {
    const userId = req.user.id;
    const { skill_id, proficiency_level, last_used_on } = req.body;

    if (!skill_id) {
      return res.status(400).json({ error: "Le champ skill_id est requis" });
    }

    // Vérifier que la compétence existe
    const { data: skill, error: skillError } = await supabase
      .from("skills")
      .select("id")
      .eq("id", skill_id)
      .single();

    if (skillError || !skill) {
      return res.status(404).json({ error: "Compétence non trouvée" });
    }

    const skillData = {
      candidate_user_id: userId,
      skill_id,
      proficiency_level,
      last_used_on
    };

    const { data, error } = await supabase
      .from("candidate_skills")
      .upsert(skillData)
      .select(`
        proficiency_level,
        last_used_on,
        skills:skill_id (
          id,
          slug,
          display_name
        )
      `)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data);

  } catch (err) {
    console.error("Erreur ajout compétence candidat:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 DELETE Supprimer une compétence du candidat
exports.removeCandidateSkill = async (req, res) => {
  try {
    const userId = req.user.id;
    const { skillId } = req.params;

    const { error } = await supabase
      .from("candidate_skills")
      .delete()
      .eq("candidate_user_id", userId)
      .eq("skill_id", skillId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Compétence supprimée avec succès" });

  } catch (err) {
    console.error("Erreur suppression compétence candidat:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
