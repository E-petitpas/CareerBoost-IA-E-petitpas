const supabase = require("../config/supabase");

// 🔹 POST Créer/Inscrire une entreprise
exports.createCompany = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, siren, domain, sector, size_employees, logo_url } = req.body;
    
    // Validation des champs requis
    if (!name || !domain) {
      return res.status(400).json({ 
        error: "Les champs name et domain sont requis" 
      });
    }
    
    // Vérifier si le domaine existe déjà
    const { data: existingCompany } = await supabase
      .from("companies")
      .select("id")
      .eq("domain", domain.toLowerCase())
      .single();
    
    if (existingCompany) {
      return res.status(409).json({ error: "Ce domaine est déjà utilisé" });
    }
    
    // Créer l'entreprise
    const companyData = {
      name,
      siren,
      domain: domain.toLowerCase(),
      sector,
      size_employees,
      logo_url,
      status: "PENDING"
    };
    
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert([companyData])
      .select();
    
    if (companyError) {
      return res.status(400).json({ error: companyError.message });
    }
    
    // Ajouter l'utilisateur comme membre admin de l'entreprise
    const membershipData = {
      user_id: userId,
      company_id: company[0].id,
      role_in_company: "ADMIN_RH",
      is_primary: true,
      accepted_at: new Date().toISOString()
    };
    
    const { error: membershipError } = await supabase
      .from("company_memberships")
      .insert([membershipData]);
    
    if (membershipError) {
      // Rollback: supprimer l'entreprise créée
      await supabase.from("companies").delete().eq("id", company[0].id);
      return res.status(400).json({ error: membershipError.message });
    }
    
    res.status(201).json({
      message: "Entreprise créée avec succès. En attente de validation.",
      company: company[0]
    });
    
  } catch (err) {
    console.error("Erreur création entreprise:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 GET Liste des entreprises (avec filtres pour admin)
exports.getCompanies = async (req, res) => {
  try {
    const { status, search, limit = 50, offset = 0 } = req.query;
    
    let query = supabase
      .from("companies")
      .select("id, name, siren, domain, sector, size_employees, logo_url, status, created_at, validated_at")
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });
    
    // Filtrer par statut si spécifié
    if (status) {
      query = query.eq("status", status.toUpperCase());
    }
    
    // Recherche textuelle si spécifiée
    if (search) {
      query = query.or(`name.ilike.%${search}%, domain.ilike.%${search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json(data);
    
  } catch (err) {
    console.error("Erreur récupération entreprises:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 GET Détails d'une entreprise
exports.getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: company, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error || !company) {
      return res.status(404).json({ error: "Entreprise non trouvée" });
    }
    
    res.json(company);
    
  } catch (err) {
    console.error("Erreur récupération entreprise:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 PUT Modifier une entreprise
exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, siren, sector, size_employees, logo_url } = req.body;
    
    // Vérifier que l'utilisateur est membre admin de cette entreprise
    const { data: membership } = await supabase
      .from("company_memberships")
      .select("role_in_company")
      .eq("user_id", userId)
      .eq("company_id", id)
      .eq("role_in_company", "ADMIN_RH")
      .is("removed_at", null)
      .single();
    
    if (!membership && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Accès refusé" });
    }
    
    const updateData = {
      name,
      siren,
      sector,
      size_employees,
      logo_url
    };
    
    // Supprimer les champs undefined
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );
    
    const { data, error } = await supabase
      .from("companies")
      .update(updateData)
      .eq("id", id)
      .select();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    if (!data.length) {
      return res.status(404).json({ error: "Entreprise non trouvée" });
    }
    
    res.json(data[0]);
    
  } catch (err) {
    console.error("Erreur modification entreprise:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 PUT Valider/Rejeter une entreprise (admin seulement)
exports.validateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "VERIFIED" ou "REJECTED"
    
    if (!["VERIFIED", "REJECTED"].includes(status)) {
      return res.status(400).json({ 
        error: "Le statut doit être VERIFIED ou REJECTED" 
      });
    }
    
    const updateData = {
      status,
      validated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from("companies")
      .update(updateData)
      .eq("id", id)
      .select();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    if (!data.length) {
      return res.status(404).json({ error: "Entreprise non trouvée" });
    }
    
    res.json({
      message: `Entreprise ${status === "VERIFIED" ? "validée" : "rejetée"} avec succès`,
      company: data[0]
    });
    
  } catch (err) {
    console.error("Erreur validation entreprise:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 GET Membres d'une entreprise
exports.getCompanyMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Vérifier que l'utilisateur est membre de cette entreprise ou admin
    if (req.user.role !== "ADMIN") {
      const { data: membership } = await supabase
        .from("company_memberships")
        .select("id")
        .eq("user_id", userId)
        .eq("company_id", id)
        .is("removed_at", null)
        .single();
      
      if (!membership) {
        return res.status(403).json({ error: "Accès refusé" });
      }
    }
    
    const { data, error } = await supabase
      .from("company_memberships")
      .select(`
        user_id,
        role_in_company,
        is_primary,
        invited_at,
        accepted_at,
        users:user_id (
          id,
          name,
          email,
          verified
        )
      `)
      .eq("company_id", id)
      .is("removed_at", null)
      .order("invited_at", { ascending: false });
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json(data);
    
  } catch (err) {
    console.error("Erreur récupération membres:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 POST Inviter un membre dans l'entreprise
exports.inviteCompanyMember = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { email, role_in_company = "RH_USER" } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email requis" });
    }
    
    // Vérifier que l'utilisateur est admin de cette entreprise
    const { data: membership } = await supabase
      .from("company_memberships")
      .select("role_in_company")
      .eq("user_id", userId)
      .eq("company_id", id)
      .eq("role_in_company", "ADMIN_RH")
      .is("removed_at", null)
      .single();
    
    if (!membership) {
      return res.status(403).json({ error: "Seuls les admins RH peuvent inviter des membres" });
    }
    
    // Vérifier que l'utilisateur à inviter existe
    const { data: invitedUser, error: userError } = await supabase
      .from("users")
      .select("id, role")
      .eq("email", email.toLowerCase())
      .eq("role", "RECRUITER")
      .is("deleted_at", null)
      .single();
    
    if (userError || !invitedUser) {
      return res.status(404).json({ error: "Utilisateur recruteur non trouvé avec cet email" });
    }
    
    // Vérifier qu'il n'est pas déjà membre
    const { data: existingMembership } = await supabase
      .from("company_memberships")
      .select("id")
      .eq("user_id", invitedUser.id)
      .eq("company_id", id)
      .is("removed_at", null)
      .single();
    
    if (existingMembership) {
      return res.status(409).json({ error: "Cet utilisateur est déjà membre de l'entreprise" });
    }
    
    // Créer l'invitation
    const invitationData = {
      user_id: invitedUser.id,
      company_id: id,
      role_in_company,
      is_primary: false,
      accepted_at: new Date().toISOString() // Auto-accepté pour simplifier
    };
    
    const { data, error } = await supabase
      .from("company_memberships")
      .insert([invitationData])
      .select();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(201).json({
      message: "Membre invité avec succès",
      membership: data[0]
    });
    
  } catch (err) {
    console.error("Erreur invitation membre:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
