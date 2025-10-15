const crypto = require('crypto');

/**
 * Service de calcul du score de matching entre candidat et offre
 * Basé sur les spécifications du cahier des charges section 6
 */
class MatchingService {
  
  /**
   * Calcule le score de matching entre un candidat et une offre
   * @param {Object} candidate - Profil candidat complet
   * @param {Object} offer - Offre d'emploi complète
   * @returns {Object} Résultat du matching avec score et explication
   */
  async calculateMatchingScore(candidate, offer) {
    try {
      console.log('Calcul matching pour candidat:', candidate.users.name, 'offre:', offer.title);

      // 1. Vérifier les filtres durs (éliminatoires)
      const hardFiltersResult = this.checkHardFilters(candidate, offer);
      
      if (hardFiltersResult.score === 0) {
        return {
          score: 0,
          explanation: hardFiltersResult.explanation,
          matchedSkills: [],
          missingSkills: [],
          distanceKm: hardFiltersResult.distanceKm,
          hardFilters: hardFiltersResult.filters,
          inputsHash: this.generateInputsHash(candidate, offer)
        };
      }

      // 2. Calculer la similarité des compétences
      const skillsResult = this.calculateSkillsMatch(candidate, offer);

      // 3. Calculer l'alignement d'expérience
      const experienceResult = this.calculateExperienceMatch(candidate, offer);

      // 4. Calculer les bonus/malus additionnels
      const bonusResult = this.calculateBonus(candidate, offer);

      // 5. Calculer le score final
      const alpha = 0.6; // Poids des compétences
      const beta = 0.3;  // Poids de l'expérience
      const gamma = 0.1; // Poids des bonus

      const rawScore = alpha * skillsResult.score + 
                      beta * experienceResult.score + 
                      gamma * bonusResult.score;

      const finalScore = Math.round(100 * rawScore * hardFiltersResult.multiplier);
      const clampedScore = Math.max(0, Math.min(100, finalScore));

      // 6. Générer l'explication
      const explanation = this.generateExplanation({
        score: clampedScore,
        skillsResult,
        experienceResult,
        bonusResult,
        hardFiltersResult,
        candidate,
        offer
      });

      return {
        score: clampedScore,
        explanation,
        matchedSkills: skillsResult.matched,
        missingSkills: skillsResult.missing,
        distanceKm: hardFiltersResult.distanceKm,
        hardFilters: hardFiltersResult.filters,
        inputsHash: this.generateInputsHash(candidate, offer)
      };

    } catch (error) {
      console.error('Erreur calcul matching:', error);
      throw error;
    }
  }

  /**
   * Vérifie les filtres durs (éliminatoires)
   */
  checkHardFilters(candidate, offer) {
    const filters = {};
    let multiplier = 1.0;
    let distanceKm = null;

    // Vérifier la compatibilité du type de contrat
    if (offer.contract_type && candidate.preferred_contracts && candidate.preferred_contracts.length > 0) {
      const contractMatch = candidate.preferred_contracts.includes(offer.contract_type);
      filters.contract_compatible = contractMatch;
      
      if (!contractMatch) {
        return {
          score: 0,
          explanation: `Type de contrat incompatible : ${offer.contract_type} non accepté`,
          filters,
          multiplier: 0,
          distanceKm
        };
      }
    }

    // Vérifier la distance géographique
    if (candidate.users.latitude && candidate.users.longitude && 
        offer.latitude && offer.longitude) {
      
      distanceKm = this.calculateDistance(
        candidate.users.latitude, candidate.users.longitude,
        offer.latitude, offer.longitude
      );

      const maxDistance = candidate.mobility_km || 50; // 50km par défaut
      filters.distance_km = distanceKm;
      filters.max_distance_km = maxDistance;

      if (distanceKm > maxDistance) {
        // Malus fort mais pas éliminatoire
        const distancePenalty = Math.min(0.8, (distanceKm - maxDistance) / maxDistance);
        multiplier = Math.max(0.2, 1 - distancePenalty);
      }
    }

    return {
      score: 1,
      explanation: 'Critères durs respectés',
      filters,
      multiplier,
      distanceKm
    };
  }

  /**
   * Calcule la correspondance des compétences
   */
  calculateSkillsMatch(candidate, offer) {
    const candidateSkills = candidate.candidate_skills || [];
    const offerSkills = offer.job_offer_skills || [];

    if (offerSkills.length === 0) {
      return {
        score: 0.5, // Score neutre si pas de compétences définies
        matched: [],
        missing: [],
        details: 'Aucune compétence spécifiée pour cette offre'
      };
    }

    const matched = [];
    const missing = [];
    let totalWeight = 0;
    let matchedWeight = 0;

    // Analyser chaque compétence requise
    offerSkills.forEach(offerSkill => {
      const weight = offerSkill.is_required ? 2 : 1; // Compétences requises pèsent plus
      totalWeight += weight;

      const candidateSkill = candidateSkills.find(cs => 
        cs.skills.id === offerSkill.skills.id ||
        cs.skills.slug === offerSkill.skills.slug
      );

      if (candidateSkill) {
        matched.push({
          skill: offerSkill.skills.display_name,
          level: candidateSkill.proficiency_level,
          required: offerSkill.is_required
        });
        matchedWeight += weight;
      } else {
        missing.push({
          skill: offerSkill.skills.display_name,
          required: offerSkill.is_required
        });
      }
    });

    const score = totalWeight > 0 ? matchedWeight / totalWeight : 0;

    return {
      score,
      matched,
      missing,
      details: `${matched.length}/${offerSkills.length} compétences correspondantes`
    };
  }

  /**
   * Calcule l'alignement d'expérience
   */
  calculateExperienceMatch(candidate, offer) {
    const candidateExp = candidate.experience_years || 0;
    const requiredExp = offer.experience_min || 0;

    if (requiredExp === 0) {
      return {
        score: 1.0,
        details: 'Aucune expérience requise'
      };
    }

    if (candidateExp >= requiredExp) {
      // Bonus léger si plus d'expérience que requis
      const bonus = Math.min(0.2, (candidateExp - requiredExp) / requiredExp * 0.1);
      return {
        score: Math.min(1.0, 1.0 + bonus),
        details: `${candidateExp} ans d'expérience (${requiredExp} requis)`
      };
    } else {
      // Malus si moins d'expérience
      const penalty = (requiredExp - candidateExp) / requiredExp;
      return {
        score: Math.max(0.3, 1.0 - penalty),
        details: `${candidateExp} ans d'expérience (${requiredExp} requis)`
      };
    }
  }

  /**
   * Calcule les bonus/malus additionnels
   */
  calculateBonus(candidate, offer) {
    let bonusScore = 0.5; // Score neutre de base
    const details = [];

    // Bonus pour la localisation (même ville)
    if (candidate.users.city && offer.city) {
      if (candidate.users.city.toLowerCase() === offer.city.toLowerCase()) {
        bonusScore += 0.3;
        details.push('Même ville');
      }
    }

    // Bonus pour le titre du poste correspondant
    if (candidate.title && offer.title) {
      const titleSimilarity = this.calculateTextSimilarity(candidate.title, offer.title);
      if (titleSimilarity > 0.5) {
        bonusScore += 0.2;
        details.push('Titre de poste similaire');
      }
    }

    return {
      score: Math.min(1.0, bonusScore),
      details: details.join(', ') || 'Aucun bonus particulier'
    };
  }

  /**
   * Génère une explication lisible du score
   */
  generateExplanation({ score, skillsResult, experienceResult, hardFiltersResult, candidate, offer }) {
    const parts = [];

    // Score principal
    parts.push(`Score ${score}`);

    // Compétences
    if (skillsResult.matched.length > 0) {
      parts.push(`${skillsResult.matched.length} compétence(s) correspondante(s)`);
    }
    
    if (skillsResult.missing.length > 0) {
      const requiredMissing = skillsResult.missing.filter(m => m.required);
      if (requiredMissing.length > 0) {
        parts.push(`manque ${requiredMissing.map(m => m.skill).join(', ')}`);
      }
    }

    // Distance
    if (hardFiltersResult.distanceKm !== null) {
      parts.push(`éloigné de ${Math.round(hardFiltersResult.distanceKm)} km`);
    }

    // Expérience
    if (experienceResult.details && !experienceResult.details.includes('Aucune')) {
      parts.push(experienceResult.details.toLowerCase());
    }

    return parts.join(', ');
  }

  /**
   * Calcule la distance entre deux points géographiques
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Calcule la similarité entre deux textes
   */
  calculateTextSimilarity(text1, text2) {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  /**
   * Génère un hash des inputs pour la traçabilité
   */
  generateInputsHash(candidate, offer) {
    const inputs = {
      candidate_id: candidate.users.id,
      offer_id: offer.id,
      candidate_skills: candidate.candidate_skills?.map(cs => cs.skills.id).sort(),
      offer_skills: offer.job_offer_skills?.map(os => os.skills.id).sort(),
      experience_years: candidate.experience_years,
      experience_min: offer.experience_min,
      mobility_km: candidate.mobility_km,
      timestamp: Math.floor(Date.now() / (1000 * 60 * 60)) // Hash par heure
    };

    return crypto.createHash('md5').update(JSON.stringify(inputs)).digest('hex');
  }
}

// Instance singleton
const matchingService = new MatchingService();

// Fonction exportée
const calculateMatchingScore = (candidate, offer) => matchingService.calculateMatchingScore(candidate, offer);

module.exports = {
  calculateMatchingScore,
  MatchingService
};
