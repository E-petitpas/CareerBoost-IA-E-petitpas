const supabase = require("../config/supabase");

// 🔹 GET Toutes les compétences (référentiel)
exports.getSkills = async (req, res) => {
  try {
    const { search, limit = 100, offset = 0 } = req.query;
    
    let query = supabase
      .from("skills")
      .select("id, slug, display_name")
      .range(offset, offset + limit - 1)
      .order("display_name", { ascending: true });
    
    // Recherche textuelle si spécifiée
    if (search) {
      query = query.or(`slug.ilike.%${search}%, display_name.ilike.%${search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json(data);
    
  } catch (err) {
    console.error("Erreur récupération compétences:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 GET Une compétence par ID
exports.getSkillById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from("skills")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error || !data) {
      return res.status(404).json({ error: "Compétence non trouvée" });
    }
    
    res.json(data);
    
  } catch (err) {
    console.error("Erreur récupération compétence:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 POST Créer une nouvelle compétence (admin seulement)
exports.createSkill = async (req, res) => {
  try {
    const { slug, display_name } = req.body;
    
    if (!slug || !display_name) {
      return res.status(400).json({ 
        error: "Les champs slug et display_name sont requis" 
      });
    }
    
    // Vérifier que le slug n'existe pas déjà
    const { data: existingSkill } = await supabase
      .from("skills")
      .select("id")
      .eq("slug", slug.toLowerCase())
      .single();
    
    if (existingSkill) {
      return res.status(409).json({ error: "Ce slug existe déjà" });
    }
    
    const skillData = {
      slug: slug.toLowerCase(),
      display_name
    };
    
    const { data, error } = await supabase
      .from("skills")
      .insert([skillData])
      .select()
      .single();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(201).json(data);
    
  } catch (err) {
    console.error("Erreur création compétence:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 PUT Modifier une compétence (admin seulement)
exports.updateSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const { slug, display_name } = req.body;
    
    const updateData = {
      slug: slug ? slug.toLowerCase() : undefined,
      display_name
    };
    
    // Supprimer les champs undefined
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );
    
    // Si on modifie le slug, vérifier qu'il n'existe pas déjà
    if (updateData.slug) {
      const { data: existingSkill } = await supabase
        .from("skills")
        .select("id")
        .eq("slug", updateData.slug)
        .neq("id", id)
        .single();
      
      if (existingSkill) {
        return res.status(409).json({ error: "Ce slug existe déjà" });
      }
    }
    
    const { data, error } = await supabase
      .from("skills")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    if (!data) {
      return res.status(404).json({ error: "Compétence non trouvée" });
    }
    
    res.json(data);
    
  } catch (err) {
    console.error("Erreur modification compétence:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 DELETE Supprimer une compétence (admin seulement)
exports.deleteSkill = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier qu'aucun candidat n'utilise cette compétence
    const { data: candidateSkills } = await supabase
      .from("candidate_skills")
      .select("candidate_user_id")
      .eq("skill_id", id)
      .limit(1);
    
    if (candidateSkills && candidateSkills.length > 0) {
      return res.status(409).json({ 
        error: "Impossible de supprimer cette compétence car elle est utilisée par des candidats" 
      });
    }
    
    // Vérifier qu'aucune offre n'utilise cette compétence
    const { data: jobOfferSkills } = await supabase
      .from("job_offer_skills")
      .select("job_offer_id")
      .eq("skill_id", id)
      .limit(1);
    
    if (jobOfferSkills && jobOfferSkills.length > 0) {
      return res.status(409).json({ 
        error: "Impossible de supprimer cette compétence car elle est utilisée par des offres d'emploi" 
      });
    }
    
    const { error } = await supabase
      .from("skills")
      .delete()
      .eq("id", id);
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json({ message: "Compétence supprimée avec succès" });
    
  } catch (err) {
    console.error("Erreur suppression compétence:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 POST Créer plusieurs compétences en lot (admin seulement)
exports.createSkillsBatch = async (req, res) => {
  try {
    const { skills } = req.body;
    
    if (!Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ 
        error: "Le champ skills doit être un tableau non vide" 
      });
    }
    
    // Valider chaque compétence
    for (const skill of skills) {
      if (!skill.slug || !skill.display_name) {
        return res.status(400).json({ 
          error: "Chaque compétence doit avoir un slug et un display_name" 
        });
      }
    }
    
    // Préparer les données
    const skillsData = skills.map(skill => ({
      slug: skill.slug.toLowerCase(),
      display_name: skill.display_name
    }));
    
    const { data, error } = await supabase
      .from("skills")
      .insert(skillsData)
      .select();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(201).json({
      message: `${data.length} compétences créées avec succès`,
      skills: data
    });
    
  } catch (err) {
    console.error("Erreur création compétences en lot:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
