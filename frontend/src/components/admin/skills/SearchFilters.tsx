import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

interface SearchFiltersProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: FilterState) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  loading?: boolean;
  totalResults?: number;
}

export interface FilterState {
  category?: string;
  usageLevel?: 'unused' | 'low' | 'medium' | 'high';
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  onSearch,
  onFilterChange,
  onSortChange,
  loading = false,
  totalResults = 0
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({});
  const [sortBy, setSortBy] = useState('display_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  // Notify parent of sort changes
  useEffect(() => {
    onSortChange(sortBy, sortOrder);
  }, [sortBy, sortOrder, onSortChange]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setSortBy('display_name');
    setSortOrder('asc');
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined) || searchQuery;

  const categories = [
    { value: 'technique', label: 'Technique' },
    { value: 'comportemental', label: 'Comportemental' },
    { value: 'transversal', label: 'Transversal' },
    { value: 'linguistique', label: 'Linguistique' }
  ];

  const usageLevels = [
    { value: 'unused', label: 'Non utilisée' },
    { value: 'low', label: 'Peu utilisée (< 5)' },
    { value: 'medium', label: 'Utilisée (5-20)' },
    { value: 'high', label: 'Très utilisée (> 20)' }
  ];

  const sortOptions = [
    { value: 'display_name', label: 'Nom' },
    { value: 'created_at', label: 'Date de création' },
    { value: 'updated_at', label: 'Dernière modification' },
    { value: 'usage_count', label: 'Utilisation' }
  ];

  return (
    <div className="space-y-4">
      {/* Barre de recherche principale */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Champ de recherche */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher une compétence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-10 w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              disabled={loading}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center group"
                aria-label="Effacer la recherche"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </button>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:flex-shrink-0">
            {/* Bouton filtres */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-outline flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all ${hasActiveFilters
                ? 'ring-2 ring-blue-500 bg-blue-50 text-blue-700 border-blue-300'
                : 'hover:bg-gray-50'
                }`}
            >
              <FunnelIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Filtres</span>
              <span className="sm:hidden">Filtrer</span>
              {hasActiveFilters && (
                <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 font-semibold">
                  {Object.values(filters).filter(v => v !== undefined).length + (searchQuery ? 1 : 0)}
                </span>
              )}
            </button>

            {/* Sélecteur de tri */}
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:border-gray-400 transition-colors">
              <AdjustmentsHorizontalIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="form-select text-sm border-0 p-0 focus:ring-0 bg-transparent cursor-pointer w-full sm:w-auto"
                disabled={loading}
              >
                {sortOptions.map(option => (
                  <React.Fragment key={option.value}>
                    <option value={`${option.value}-asc`}>
                      {option.label} (A-Z)
                    </option>
                    <option value={`${option.value}-desc`}>
                      {option.label} (Z-A)
                    </option>
                  </React.Fragment>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Résultats et actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-4 pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            {loading ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Recherche en cours...</span>
              </div>
            ) : (
              <span>
                <span className="font-semibold text-gray-900">{totalResults}</span> compétence{totalResults !== 1 ? 's' : ''} trouvée{totalResults !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors group"
            >
              <XMarkIcon className="h-4 w-4 group-hover:rotate-90 transition-transform" />
              Effacer les filtres
            </button>
          )}
        </div>
      </div>

      {/* Panel de filtres avancés */}
      {showFilters && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm border-2 border-blue-100 overflow-hidden animate-slide-in-bottom">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white bg-opacity-20 rounded-lg">
                  <FunnelIcon className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-base font-semibold text-white">Filtres avancés</h3>
              </div>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                aria-label="Fermer les filtres"
              >
                <XMarkIcon className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Catégorie */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Catégorie
                </label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="form-select w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white shadow-sm"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Niveau d'utilisation */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Niveau d'utilisation
                </label>
                <select
                  value={filters.usageLevel || ''}
                  onChange={(e) => handleFilterChange('usageLevel', e.target.value)}
                  className="form-select w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white shadow-sm"
                >
                  <option value="">Tous les niveaux</option>
                  {usageLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Placeholder pour futur filtre */}
              <div className="space-y-2 hidden lg:block">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  Autres filtres
                </label>
                <div className="text-xs text-gray-500 italic p-3 bg-white rounded-lg border border-dashed border-gray-300">
                  Disponible prochainement
                </div>
              </div>
            </div>

            {/* Actions du panel */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6 pt-4 border-t border-blue-200">
              <div className="text-xs text-gray-600">
                <span className="font-semibold">{Object.values(filters).filter(v => v !== undefined).length}</span> filtre{Object.values(filters).filter(v => v !== undefined).length > 1 ? 's' : ''} actif{Object.values(filters).filter(v => v !== undefined).length > 1 ? 's' : ''}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={clearFilters}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Réinitialiser
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Appliquer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
