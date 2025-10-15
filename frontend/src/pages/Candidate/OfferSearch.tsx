import React, { useState, useEffect } from 'react';
import { JobOffer, OfferSearchFilters, Skill } from '../../types';
import apiService from '../../services/api';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  BriefcaseIcon,
  CurrencyEuroIcon,
  CalendarIcon,
  FunnelIcon,
  BookmarkIcon,
  StarIcon,
  ChevronDownIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

const OfferSearch: React.FC = () => {
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [savedOffers, setSavedOffers] = useState<Set<string>>(new Set());
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [filters, setFilters] = useState<OfferSearchFilters>({
    page: 1,
    limit: 10,
    sort: 'relevance',
  });

  useEffect(() => {
    searchOffers();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadSavedOffers();
    loadAvailableSkills();
  }, []);

  const loadSavedOffers = async () => {
    try {
      const response = await apiService.getSavedOffers();
      setSavedOffers(new Set(response.data.map((offer: any) => offer.job_offer_id)));
    } catch (err) {
      console.error('Erreur lors du chargement des offres sauvegardées:', err);
    }
  };

  const loadAvailableSkills = async () => {
    try {
      const response = await apiService.getAllSkills();
      setAvailableSkills(response.skills || []);
    } catch (err) {
      console.error('Erreur lors du chargement des compétences:', err);
    }
  };

  const searchOffers = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Recherche offres avec filtres:', filters);
      const response = await apiService.searchOffers(filters);
      console.log('Réponse API searchOffers:', response);

      if (response && response.data) {
        setOffers(response.data);
      } else {
        console.error('Réponse API invalide:', response);
        setOffers([]);
      }
    } catch (err: any) {
      console.error('Erreur searchOffers:', err);
      setError(err.message || 'Erreur lors de la recherche d\'offres');
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<OfferSearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleSkillAdd = (skill: Skill) => {
    const currentSkills = filters.skills || [];
    if (!currentSkills.includes(skill.slug)) {
      handleFilterChange({ skills: [...currentSkills, skill.slug] });
    }
    setSkillSearchQuery('');
    setShowSkillDropdown(false);
  };

  const handleSkillRemove = (skillSlug: string) => {
    const currentSkills = filters.skills || [];
    handleFilterChange({ skills: currentSkills.filter(s => s !== skillSlug) });
  };

  const toggleSaveOffer = async (offerId: string) => {
    try {
      if (savedOffers.has(offerId)) {
        await apiService.unsaveOffer(offerId);
        setSavedOffers(prev => {
          const newSet = new Set(prev);
          newSet.delete(offerId);
          return newSet;
        });
      } else {
        await apiService.saveOffer(offerId);
        setSavedOffers(prev => {
          const newSet = new Set(prev);
          newSet.add(offerId);
          return newSet;
        });
      }
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleApply = async (offerId: string) => {
    try {
      console.log('Tentative de candidature pour offre:', offerId);

      const customMessage = prompt('Message personnalisé (optionnel):');
      if (customMessage === null) {
        // L'utilisateur a annulé
        return;
      }

      const result = await apiService.applyToOffer(offerId, customMessage || undefined);
      console.log('Candidature réussie:', result);

      alert('🎉 Candidature envoyée avec succès !');

      // Optionnel: rediriger vers la page de suivi des candidatures
      // window.location.href = '/applications';

    } catch (err: any) {
      console.error('Erreur candidature:', err);

      // Gestion des erreurs spécifiques
      if (err.response?.status === 409) {
        const retry = window.confirm('❌ Vous avez déjà postulé à cette offre. Voulez-vous supprimer votre candidature existante pour retester ?');
        if (retry) {
          try {
            await apiService.deleteTestApplication(offerId);
            alert('✅ Candidature supprimée. Vous pouvez maintenant postuler à nouveau.');
          } catch (deleteErr: any) {
            alert('❌ Erreur lors de la suppression: ' + (deleteErr.response?.data?.error || deleteErr.message));
          }
        }
      } else if (err.response?.status === 400) {
        alert('❌ Profil incomplet. Veuillez compléter votre profil avant de postuler.');
      } else {
        alert('❌ ' + (err.response?.data?.error || err.message || 'Erreur lors de la candidature'));
      }
    }
  };

  const clearAllFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      sort: 'relevance',
    });
  };

  const getSkillDisplayName = (skillSlug: string) => {
    const skill = availableSkills.find(s => s.slug === skillSlug);
    return skill ? skill.display_name : skillSlug;
  };

  const formatSalary = (min?: number, max?: number, currency = '€') => {
    if (!min && !max) return 'Salaire non spécifié';
    if (min && max) return `${min.toLocaleString()} - ${max.toLocaleString()} ${currency}`;
    if (min) return `À partir de ${min.toLocaleString()} ${currency}`;
    if (max) return `Jusqu'à ${max.toLocaleString()} ${currency}`;
    return '';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Recherche d'offres d'emploi
        </h1>

        {/* Filtres de recherche améliorés */}
        <div className="card mb-8">
          <div className="card-body">
            {/* Filtres de base */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="form-label">Localisation</label>
                <div className="relative">
                  <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    className="form-input pl-10"
                    placeholder="Ville, région..."
                    value={filters.near || ''}
                    onChange={(e) => handleFilterChange({ near: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Rayon (km)</label>
                <select
                  className="form-select"
                  value={filters.radius || ''}
                  onChange={(e) => handleFilterChange({ radius: e.target.value ? parseInt(e.target.value) : undefined })}
                >
                  <option value="">Tous</option>
                  <option value="10">10 km</option>
                  <option value="25">25 km</option>
                  <option value="50">50 km</option>
                  <option value="100">100 km</option>
                  <option value="200">200 km</option>
                </select>
              </div>

              <div>
                <label className="form-label">Type de contrat</label>
                <select
                  className="form-select"
                  value={filters.contract_type || ''}
                  onChange={(e) => handleFilterChange({ contract_type: e.target.value as any })}
                >
                  <option value="">Tous</option>
                  <option value="CDI">CDI</option>
                  <option value="CDD">CDD</option>
                  <option value="STAGE">Stage</option>
                  <option value="ALTERNANCE">Alternance</option>
                  <option value="FREELANCE">Freelance</option>
                  <option value="INTERIM">Intérim</option>
                </select>
              </div>

              <div>
                <label className="form-label">Tri par</label>
                <select
                  className="form-select"
                  value={filters.sort || 'relevance'}
                  onChange={(e) => handleFilterChange({ sort: e.target.value as any })}
                >
                  <option value="relevance">Pertinence</option>
                  <option value="date_desc">Plus récent</option>
                  <option value="date_asc">Plus ancien</option>
                  <option value="salary_desc">Salaire décroissant</option>
                  <option value="salary_asc">Salaire croissant</option>
                  <option value="score_desc">Score décroissant</option>
                </select>
              </div>
            </div>

            {/* Bouton filtres avancés */}
            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
                Filtres avancés
                <ChevronDownIcon className={`h-4 w-4 ml-1 transform transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
              </button>

              <div className="flex space-x-3">
                <button
                  onClick={clearAllFilters}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Effacer les filtres
                </button>
                <button
                  onClick={searchOffers}
                  className="btn-primary"
                  disabled={loading}
                >
                  <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                  {loading ? 'Recherche...' : 'Rechercher'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres avancés */}
        {showAdvancedFilters && (
          <div className="card mb-8">
            <div className="card-body">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Filtres avancés</h3>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Salaire */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Salaire</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="form-label text-sm">Minimum (€)</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="30000"
                        value={filters.salary_min || ''}
                        onChange={(e) => handleFilterChange({ salary_min: e.target.value ? parseInt(e.target.value) : undefined })}
                      />
                    </div>
                    <div>
                      <label className="form-label text-sm">Maximum (€)</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="80000"
                        value={filters.salary_max || ''}
                        onChange={(e) => handleFilterChange({ salary_max: e.target.value ? parseInt(e.target.value) : undefined })}
                      />
                    </div>
                  </div>
                </div>

                {/* Expérience */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Expérience</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="form-label text-sm">Minimum (années)</label>
                      <select
                        className="form-select"
                        value={filters.experience_min || ''}
                        onChange={(e) => handleFilterChange({ experience_min: e.target.value ? parseInt(e.target.value) : undefined })}
                      >
                        <option value="">Aucune</option>
                        <option value="0">Débutant</option>
                        <option value="1">1 an</option>
                        <option value="2">2 ans</option>
                        <option value="3">3 ans</option>
                        <option value="5">5 ans</option>
                        <option value="10">10 ans+</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label text-sm">Maximum (années)</label>
                      <select
                        className="form-select"
                        value={filters.experience_max || ''}
                        onChange={(e) => handleFilterChange({ experience_max: e.target.value ? parseInt(e.target.value) : undefined })}
                      >
                        <option value="">Illimitée</option>
                        <option value="1">1 an</option>
                        <option value="2">2 ans</option>
                        <option value="3">3 ans</option>
                        <option value="5">5 ans</option>
                        <option value="10">10 ans</option>
                        <option value="15">15 ans</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Score de matching */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Score de matching</h4>
                  <select
                    className="form-select"
                    value={filters.minScore || ''}
                    onChange={(e) => handleFilterChange({ minScore: e.target.value ? parseInt(e.target.value) : undefined })}
                  >
                    <option value="">Tous</option>
                    <option value="50">50%+</option>
                    <option value="60">60%+</option>
                    <option value="70">70%+</option>
                    <option value="80">80%+</option>
                    <option value="90">90%+</option>
                  </select>
                </div>
              </div>

              {/* Compétences */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-700 mb-3">Compétences requises</h4>

                {/* Compétences sélectionnées */}
                {filters.skills && filters.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {filters.skills.map((skillSlug) => (
                      <span
                        key={skillSlug}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {getSkillDisplayName(skillSlug)}
                        <button
                          onClick={() => handleSkillRemove(skillSlug)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Recherche de compétences */}
                <div className="relative">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Rechercher une compétence..."
                    value={skillSearchQuery}
                    onChange={(e) => setSkillSearchQuery(e.target.value)}
                    onFocus={() => setShowSkillDropdown(true)}
                  />

                  {showSkillDropdown && skillSearchQuery && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {availableSkills
                        .filter(skill =>
                          skill.display_name.toLowerCase().includes(skillSearchQuery.toLowerCase()) &&
                          !(filters.skills || []).includes(skill.slug)
                        )
                        .slice(0, 10)
                        .map((skill) => (
                          <button
                            key={skill.id}
                            onClick={() => handleSkillAdd(skill)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100"
                          >
                            {skill.display_name}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Options supplémentaires */}
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={filters.remote_work || false}
                      onChange={(e) => handleFilterChange({ remote_work: e.target.checked })}
                    />
                    <span className="ml-2 text-sm text-gray-700">Télétravail possible</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Résultats */}
        {error && (
          <div className="alert-error mb-6">
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="spinner w-8 h-8 mx-auto"></div>
            <p className="mt-2 text-gray-500">Recherche en cours...</p>
          </div>
        ) : !offers || offers.length === 0 ? (
          <div className="text-center py-12">
            <BriefcaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucune offre trouvée avec ces critères.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {offers && offers.map((offer) => (
              <div key={offer.id} className="card hover:shadow-medium transition-shadow">
                <div className="card-body">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {offer.title}
                        </h3>
                        {offer.score && (
                          <span className={`badge ${
                            offer.score >= 90 ? 'badge-success' :
                            offer.score >= 70 ? 'badge-warning' :
                            'badge-secondary'
                          }`}>
                            {offer.score}% de match
                          </span>
                        )}
                      </div>

                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <span className="font-medium">{offer.companies.name}</span>
                        {offer.city && (
                          <>
                            <span className="mx-2">•</span>
                            <MapPinIcon className="h-4 w-4 mr-1" />
                            {offer.city}
                          </>
                        )}
                        {offer.contract_type && (
                          <>
                            <span className="mx-2">•</span>
                            <BriefcaseIcon className="h-4 w-4 mr-1" />
                            {offer.contract_type}
                          </>
                        )}
                      </div>

                      <p className="text-gray-700 mb-3 line-clamp-3">
                        {offer.description}
                      </p>

                      {/* Compétences requises */}
                      {offer.job_offer_skills && offer.job_offer_skills.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {offer.job_offer_skills.slice(0, 5).map((skill, index) => (
                              <span
                                key={index}
                                className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                                  skill.is_required
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {skill.skills.display_name}
                                {skill.is_required && <span className="ml-1">*</span>}
                              </span>
                            ))}
                            {offer.job_offer_skills.length > 5 && (
                              <span className="text-xs text-gray-500">
                                +{offer.job_offer_skills.length - 5} autres
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <CurrencyEuroIcon className="h-4 w-4 mr-1" />
                            {formatSalary(offer.salary_min, offer.salary_max, offer.currency)}
                          </div>
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            Publié le {formatDate(offer.published_at)}
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleSaveOffer(offer.id)}
                            className={`btn-outline btn-sm ${savedOffers.has(offer.id) ? 'text-yellow-600 border-yellow-600' : ''}`}
                            title={savedOffers.has(offer.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                          >
                            {savedOffers.has(offer.id) ? (
                              <BookmarkSolidIcon className="h-4 w-4" />
                            ) : (
                              <BookmarkIcon className="h-4 w-4" />
                            )}
                          </button>
                          <button className="btn-outline btn-sm">
                            Voir détails
                          </button>
                          <button
                            onClick={() => handleApply(offer.id)}
                            className="btn-primary btn-sm"
                            title="Candidature en 1 clic"
                          >
                            Postuler
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfferSearch;
