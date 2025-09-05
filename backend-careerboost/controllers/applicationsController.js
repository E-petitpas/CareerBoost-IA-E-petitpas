const supabase = require("../config/supabase");

// 🔹 POST Postuler à une offre d'emploi
exports.applyToJobOffer = async (req, res) => {
  try {
    const candidateId = req.user.id;
    const { offer_id } = req.body;

    if (!offer_id) {
      return res.status(400).json({ error: "L'ID de l'offre est requis" });
    }

    // Vérifier que l'offre existe et est active
    const { data: offer, error: offerError } = await supabase
      .from("job_offers")
      .select("id, title, company_id")
      .eq("id", offer_id)
      .eq("status", "ACTIVE")
      .single();

    if (offerError || !offer) {
      return res.status(404).json({ error: "Offre d'emploi non trouvée ou inactive" });
    }

    // Vérifier que le candidat n'a pas déjà postulé
    const { data: existingApplication } = await supabase
      .from("applications")
      .select("id")
      .eq("offer_id", offer_id)
      .eq("candidate_id", candidateId)
      .single();

    if (existingApplication) {
      return res.status(409).json({ error: "Vous avez déjà postulé à cette offre" });
    }

    // Calculer le score de matching (simplifié pour l'exemple)
    const score = await calculateMatchingScore(candidateId, offer_id);

    // Créer la candidature
    const applicationData = {
      offer_id,
      candidate_id: candidateId,
      status: "ENVOYE",
      score: score.score,
      explanation: score.explanation
    };

    const { data: application, error: applicationError } = await supabase
      .from("applications")
      .insert([applicationData])
      .select()
      .single();

    if (applicationError) {
      return res.status(400).json({ error: applicationError.message });
    }

    // Créer un événement dans la timeline
    await supabase
      .from("application_events")
      .insert([{
        application_id: application.id,
        event_type: "STATUS_CHANGE",
        new_status: "ENVOYE",
        actor_user_id: candidateId
      }]);

    // Enregistrer la trace de matching
    await supabase
      .from("match_traces")
      .insert([{
        application_id: application.id,
        offer_id,
        candidate_id: candidateId,
        inputs_hash: `${candidateId}-${offer_id}-${Date.now()}`,
        score: score.score,
        matched_skills: score.matched_skills,
        missing_skills: score.missing_skills,
        explanation: score.explanation
      }]);

    res.status(201).json({
      message: "Candidature envoyée avec succès",
      application,
      matching: {
        score: score.score,
        explanation: score.explanation
      }
    });

  } catch (err) {
    console.error("Erreur candidature:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 GET Mes candidatures (candidat)
exports.getMyCandidatures = async (req, res) => {
  try {
    const candidateId = req.user.id;
    const { status, limit = 20, offset = 0 } = req.query;

    let query = supabase
      .from("applications")
      .select(`
        id,
        status,
        score,
        explanation,
        created_at,
        updated_at,
        job_offers:offer_id (
          id,
          title,
          city,
          contract_type,
          salary_min,
          salary_max,
          currency,
          companies:company_id (
            id,
            name,
            logo_url
          )
        )
      `)
      .eq("candidate_id", candidateId)
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
    console.error("Erreur récupération candidatures:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 GET Candidatures reçues (recruteur)
exports.getReceivedApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { offer_id, status, limit = 20, offset = 0 } = req.query;

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
      .from("applications")
      .select(`
        id,
        status,
        score,
        explanation,
        created_at,
        updated_at,
        users:candidate_id (
          id,
          name,
          email,
          city
        ),
        job_offers:offer_id (
          id,
          title,
          company_id
        )
      `)
      .eq("job_offers.company_id", membership.company_id)
      .range(offset, offset + limit - 1)
      .order("score", { ascending: false });

    if (offer_id) {
      query = query.eq("offer_id", offer_id);
    }

    if (status) {
      query = query.eq("status", status.toUpperCase());
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);

  } catch (err) {
    console.error("Erreur récupération candidatures reçues:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 PUT Changer le statut d'une candidature
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Le statut est requis" });
    }

    const validStatuses = ["ENVOYE", "EN_ATTENTE", "ENTRETIEN", "REFUS", "EMBAUCHE"];
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({ 
        error: `Statut invalide. Statuts autorisés: ${validStatuses.join(", ")}` 
      });
    }

    // Récupérer la candidature avec vérification des droits
    const { data: application, error: appError } = await supabase
      .from("applications")
      .select(`
        id,
        status,
        candidate_id,
        job_offers:offer_id (
          company_id,
          companies:company_id (
            company_memberships!inner (
              user_id
            )
          )
        )
      `)
      .eq("id", id)
      .eq("job_offers.companies.company_memberships.user_id", userId)
      .single();

    if (appError || !application) {
      return res.status(404).json({ error: "Candidature non trouvée ou accès refusé" });
    }

    const oldStatus = application.status;
    const newStatus = status.toUpperCase();

    // Mettre à jour le statut
    const { data: updatedApplication, error: updateError } = await supabase
      .from("applications")
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    // Créer un événement dans la timeline
    await supabase
      .from("application_events")
      .insert([{
        application_id: id,
        event_type: "STATUS_CHANGE",
        old_status: oldStatus,
        new_status: newStatus,
        note,
        actor_user_id: userId
      }]);

    res.json({
      message: "Statut mis à jour avec succès",
      application: updatedApplication
    });

  } catch (err) {
    console.error("Erreur mise à jour statut:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 GET Timeline d'une candidature
exports.getApplicationTimeline = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Vérifier les droits d'accès
    const { data: application } = await supabase
      .from("applications")
      .select(`
        id,
        candidate_id,
        job_offers:offer_id (
          company_id,
          companies:company_id (
            company_memberships (
              user_id
            )
          )
        )
      `)
      .eq("id", id)
      .single();

    if (!application) {
      return res.status(404).json({ error: "Candidature non trouvée" });
    }

    // Vérifier que l'utilisateur est soit le candidat, soit un membre de l'entreprise
    const isCandidate = application.candidate_id === userId;
    const isRecruiter = application.job_offers.companies.company_memberships
      .some(membership => membership.user_id === userId);

    if (!isCandidate && !isRecruiter && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Accès refusé" });
    }

    // Récupérer la timeline
    const { data: events, error } = await supabase
      .from("application_events")
      .select(`
        id,
        event_type,
        old_status,
        new_status,
        note,
        created_at,
        users:actor_user_id (
          id,
          name
        )
      `)
      .eq("application_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(events);

  } catch (err) {
    console.error("Erreur récupération timeline:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Fonction utilitaire pour calculer le score de matching
async function calculateMatchingScore(candidateId, offerId) {
  try {
    // Récupérer les compétences du candidat
    const { data: candidateSkills } = await supabase
      .from("candidate_skills")
      .select("skill_id, proficiency_level")
      .eq("candidate_user_id", candidateId);

    // Récupérer les compétences requises pour l'offre
    const { data: offerSkills } = await supabase
      .from("job_offer_skills")
      .select("skill_id, is_required, weight")
      .eq("job_offer_id", offerId);

    const candidateSkillIds = candidateSkills?.map(cs => cs.skill_id) || [];
    const requiredSkillIds = offerSkills?.filter(os => os.is_required).map(os => os.skill_id) || [];
    const preferredSkillIds = offerSkills?.filter(os => !os.is_required).map(os => os.skill_id) || [];

    // Calculer les correspondances
    const matchedRequired = requiredSkillIds.filter(skillId => candidateSkillIds.includes(skillId));
    const matchedPreferred = preferredSkillIds.filter(skillId => candidateSkillIds.includes(skillId));
    const missingRequired = requiredSkillIds.filter(skillId => !candidateSkillIds.includes(skillId));

    // Calculer le score (simplifié)
    let score = 0;
    if (requiredSkillIds.length > 0) {
      score += (matchedRequired.length / requiredSkillIds.length) * 70; // 70% pour les compétences requises
    } else {
      score += 70; // Si pas de compétences requises, on donne 70%
    }
    
    if (preferredSkillIds.length > 0) {
      score += (matchedPreferred.length / preferredSkillIds.length) * 30; // 30% pour les compétences souhaitées
    } else {
      score += 30; // Si pas de compétences souhaitées, on donne 30%
    }

    // Générer une explication
    let explanation = `${matchedRequired.length + matchedPreferred.length} compétences correspondantes`;
    if (missingRequired.length > 0) {
      explanation += `, ${missingRequired.length} compétences requises manquantes`;
    }

    return {
      score: Math.round(score),
      explanation,
      matched_skills: [...matchedRequired, ...matchedPreferred],
      missing_skills: missingRequired
    };

  } catch (err) {
    console.error("Erreur calcul matching:", err);
    return {
      score: 50,
      explanation: "Score calculé automatiquement",
      matched_skills: [],
      missing_skills: []
    };
  }
}
