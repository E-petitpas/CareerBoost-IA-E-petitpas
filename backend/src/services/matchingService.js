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
   * Selon le cahier des charges : les compétences obligatoires ont un poids beaucoup plus important
   */
  calculateSkillsMatch(candidate, offer) {
    const candidateSkills = candidate.candidate_skills || [];
    const offerSkills = offer.job_offer_skills || [];

    // Log de débogage
    console.log('🔍 DEBUG MATCHING - Offre:', offer.title);
    console.log('📊 Compétences candidat:', candidateSkills.map(cs => ({
      id: cs.skills?.id,
      slug: cs.skills?.slug,
      name: cs.skills?.display_name
    })));
    console.log('📋 Compétences offre:', offerSkills.map(os => ({
      id: os.skills?.id,
      slug: os.skills?.slug,
      name: os.skills?.display_name,
      required: os.is_required
    })));

    if (offerSkills.length === 0) {
      console.log('⚠️ ATTENTION : Cette offre n\'a AUCUNE compétence définie !');
      console.log('⚠️ Score neutre de 50% appliqué pour les compétences');
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
    let requiredMissingCount = 0;

    // Analyser chaque compétence requise
    offerSkills.forEach(offerSkill => {
      const weight = offerSkill.is_required ? 3 : 1; // Compétences obligatoires pèsent 3x plus
      totalWeight += weight;

      // Matching amélioré : par ID, slug, ou nom (case-insensitive)
      const candidateSkill = candidateSkills.find(cs => {
        if (!cs.skills || !offerSkill.skills) return false;

        // Match par ID
        if (cs.skills.id === offerSkill.skills.id) return true;

        // Match par slug
        if (cs.skills.slug === offerSkill.skills.slug) return true;

        // Match par nom (case-insensitive et trim)
        const candidateName = (cs.skills.display_name || '').toLowerCase().trim();
        const offerName = (offerSkill.skills.display_name || '').toLowerCase().trim();
        if (candidateName === offerName) return true;

        // Match partiel (pour gérer "Java" vs "Java EE")
        if (candidateName && offerName) {
          // Si l'un contient l'autre (ex: "Java" dans "Java EE")
          if (candidateName.includes(offerName) || offerName.includes(candidateName)) {
            console.log(`✅ Match partiel trouvé: "${candidateName}" ≈ "${offerName}"`);
            return true;
          }
        }

        return false;
      });

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
        if (offerSkill.is_required) {
          requiredMissingCount++;
        }
      }
    });

    let score = totalWeight > 0 ? matchedWeight / totalWeight : 0;

    // Pénalité supplémentaire si compétences obligatoires manquantes
    // Chaque compétence obligatoire manquante réduit le score de 15%
    if (requiredMissingCount > 0) {
      const penalty = Math.min(0.6, requiredMissingCount * 0.15); // Maximum -60%
      score = score * (1 - penalty);
    }

    return {
      score: Math.max(0, score), // S'assurer que le score ne soit pas négatif
      matched,
      missing,
      details: `${matched.length}/${offerSkills.length} compétences correspondantes${requiredMissingCount > 0 ? `, ${requiredMissingCount} obligatoire(s) manquante(s)` : ''}`
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
   * Génère une explication lisible du score selon le format du cahier des charges
   * Format attendu: "Score 72 : vous correspondez sur 4 compétences, mais il manque Docker et vous êtes éloigné de 20 km."
   */
  generateExplanation({ score, skillsResult, experienceResult, hardFiltersResult, candidate, offer }) {
    const positiveParts = [];
    const negativeParts = [];

    // Vérifier si l'offre a des compétences définies
    const offerHasSkills = skillsResult.matched.length > 0 || skillsResult.missing.length > 0;

    // 1. Phrase principale sur les compétences correspondantes
    if (!offerHasSkills) {
      positiveParts.push(`cette offre n'a pas de compétences techniques définies, score basé sur l'expérience`);
    } else if (skillsResult.matched.length > 0) {
      // Ajouter les noms des compétences matchées (max 3)
      const matchedNames = skillsResult.matched.slice(0, 3).map(m => m.skills?.display_name).filter(Boolean);
      if (matchedNames.length > 0) {
        const skillsText = matchedNames.join(', ') + (skillsResult.matched.length > 3 ? '...' : '');
        positiveParts.push(`vous correspondez sur ${skillsResult.matched.length} compétence${skillsResult.matched.length > 1 ? 's' : ''} (${skillsText})`);
      } else {
        positiveParts.push(`vous correspondez sur ${skillsResult.matched.length} compétence${skillsResult.matched.length > 1 ? 's' : ''}`);
      }
    } else {
      negativeParts.push(`aucune compétence correspondante`);
    }

    // 2. Compétences manquantes (requises uniquement)
    if (skillsResult.missing.length > 0) {
      const requiredMissing = skillsResult.missing.filter(m => m.is_required);
      if (requiredMissing.length > 0) {
        const missingNames = requiredMissing.slice(0, 2).map(m => m.skills?.display_name).filter(Boolean);
        if (missingNames.length > 0) {
          const missingText = missingNames.join(' et ');
          const moreCount = requiredMissing.length - missingNames.length;
          if (moreCount > 0) {
            negativeParts.push(`il manque ${missingText} (et ${moreCount} autre${moreCount > 1 ? 's' : ''})`);
          } else {
            negativeParts.push(`il manque ${missingText}`);
          }
        }
      }
    }

    // 3. Distance géographique
    if (hardFiltersResult.distanceKm !== null) {
      const distanceRounded = Math.round(hardFiltersResult.distanceKm);
      negativeParts.push(`vous êtes éloigné de ${distanceRounded} km`);
    }

    // 4. Expérience (si pertinent)
    const candidateExp = candidate.experience_years || 0;
    const requiredExp = offer.experience_min || 0;
    if (requiredExp > 0 && candidateExp < requiredExp) {
      const expDiff = requiredExp - candidateExp;
      negativeParts.push(`${expDiff} an${expDiff > 1 ? 's' : ''} d'expérience en moins que requis`);
    }

    // Construire l'explication finale (1-2 phrases max)
    if (positiveParts.length === 0 && negativeParts.length === 0) {
      return `Score ${score} : profil général compatible avec l'offre.`;
    }

    // Construire la phrase selon le format du cahier des charges
    // Format: "Score X : [positif], mais [négatif1] et [négatif2]."
    let explanation = '';

    if (positiveParts.length > 0 && negativeParts.length > 0) {
      // Cas standard : points positifs + négatifs
      explanation = `${positiveParts.join(', ')}, mais ${negativeParts.join(' et ')}`;
    } else if (positiveParts.length > 0) {
      // Seulement des points positifs
      explanation = positiveParts.join(', ');
    } else {
      // Seulement des points négatifs
      explanation = negativeParts.join(', ');
    }

    return `Score ${score} : ${explanation}.`;
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
