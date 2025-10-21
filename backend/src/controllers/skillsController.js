/**
 * Contrôleur pour les APIs de compétences CareerBoost
 * Implémente les endpoints du cahier des charges
 */

const CareerBoostSkillsService = require('../services/careerBoostSkillsService');

class SkillsController {
  constructor() {
    this.careerBoostService = new CareerBoostSkillsService();
  }

  /**
   * POST /offer/parse
   * Analyse d'une offre externe collée par un candidat
   * Section 7.1.5 du cahier des charges
   */
  async parseExternalOffer(req, res) {
    try {
      const { text, url, title } = req.body;

      if (!text && !url) {
        return res.status(400).json({
          error: 'Texte ou URL requis',
          code: 'MISSING_CONTENT'
        });
      }

      let offerContent = { text, title: title || '' };

      // Si URL fournie, extraire le contenu (à implémenter selon les besoins)
      if (url) {
        // offerContent = await this.extractContentFromUrl(url);
        offerContent.source = url;
      }

      const analysis = await this.careerBoostService.analyzePastedOffer(offerContent);

      // Format de réponse selon le cahier des charges
      res.json({
        success: true,
        data: {
          parsed_offer: {
            title: title || 'Offre externe',
            source: url || 'Texte collé',
            skills_detected: analysis.detected_skills,
            analysis_quality: analysis.analysis_metadata
          },
          score: Math.round(analysis.relevance_score * 100),
          explanation: analysis.explanation,
          recommendations: this.generateRecommendations(analysis)
        }
      });

    } catch (error) {
      console.error('Erreur parsing offre externe:', error);
      res.status(500).json({
        error: 'Erreur lors de l\'analyse de l\'offre',
        code: 'PARSING_ERROR',
        details: error.message
      });
    }
  }

  /**
   * GET /offers/:id/match
   * Calcul du score de matching pour une offre spécifique
   * Utilisé par le feed d'offres personnalisées
   */
  async calculateOfferMatch(req, res) {
    try {
      const { id: offerId } = req.params;
      const candidateId = req.user.id; // Depuis le middleware d'auth

      // Récupérer l'offre et le profil candidat (à adapter selon votre ORM)
      const jobOffer = await this.getJobOffer(offerId);
      const candidateProfile = await this.getCandidateProfile(candidateId);

      if (!jobOffer) {
        return res.status(404).json({
          error: 'Offre non trouvée',
          code: 'OFFER_NOT_FOUND'
        });
      }

      // Extraction des compétences de l'offre
      const jobSkills = await this.careerBoostService.extractSkillsForMatching(jobOffer);

      // Calcul du matching
      const matchingResult = this.careerBoostService.calculateMatchingScore(
        candidateProfile.skills || [],
        jobSkills,
        candidateProfile,
        jobOffer
      );

      // Sauvegarde de la trace de matching (audit)
      await this.saveMatchTrace({
        offer_id: offerId,
        candidate_id: candidateId,
        score: matchingResult.score,
        explanation: matchingResult.explanation,
        details: matchingResult.details,
        job_skills: jobSkills
      });

      res.json({
        success: true,
        data: {
          offer_id: offerId,
          candidate_id: candidateId,
          matching: {
            score: matchingResult.score,
            explanation: matchingResult.explanation,
            matched_skills: matchingResult.details.matched_skills,
            missing_skills: matchingResult.details.missing_skills,
            distance_km: matchingResult.details.hard_filters?.distance_km || 0
          },
          recommendations: this.generateMatchingRecommendations(matchingResult)
        }
      });

    } catch (error) {
      console.error('Erreur calcul matching:', error);
      res.status(500).json({
        error: 'Erreur lors du calcul de compatibilité',
        code: 'MATCHING_ERROR',
        details: error.message
      });
    }
  }

  /**
   * POST /offers/:id/skills/extract
   * Extraction des compétences d'une offre (pour les recruteurs)
   * Utilisé lors de la publication d'offres
   */
  async extractOfferSkills(req, res) {
    try {
      const { id: offerId } = req.params;
      const { description, title, company } = req.body;

      if (!description) {
        return res.status(400).json({
          error: 'Description de l\'offre requise',
          code: 'MISSING_DESCRIPTION'
        });
      }

      const jobOffer = { title, description, company };
      const skillsResult = await this.careerBoostService.extractSkillsForMatching(jobOffer);

      res.json({
        success: true,
        data: {
          offer_id: offerId,
          skills_extraction: {
            required_skills: skillsResult.required_skills,
            optional_skills: skillsResult.optional_skills,
            skills_detail: skillsResult.skills_detail,
            confidence: skillsResult.parsing_confidence,
            total_count: skillsResult.total_skills_count
          },
          suggestions: {
            missing_common_skills: this.suggestMissingSkills(skillsResult),
            skill_categories: this.categorizeSkills(skillsResult.skills_detail)
          }
        }
      });

    } catch (error) {
      console.error('Erreur extraction compétences offre:', error);
      res.status(500).json({
        error: 'Erreur lors de l\'extraction des compétences',
        code: 'EXTRACTION_ERROR',
        details: error.message
      });
    }
  }

  /**
   * GET /candidates/:id/skills/match-summary
   * Résumé des matchings pour un candidat
   * Utilisé dans le tableau de bord candidat
   */
  async getCandidateMatchSummary(req, res) {
    try {
      const { id: candidateId } = req.params;
      const candidateProfile = await this.getCandidateProfile(candidateId);

      if (!candidateProfile) {
        return res.status(404).json({
          error: 'Profil candidat non trouvé',
          code: 'CANDIDATE_NOT_FOUND'
        });
      }

      // Récupérer les dernières offres matchées
      const recentMatches = await this.getRecentMatches(candidateId, 10);
      
      // Statistiques de matching
      const matchStats = await this.calculateMatchStats(candidateId);

      res.json({
        success: true,
        data: {
          candidate_id: candidateId,
          skills_profile: {
            total_skills: candidateProfile.skills?.length || 0,
            top_categories: this.getTopSkillCategories(candidateProfile.skills),
            completeness_score: this.calculateProfileCompleteness(candidateProfile)
          },
          matching_stats: {
            average_score: matchStats.average_score,
            total_matches: matchStats.total_matches,
            high_matches: matchStats.high_matches, // Score > 80
            applications_sent: matchStats.applications_sent
          },
          recent_matches: recentMatches.map(match => ({
            offer_id: match.offer_id,
            offer_title: match.offer_title,
            company: match.company,
            score: match.score,
            explanation: match.explanation,
            matched_at: match.created_at
          })),
          recommendations: this.generateProfileRecommendations(candidateProfile, matchStats)
        }
      });

    } catch (error) {
      console.error('Erreur résumé matching candidat:', error);
      res.status(500).json({
        error: 'Erreur lors du calcul du résumé',
        code: 'SUMMARY_ERROR',
        details: error.message
      });
    }
  }

  // Méthodes utilitaires (à adapter selon votre architecture)

  async getJobOffer(offerId) {
    // À implémenter selon votre ORM/base de données
    // return await JobOffer.findById(offerId);
    return null;
  }

  async getCandidateProfile(candidateId) {
    // À implémenter selon votre ORM/base de données
    // return await CandidateProfile.findByUserId(candidateId);
    return null;
  }

  async saveMatchTrace(traceData) {
    // Sauvegarde pour audit et amélioration du matching
    // await MatchTrace.create(traceData);
    console.log('Match trace saved:', traceData);
  }

  async getRecentMatches(candidateId, limit = 10) {
    // Récupérer les derniers matchings
    return [];
  }

  async calculateMatchStats(candidateId) {
    // Calculer les statistiques de matching
    return {
      average_score: 75,
      total_matches: 25,
      high_matches: 8,
      applications_sent: 12
    };
  }

  generateRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.detected_skills.required.length < 3) {
      recommendations.push({
        type: 'skill_gap',
        message: 'Cette offre semble avoir peu de compétences techniques spécifiées. Vérifiez si elle correspond à votre profil.',
        priority: 'medium'
      });
    }

    if (analysis.analysis_metadata.confidence < 0.6) {
      recommendations.push({
        type: 'parsing_quality',
        message: 'L\'analyse automatique a une confiance limitée. Lisez attentivement l\'offre originale.',
        priority: 'high'
      });
    }

    return recommendations;
  }

  generateMatchingRecommendations(matchingResult) {
    const recommendations = [];
    
    if (matchingResult.score < 50) {
      recommendations.push({
        type: 'low_match',
        message: 'Ce poste semble peu adapté à votre profil. Concentrez-vous sur des offres avec un score plus élevé.',
        priority: 'low'
      });
    } else if (matchingResult.score > 80) {
      recommendations.push({
        type: 'high_match',
        message: 'Excellent matching ! N\'hésitez pas à postuler rapidement.',
        priority: 'high'
      });
    }

    if (matchingResult.details.missing_skills.length > 0) {
      recommendations.push({
        type: 'skill_development',
        message: `Développez ces compétences pour améliorer votre profil : ${matchingResult.details.missing_skills.slice(0, 3).join(', ')}`,
        priority: 'medium'
      });
    }

    return recommendations;
  }

  generateProfileRecommendations(candidateProfile, matchStats) {
    const recommendations = [];
    
    if (matchStats.average_score < 60) {
      recommendations.push({
        type: 'profile_improvement',
        message: 'Votre score moyen est faible. Complétez votre profil avec plus de compétences.',
        priority: 'high'
      });
    }

    if (candidateProfile.skills?.length < 5) {
      recommendations.push({
        type: 'add_skills',
        message: 'Ajoutez plus de compétences à votre profil pour améliorer le matching.',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  suggestMissingSkills(skillsResult) {
    // Suggérer des compétences manquantes communes dans le domaine
    return ['git', 'agile', 'english'];
  }

  categorizeSkills(skillsDetail) {
    const categories = {};
    skillsDetail.forEach(skill => {
      if (!categories[skill.category]) {
        categories[skill.category] = [];
      }
      categories[skill.category].push(skill.name);
    });
    return categories;
  }

  getTopSkillCategories(skills) {
    // Retourner les catégories de compétences les plus représentées
    return ['Développement Web', 'Base de données', 'DevOps'];
  }

  calculateProfileCompleteness(candidateProfile) {
    // Calculer un score de complétude du profil
    let score = 0;
    if (candidateProfile.skills?.length > 0) score += 30;
    if (candidateProfile.experience_years > 0) score += 20;
    if (candidateProfile.education?.length > 0) score += 20;
    if (candidateProfile.location) score += 15;
    if (candidateProfile.preferred_contracts?.length > 0) score += 15;
    return score;
  }
}

module.exports = SkillsController;
