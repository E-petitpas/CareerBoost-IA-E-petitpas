import React, { useState } from 'react';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { OfferSearchFilters, Skill } from '../../types';

interface SearchBarProps {
  filters: OfferSearchFilters;
  onFiltersChange: (newFilters: Partial<OfferSearchFilters>) => void;
  onSearch: () => void;
  loading?: boolean;
  availableSkills?: Skill[];
  onClearFilters: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  loading = false,
  availableSkills = [],
  onClearFilters
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);

  // Fonction helper pour fermer l'accordion après changement de filtre
  const handleFilterChangeAndClose = (newFilters: Partial<OfferSearchFilters>) => {
    onFiltersChange(newFilters);
    setShowAdvancedFilters(false);
  };

  const handleSkillAdd = (skill: Skill) => {
    const currentSkills = filters.skills || [];
    if (!currentSkills.includes(skill.slug)) {
      onFiltersChange({ skills: [...currentSkills, skill.slug] });
    }
    setSkillSearchQuery('');
    setShowSkillDropdown(false);
    // Fermer l'accordion après changement de filtre
    setShowAdvancedFilters(false);
  };

  const handleSkillRemove = (skillSlug: string) => {
    const currentSkills = filters.skills || [];
    onFiltersChange({ skills: currentSkills.filter(s => s !== skillSlug) });
    // Fermer l'accordion après changement de filtre
    setShowAdvancedFilters(false);
  };

  const getSkillDisplayName = (skillSlug: string) => {
    const skill = availableSkills.find(s => s.slug === skillSlug);
    return skill ? skill.display_name : skillSlug;
  };

  const hasActiveFilters = () => {
    return filters.near ||
      filters.contract_type ||
      filters.salary_min ||
      filters.salary_max ||
      filters.experience_min ||
      filters.experience_max ||
      (filters.skills && filters.skills.length > 0) ||
      filters.minScore ||
      filters.source ||
      filters.remote_work;
  };

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm rounded-md">
      <div className="p-4">
        {/* Filtres de base */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
          <div>
            <label className="form-label">Localisation</label>
            <div className="relative">
              <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                className="form-input pl-10"
                placeholder="Ville, région..."
                value={filters.near || ''}
                onChange={(e) => onFiltersChange({ near: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Rayon (km)</label>
            <select
              className="form-select"
              value={filters.radius || ''}
              onChange={(e) => onFiltersChange({ radius: e.target.value ? parseInt(e.target.value) : undefined })}
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
              onChange={(e) => onFiltersChange({ contract_type: e.target.value as any })}
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
              onChange={(e) => onFiltersChange({ sort: e.target.value as any })}
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

        {/* Boutons d'action */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
            Filtres avancés
            <ChevronDownIcon className={`h-4 w-4 ml-1 transform transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
          </button>

          <div className="flex space-x-3">
            {hasActiveFilters() && (
              <button
                onClick={onClearFilters}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                Effacer les filtres
              </button>
            )}
            <button
              onClick={onSearch}
              className="btn-primary"
              disabled={loading}
            >
              <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
              {loading ? 'Recherche...' : 'Rechercher'}
            </button>
          </div>
        </div>

        {/* Filtres avancés */}
        {showAdvancedFilters && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
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
                      onChange={(e) => handleFilterChangeAndClose({ salary_min: e.target.value ? parseInt(e.target.value) : undefined })}
                    />
                  </div>
                  <div>
                    <label className="form-label text-sm">Maximum (€)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="80000"
                      value={filters.salary_max || ''}
                      onChange={(e) => handleFilterChangeAndClose({ salary_max: e.target.value ? parseInt(e.target.value) : undefined })}
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
                      onChange={(e) => handleFilterChangeAndClose({ experience_min: e.target.value ? parseInt(e.target.value) : undefined })}
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
                      onChange={(e) => handleFilterChangeAndClose({ experience_max: e.target.value ? parseInt(e.target.value) : undefined })}
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
                  onChange={(e) => handleFilterChangeAndClose({ minScore: e.target.value ? parseInt(e.target.value) : undefined })}
                >
                  <option value="">Tous</option>
                  <option value="50">50%+</option>
                  <option value="60">60%+</option>
                  <option value="70">70%+</option>
                  <option value="80">80%+</option>
                  <option value="90">90%+</option>
                </select>
              </div>

              {/* Type de ressource */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Type de ressource</h4>
                <select
                  className="form-select"
                  value={filters.source || ''}
                  onChange={(e) => handleFilterChangeAndClose({ source: e.target.value as 'INTERNAL' | 'EXTERNAL' | undefined })}
                >
                  <option value="">Toutes les offres</option>
                  <option value="INTERNAL">Offres internes</option>
                  <option value="EXTERNAL">France Travail</option>
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
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
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
            <div className="mt-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={filters.remote_work || false}
                  onChange={(e) => handleFilterChangeAndClose({ remote_work: e.target.checked })}
                />
                <span className="ml-2 text-sm text-gray-700">Télétravail possible</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
