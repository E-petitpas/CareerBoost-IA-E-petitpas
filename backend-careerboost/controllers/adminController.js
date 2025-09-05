const supabase = require("../config/supabase");

// 🔹 GET Tableau de bord administrateur
exports.getDashboard = async (req, res) => {
  try {
    // Statistiques générales
    const [
      { count: totalUsers },
      { count: totalCandidates },
      { count: totalRecruiters },
      { count: totalCompanies },
      { count: pendingCompanies },
      { count: verifiedCompanies },
      { count: totalJobOffers },
      { count: activeJobOffers },
      { count: totalApplications },
      { count: successfulHires }
    ] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }).is("deleted_at", null),
      supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "CANDIDATE").is("deleted_at", null),
      supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "RECRUITER").is("deleted_at", null),
      supabase.from("companies").select("*", { count: "exact", head: true }),
      supabase.from("companies").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
      supabase.from("companies").select("*", { count: "exact", head: true }).eq("status", "VERIFIED"),
      supabase.from("job_offers").select("*", { count: "exact", head: true }),
      supabase.from("job_offers").select("*", { count: "exact", head: true }).eq("status", "ACTIVE"),
      supabase.from("applications").select("*", { count: "exact", head: true }),
      supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "EMBAUCHE")
    ]);

    // Statistiques des 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      { count: newUsersLast30Days },
      { count: newApplicationsLast30Days },
      { count: newJobOffersLast30Days }
    ] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString()).is("deleted_at", null),
      supabase.from("applications").select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString()),
      supabase.from("job_offers").select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString())
    ]);

    const dashboard = {
      overview: {
        totalUsers: totalUsers || 0,
        totalCandidates: totalCandidates || 0,
        totalRecruiters: totalRecruiters || 0,
        totalCompanies: totalCompanies || 0,
        pendingCompanies: pendingCompanies || 0,
        verifiedCompanies: verifiedCompanies || 0,
        totalJobOffers: totalJobOffers || 0,
        activeJobOffers: activeJobOffers || 0,
        totalApplications: totalApplications || 0,
        successfulHires: successfulHires || 0
      },
      last30Days: {
        newUsers: newUsersLast30Days || 0,
        newApplications: newApplicationsLast30Days || 0,
        newJobOffers: newJobOffersLast30Days || 0
      },
      conversionRates: {
        applicationToHire: totalApplications > 0 ? ((successfulHires || 0) / totalApplications * 100).toFixed(2) : 0,
        companyValidationRate: totalCompanies > 0 ? ((verifiedCompanies || 0) / totalCompanies * 100).toFixed(2) : 0
      }
    };

    res.json(dashboard);

  } catch (err) {
    console.error("Erreur tableau de bord admin:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 GET Entreprises en attente de validation
exports.getPendingCompanies = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const { data, error } = await supabase
      .from("companies")
      .select(`
        id,
        name,
        siren,
        domain,
        sector,
        size_employees,
        logo_url,
        created_at,
        company_memberships (
          users:user_id (
            id,
            name,
            email
          )
        )
      `)
      .eq("status", "PENDING")
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);

  } catch (err) {
    console.error("Erreur récupération entreprises en attente:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 GET Logs d'audit
exports.getAuditLogs = async (req, res) => {
  try {
    const { entity_type, action, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from("audit_logs")
      .select(`
        id,
        entity_type,
        entity_id,
        action,
        details,
        created_at,
        users:actor_user_id (
          id,
          name,
          email
        )
      `)
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (entity_type) {
      query = query.eq("entity_type", entity_type);
    }

    if (action) {
      query = query.eq("action", action);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);

  } catch (err) {
    console.error("Erreur récupération logs d'audit:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 POST Créer un log d'audit
exports.createAuditLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { entity_type, entity_id, action, details } = req.body;

    if (!entity_type || !action) {
      return res.status(400).json({ 
        error: "Les champs entity_type et action sont requis" 
      });
    }

    const auditData = {
      actor_user_id: userId,
      entity_type,
      entity_id,
      action,
      details
    };

    const { data, error } = await supabase
      .from("audit_logs")
      .insert([auditData])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data);

  } catch (err) {
    console.error("Erreur création log d'audit:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 GET Statistiques détaillées
exports.getDetailedStats = async (req, res) => {
  try {
    const { period = "30" } = req.query; // 7, 30, 90 jours
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Évolution des inscriptions par jour
    const { data: userRegistrations } = await supabase
      .from("users")
      .select("created_at, role")
      .gte("created_at", daysAgo.toISOString())
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    // Évolution des candidatures par jour
    const { data: applications } = await supabase
      .from("applications")
      .select("created_at, status")
      .gte("created_at", daysAgo.toISOString())
      .order("created_at", { ascending: true });

    // Évolution des offres par jour
    const { data: jobOffers } = await supabase
      .from("job_offers")
      .select("created_at, status")
      .gte("created_at", daysAgo.toISOString())
      .order("created_at", { ascending: true });

    // Top des compétences les plus demandées
    const { data: topSkills } = await supabase
      .from("job_offer_skills")
      .select(`
        skill_id,
        skills:skill_id (
          slug,
          display_name
        )
      `)
      .limit(10);

    // Grouper les données par jour
    const groupByDay = (data, dateField) => {
      const grouped = {};
      data?.forEach(item => {
        const date = new Date(item[dateField]).toISOString().split('T')[0];
        if (!grouped[date]) grouped[date] = 0;
        grouped[date]++;
      });
      return grouped;
    };

    const stats = {
      period: `${period} derniers jours`,
      userRegistrations: groupByDay(userRegistrations, "created_at"),
      applications: groupByDay(applications, "created_at"),
      jobOffers: groupByDay(jobOffers, "created_at"),
      topSkills: topSkills?.reduce((acc, item) => {
        const skillName = item.skills?.display_name || "Compétence inconnue";
        acc[skillName] = (acc[skillName] || 0) + 1;
        return acc;
      }, {}) || {}
    };

    res.json(stats);

  } catch (err) {
    console.error("Erreur statistiques détaillées:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// 🔹 GET Rapport d'impact pour les financeurs
exports.getImpactReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Construire les requêtes avec filtres de date si nécessaire
    let candidatesQuery = supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "CANDIDATE")
      .is("deleted_at", null);

    if (startDate) candidatesQuery = candidatesQuery.gte("created_at", startDate);
    if (endDate) candidatesQuery = candidatesQuery.lte("created_at", endDate);

    let companiesQuery = supabase
      .from("companies")
      .select("*", { count: "exact", head: true })
      .eq("status", "VERIFIED");

    if (startDate) companiesQuery = companiesQuery.gte("validated_at", startDate);
    if (endDate) companiesQuery = companiesQuery.lte("validated_at", endDate);

    let jobOffersQuery = supabase
      .from("job_offers")
      .select("*", { count: "exact", head: true });

    if (startDate) jobOffersQuery = jobOffersQuery.gte("published_at", startDate);
    if (endDate) jobOffersQuery = jobOffersQuery.lte("published_at", endDate);

    let applicationsQuery = supabase
      .from("applications")
      .select("*", { count: "exact", head: true });

    if (startDate) applicationsQuery = applicationsQuery.gte("created_at", startDate);
    if (endDate) applicationsQuery = applicationsQuery.lte("created_at", endDate);

    let hiresQuery = supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "EMBAUCHE");

    if (startDate) hiresQuery = hiresQuery.gte("updated_at", startDate);
    if (endDate) hiresQuery = hiresQuery.lte("updated_at", endDate);

    let scoresQuery = supabase
      .from("applications")
      .select("score")
      .not("score", "is", null);

    if (startDate) scoresQuery = scoresQuery.gte("created_at", startDate);
    if (endDate) scoresQuery = scoresQuery.lte("created_at", endDate);

    // Exécuter toutes les requêtes
    const [
      { count: candidatesRegistered },
      { count: companiesValidated },
      { count: jobOffersPublished },
      { count: applicationsSubmitted },
      { count: successfulHires },
      { data: avgScores }
    ] = await Promise.all([
      candidatesQuery,
      companiesQuery,
      jobOffersQuery,
      applicationsQuery,
      hiresQuery,
      scoresQuery
    ]);

    const averageMatchingScore = avgScores?.length > 0 
      ? avgScores.reduce((sum, app) => sum + app.score, 0) / avgScores.length 
      : 0;

    const report = {
      period: {
        startDate: startDate || "Depuis le début",
        endDate: endDate || "Aujourd'hui"
      },
      metrics: {
        candidatesRegistered: candidatesRegistered || 0,
        companiesValidated: companiesValidated || 0,
        jobOffersPublished: jobOffersPublished || 0,
        applicationsSubmitted: applicationsSubmitted || 0,
        successfulHires: successfulHires || 0,
        averageMatchingScore: Math.round(averageMatchingScore)
      },
      impact: {
        employmentRate: applicationsSubmitted > 0 
          ? ((successfulHires || 0) / applicationsSubmitted * 100).toFixed(2) 
          : 0,
        companyEngagement: companiesValidated || 0,
        candidateEngagement: candidatesRegistered || 0
      }
    };

    res.json(report);

  } catch (err) {
    console.error("Erreur rapport d'impact:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
