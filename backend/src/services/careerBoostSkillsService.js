/**
 * CareerBoost Skills Service
 * Service principal pour l'extraction et le matching des compétences
 * Adapté au cahier des charges CareerBoost E-petitpas
 */

const SkillsParsingService = require('./skillsParsingService');

class CareerBoostSkillsService {
  constructor() {
    this.skillsParser = new SkillsParsingService();
    this.aiService = null; // À injecter selon l'implémentation IA
  }

  /**
   * Extraction des compétences pour le matching IA v1
   * Utilisé par le feed d'offres et le calcul de score
   * 
   * @param {Object} jobOffer - Offre d'emploi
   * @param {string} jobOffer.title - Titre de l'offre
   * @param {string} jobOffer.description - Description complète
   * @param {string} jobOffer.company - Nom de l'entreprise
   * @param {string} jobOffer.location - Localisation
   * @returns {Object} Compétences formatées pour le matching
   */
  async extractSkillsForMatching(jobOffer) {
    try {
      const { description, title, company, location } = jobOffer;
      
      // Contexte enrichi pour améliorer la précision
      const enrichedContext = `${title} ${company} ${location}`;
      
      const skills = await this.skillsParser.parseSkillsFromDescription(
        description, 
        enrichedContext
      );

      // Classification des compétences selon le cahier des charges
      const requiredSkills = skills
        .filter(s => s.weight >= 3 || s.is_required) // Compétences critiques
        .map(s => s.slug);

      const optionalSkills = skills
        .filter(s => s.weight < 3 && !s.is_required) // Compétences souhaitées
        .map(s => s.slug);

      // Détails pour l'explication du matching (traçabilité)
      const skillsDetail = skills.map(s => ({
        skill: s.slug,
        name: s.display_name,
        category: s.category,
        required: s.weight >= 3 || s.is_required,
        weight: s.weight,
        confidence: s.confidence || 0.8
      }));

      return {
        // Format pour le modèle de données CareerBoost
        required_skills: requiredSkills,
        optional_skills: optionalSkills,
        
        // Métadonnées pour le matching IA
        skills_detail: skillsDetail,
        total_skills_count: skills.length,
        parsing_confidence: this.calculateParsingConfidence(skills, description),
        
        // Pour audit et debugging
        raw_skills_data: skills,
        extraction_metadata: {
          method: 'rule_based_parsing',
          context_used: enrichedContext,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Erreur extraction compétences pour matching:', error);
      
      // Fallback vers l'IA comme spécifié dans le cahier des charges
      if (this.aiService) {
        return await this.parseSkillsWithAI(jobOffer);
      }
      
      // Fallback minimal
      return {
        required_skills: [],
        optional_skills: [],
        skills_detail: [],
        total_skills_count: 0,
        parsing_confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Analyse d'offres externes collées par les candidats
   * Utilisé dans le parcours candidat pour évaluer une offre externe
   * 
   * @param {Object} offerContent - Contenu de l'offre externe
   * @param {string} offerContent.text - Texte de l'offre
   * @param {string} offerContent.title - Titre (optionnel)
   * @param {string} offerContent.source - Source/URL (optionnel)
   * @returns {Object} Analyse complète pour le candidat
   */
  async analyzePastedOffer(offerContent) {
    try {
      const { text, title = '', source = '' } = offerContent;
      
      const skills = await this.skillsParser.parseSkillsFromDescription(text, title);
      
      const analysis = {
        parsed_skills: {
          required: skills.filter(s => s.weight >= 3 || s.is_required),
          optional: skills.filter(s => s.weight < 3 && !s.is_required)
        },
        skills_summary: this.generateSkillsSummary(skills),
        confidence_score: this.calculateParsingConfidence(skills, text),
        extraction_quality: this.assessExtractionQuality(skills, text)
      };

      // Génération de l'explication pour le candidat
      const explanation = this.generateCandidateExplanation(analysis);

      return {
        // Score de pertinence (à comparer avec le profil candidat)
        relevance_score: analysis.confidence_score,
        
        // Explication claire pour le candidat
        explanation: explanation,
        
        // Compétences détectées
        detected_skills: {
          required: analysis.parsed_skills.required.map(s => ({
            name: s.display_name,
            category: s.category,
            importance: 'Obligatoire'
          })),
          optional: analysis.parsed_skills.optional.map(s => ({
            name: s.display_name,
            category: s.category,
            importance: 'Souhaité'
          }))
        },
        
        // Métadonnées
        analysis_metadata: {
          total_skills: skills.length,
          confidence: analysis.confidence_score,
          source: source,
          analyzed_at: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Erreur analyse offre collée:', error);
      
      return {
        relevance_score: 0,
        explanation: "Impossible d'analyser cette offre. Veuillez vérifier le contenu.",
        detected_skills: { required: [], optional: [] },
        error: error.message
      };
    }
  }

  /**
   * Calcul du score de matching entre candidat et offre
   * Implémentation de la logique du cahier des charges (section 6.2)
   * 
   * @param {Array} candidateSkills - Compétences du candidat
   * @param {Object} jobSkills - Compétences de l'offre (required_skills, optional_skills)
   * @param {Object} candidateProfile - Profil complet du candidat
   * @param {Object} jobOffer - Offre complète
   * @returns {Object} Score et explication
   */
  calculateMatchingScore(candidateSkills, jobSkills, candidateProfile, jobOffer) {
    try {
      // 1. Filtres durs (éliminatoires) - Section 6.2.1 du cahier des charges
      const hardFiltersResult = this.checkHardFilters(candidateProfile, jobOffer);
      if (hardFiltersResult.score === 0) {
        return {
          score: 0,
          explanation: hardFiltersResult.explanation,
          details: hardFiltersResult.details
        };
      }

      // 2. Similarité de compétences (pondérée) - Section 6.2.2
      const skillsScore = this.calculateSkillsScore(candidateSkills, jobSkills);
      
      // 3. Autres signaux (bonus/malus) - Section 6.2.3
      const experienceScore = this.calculateExperienceScore(candidateProfile, jobOffer);
      const bonusScore = this.calculateBonusScore(candidateProfile, jobOffer);
      
      // 4. Score final 0-100 - Section 6.2.4
      const alpha = 0.6; // Poids des compétences
      const beta = 0.3;  // Poids de l'expérience
      const gamma = 0.1; // Poids des bonus
      
      const rawScore = (alpha * skillsScore + beta * experienceScore + gamma * bonusScore) 
                      * hardFiltersResult.multiplier;
      
      const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));
      
      // 5. Explication courte (1-2 phrases) - Section 6.2.5
      const explanation = this.generateMatchingExplanation({
        score: finalScore,
        skillsMatched: skillsScore,
        candidateSkills,
        jobSkills,
        candidateProfile,
        jobOffer
      });

      return {
        score: finalScore,
        explanation: explanation,
        details: {
          skills_score: Math.round(skillsScore),
          experience_score: Math.round(experienceScore),
          bonus_score: Math.round(bonusScore),
          hard_filters: hardFiltersResult.details,
          matched_skills: this.getMatchedSkills(candidateSkills, jobSkills),
          missing_skills: this.getMissingSkills(candidateSkills, jobSkills)
        }
      };

    } catch (error) {
      console.error('Erreur calcul matching score:', error);
      return {
        score: 0,
        explanation: "Erreur lors du calcul du score de compatibilité",
        error: error.message
      };
    }
  }

  /**
   * Vérification des filtres durs (éliminatoires)
   * Implémentation section 6.2.1 du cahier des charges
   */
  checkHardFilters(candidateProfile, jobOffer) {
    // Type de contrat incompatible
    if (jobOffer.contract_type && candidateProfile.preferred_contracts) {
      if (!candidateProfile.preferred_contracts.includes(jobOffer.contract_type)) {
        return {
          score: 0,
          explanation: `Type de contrat incompatible (${jobOffer.contract_type} requis)`,
          details: { contract_mismatch: true },
          multiplier: 0
        };
      }
    }

    // Distance géographique
    const distance = this.calculateDistance(candidateProfile.location, jobOffer.location);
    if (distance > candidateProfile.mobility_km) {
      return {
        score: 0,
        explanation: `Trop éloigné (${distance}km > ${candidateProfile.mobility_km}km acceptés)`,
        details: { distance_km: distance, max_distance: candidateProfile.mobility_km },
        multiplier: 0
      };
    }

    // Malus distance (si proche de la limite)
    const distanceMultiplier = distance > (candidateProfile.mobility_km * 0.8) 
      ? 0.9 
      : 1.0;

    return {
      score: 100,
      explanation: "Critères durs respectés",
      details: { distance_km: distance },
      multiplier: distanceMultiplier
    };
  }

  /**
   * Calcul du score de compétences
   * Logique pondérée : obligatoires > souhaitées
   */
  calculateSkillsScore(candidateSkills, jobSkills) {
    const requiredMatch = jobSkills.required_skills.filter(rs => 
      candidateSkills.includes(rs)
    ).length;
    
    const optionalMatch = jobSkills.optional_skills.filter(os =>
      candidateSkills.includes(os)  
    ).length;
    
    const requiredScore = jobSkills.required_skills.length > 0 
      ? (requiredMatch / jobSkills.required_skills.length) * 70 
      : 70;
      
    const optionalScore = jobSkills.optional_skills.length > 0
      ? (optionalMatch / jobSkills.optional_skills.length) * 30
      : 30;
    
    return Math.min(100, requiredScore + optionalScore);
  }

  // Méthodes utilitaires (à implémenter selon les besoins)
  calculateExperienceScore(candidateProfile, jobOffer) {
    // Implémentation du matching d'expérience
    return 80; // Placeholder
  }

  calculateBonusScore(candidateProfile, jobOffer) {
    // Bonus pour secteur, mots-clés, etc.
    return 10; // Placeholder
  }

  calculateDistance(location1, location2) {
    // Calcul de distance géographique
    return 15; // Placeholder en km
  }

  getMatchedSkills(candidateSkills, jobSkills) {
    return [...jobSkills.required_skills, ...jobSkills.optional_skills]
      .filter(skill => candidateSkills.includes(skill));
  }

  getMissingSkills(candidateSkills, jobSkills) {
    return jobSkills.required_skills
      .filter(skill => !candidateSkills.includes(skill));
  }

  generateMatchingExplanation({ score, candidateSkills, jobSkills, candidateProfile, jobOffer }) {
    const matched = this.getMatchedSkills(candidateSkills, jobSkills);
    const missing = this.getMissingSkills(candidateSkills, jobSkills);
    const distance = this.calculateDistance(candidateProfile.location, jobOffer.location);

    let explanation = `Score ${score} : vous correspondez sur ${matched.length} compétences`;
    
    if (missing.length > 0) {
      explanation += `, mais il manque ${missing.slice(0, 2).join(', ')}`;
      if (missing.length > 2) explanation += ` et ${missing.length - 2} autres`;
    }
    
    if (distance > 10) {
      explanation += ` et vous êtes éloigné de ${distance}km`;
    }
    
    return explanation + '.';
  }

  generateCandidateExplanation(analysis) {
    const { parsed_skills, confidence_score } = analysis;
    const totalSkills = parsed_skills.required.length + parsed_skills.optional.length;
    
    return `Cette offre contient ${totalSkills} compétences détectées avec ${Math.round(confidence_score * 100)}% de confiance. ` +
           `${parsed_skills.required.length} compétences sont obligatoires et ${parsed_skills.optional.length} sont souhaitées.`;
  }

  generateSkillsSummary(skills) {
    const categories = {};
    skills.forEach(skill => {
      if (!categories[skill.category]) categories[skill.category] = 0;
      categories[skill.category]++;
    });
    
    return Object.entries(categories)
      .map(([cat, count]) => `${cat}: ${count}`)
      .join(', ');
  }

  calculateParsingConfidence(skills, text) {
    // Heuristique de confiance basée sur le nombre de compétences trouvées
    // et la longueur du texte
    const skillsRatio = skills.length / (text.length / 100);
    return Math.min(1, Math.max(0.3, skillsRatio));
  }

  assessExtractionQuality(skills, text) {
    return {
      skills_count: skills.length,
      text_length: text.length,
      skills_density: skills.length / (text.split(' ').length / 100),
      categories_covered: [...new Set(skills.map(s => s.category))].length
    };
  }

  /**
   * Fallback IA pour l'extraction de compétences
   * À implémenter selon le service IA choisi
   */
  async parseSkillsWithAI(jobOffer) {
    // Placeholder - à implémenter avec OpenAI/Claude/etc.
    console.log('Fallback IA non implémenté, utilisation parsing par défaut');
    return this.extractSkillsForMatching(jobOffer);
  }
}

module.exports = CareerBoostSkillsService;
