const supabase = require("../config/supabase");

// 🔹 POST Créer une offre d'emploi
exports.createJobOffer = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      description,
      city,
      latitude,
      longitude,
      contract_type,
      experience_min,
      salary_min,
      salary_max,
      currency = "EUR",
      required_skills = [],
      preferred_skills = []
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        error: "Les champs title et description sont requis"
      });
    }

    // Vérifier que l'utilisateur appartient à une entreprise validée
    const { data: membership } = await supabase
      .from("company_memberships")
      .select(`
        company_id,
        companies:company_id (
          id, name, status
        )
      `)
      .eq("user_id", userId)
      .is("removed_at", null)
      .single();

    if (!membership || membership.companies.status !== "VERIFIED") {
      return res.status(403).json({
        error: "Vous devez appartenir à une entreprise validée pour publier une offre"
      });
    }

    // Créer l'offre
    const offerData = {
      company_id: membership.company_id,
      title,
      description,
      city,
      latitude,
      longitude,
      contract_type,
      experience_min,
      salary_min,
      salary_max,
      currency,
      source: "INTERNAL",
      status: "ACTIVE"
    };

    const { data: offer, error: offerError } = await supabase
      .from("job_offers")
      .insert([offerData])
      .select()
      .single();

    if (offerError) {
      return res.status(400).json({ error: offerError.message });
    }

    // Ajouter les compétences requises
    if (required_skills.length > 0) {
      const requiredSkillsData = required_skills.map(skillId => ({
        job_offer_id: offer.id,
        skill_id: skillId,
        is_required: true,
        weight: 2
      }));

      await supabase
        .from("job_offer_skills")
        .insert(requiredSkillsData);
    }

    // Ajouter les compétences souhaitées
    if (preferred_skills.length > 0) {
      const preferredSkillsData = preferred_skills.map(skillId => ({
        job_offer_id: offer.id,
        skill_id: skillId,
        is_required: false,
        weight: 1
      }));

      await supabase
        .from("job_offer_skills")
        .insert(preferredSkillsData);
    }

    res.status(201).json({
      message: "Offre d'emploi créée avec succès",
      offer
    });

  } catch (err) {
    console.error("Erreur création offre:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 GET Rechercher des offres d'emploi
exports.searchJobOffers = async (req, res) => {
  try {
    const {
      search,
      city,
      contract_type,
      experience_min,
      salary_min,
      skills,
      limit = 20,
      offset = 0
    } = req.query;

    let query = supabase
      .from("job_offers")
      .select(`
        id,
        title,
        description,
        city,
        latitude,
        longitude,
        contract_type,
        experience_min,
        salary_min,
        salary_max,
        currency,
        published_at,
        companies:company_id (
          id,
          name,
          logo_url
        )
      `)
      .eq("status", "ACTIVE")
      .range(offset, offset + limit - 1)
      .order("published_at", { ascending: false });

    // Filtres
    if (city) {
      query = query.ilike("city", `%${city}%`);
    }

    if (contract_type) {
      query = query.eq("contract_type", contract_type.toUpperCase());
    }

    if (experience_min) {
      query = query.gte("experience_min", parseInt(experience_min));
    }

    if (salary_min) {
      query = query.gte("salary_min", parseFloat(salary_min));
    }

    // Recherche textuelle
    if (search) {
      query = query.or(`title.ilike.%${search}%, description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);

  } catch (err) {
    console.error("Erreur recherche offres:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 GET Détails d'une offre d'emploi
exports.getJobOfferById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: offer, error } = await supabase
      .from("job_offers")
      .select(`
        *,
        companies:company_id (
          id,
          name,
          logo_url,
          sector,
          size_employees
        ),
        job_offer_skills (
          is_required,
          weight,
          skills:skill_id (
            id,
            slug,
            display_name
          )
        )
      `)
      .eq("id", id)
      .single();

    if (error || !offer) {
      return res.status(404).json({ error: "Offre d'emploi non trouvée" });
    }

    res.json(offer);

  } catch (err) {
    console.error("Erreur récupération offre:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 PUT Modifier une offre d'emploi
exports.updateJobOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const {
      title,
      description,
      city,
      latitude,
      longitude,
      contract_type,
      experience_min,
      salary_min,
      salary_max,
      status
    } = req.body;

    // Vérifier que l'utilisateur peut modifier cette offre
    const { data: offer } = await supabase
      .from("job_offers")
      .select(`
        id,
        company_id,
        companies:company_id (
          company_memberships!inner (
            user_id
          )
        )
      `)
      .eq("id", id)
      .eq("companies.company_memberships.user_id", userId)
      .single();

    if (!offer && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const updateData = {
      title,
      description,
      city,
      latitude,
      longitude,
      contract_type,
      experience_min,
      salary_min,
      salary_max,
      status,
      updated_at: new Date().toISOString()
    };

    // Supprimer les champs undefined
    Object.keys(updateData).forEach(key =>
      updateData[key] === undefined && delete updateData[key]
    );

    const { data, error } = await supabase
      .from("job_offers")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: "Offre d'emploi non trouvée" });
    }

    res.json(data);

  } catch (err) {
    console.error("Erreur modification offre:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 DELETE Supprimer une offre d'emploi
exports.deleteJobOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Vérifier que l'utilisateur peut supprimer cette offre
    const { data: offer } = await supabase
      .from("job_offers")
      .select(`
        id,
        company_id,
        companies:company_id (
          company_memberships!inner (
            user_id
          )
        )
      `)
      .eq("id", id)
      .eq("companies.company_memberships.user_id", userId)
      .single();

    if (!offer && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const { error } = await supabase
      .from("job_offers")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Offre d'emploi supprimée avec succès" });

  } catch (err) {
    console.error("Erreur suppression offre:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 GET Offres d'emploi de l'entreprise
exports.getCompanyJobOffers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 20, offset = 0 } = req.query;

    // Récupérer l'entreprise de l'utilisateur
    const { data: membership } = await supabase
      .from("company_memberships")
      .select("company_id")
      .eq("user_id", userId)
      .is("removed_at", null)
      .single();

    if (!membership) {
      return res.status(403).json({ error: "Vous n'appartenez à aucune entreprise" });
    }

    let query = supabase
      .from("job_offers")
      .select(`
        id,
        title,
        description,
        city,
        contract_type,
        experience_min,
        salary_min,
        salary_max,
        currency,
        status,
        published_at,
        created_at
      `)
      .eq("company_id", membership.company_id)
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status.toUpperCase());
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);

  } catch (err) {
    console.error("Erreur récupération offres entreprise:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
