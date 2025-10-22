import React, { useState, useEffect, useCallback } from 'react';
import {
  PlusIcon,
  CogIcon,
  ExclamationTriangleIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/button';
import { StatsWidget } from '../../components/admin/skills/StatsWidget';
import { SearchFilters } from '../../components/admin/skills/SearchFilters';
import { SkillCard } from '../../components/admin/skills/SkillCard';
import { SkillModal } from '../../components/admin/skills/SkillModal';
import { SkillUsageModal } from '../../components/admin/skills/SkillUsageModal';
import { CategoryManagementModal } from '../../components/admin/skills/CategoryManagementModal';
import Pagination from '../../components/common/Pagination';
import { useToast } from '../../components/common/ToastContainer';
import apiService from '../../services/api';
import { Skill } from '../../types';
import { FilterState } from '../../components/admin/skills/SearchFilters';

interface SkillStats {
  totalSkills: number;
  topSkills: Skill[];
  skillsByCategory: any[];
  usageRate: number;
}

const AdminSkills: React.FC = () => {
  const toast = useToast();

  // États principaux
  const [skills, setSkills] = useState<Skill[]>([]);
  const [stats, setStats] = useState<SkillStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États de pagination et filtres
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({});
  const [sortBy, setSortBy] = useState('display_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // États des modales
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [usageData, setUsageData] = useState<any>(null);
  const [processingSkillId, setProcessingSkillId] = useState<string | null>(null);

  // États des actions
  // const [duplicates, setDuplicates] = useState<Skill[][]>([]);
  // const [showDuplicates, setShowDuplicates] = useState(false);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStats(),
        loadSkills()
      ]);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStats = async () => {
    try {
      const response = await apiService.getAdminSkillsStats();
      setStats(response.stats);
    } catch (err: any) {
      console.error('Erreur chargement stats:', err);
    }
  };

  const loadSkills = useCallback(async () => {
    try {
      const params = {
        page: currentPage,
        limit: 20,
        search: searchQuery || undefined,
        category: filters.category,
        sortBy,
        sortOrder
      };

      const response = await apiService.getAdminSkills(params);
      setSkills(response.skills);
      setTotalPages(response.pagination.totalPages);
      setTotalResults(response.pagination.total);
    } catch (err: any) {
      console.error('Erreur chargement compétences:', err);
      setError(err.message || 'Erreur lors du chargement des compétences');
    }
  }, [currentPage, searchQuery, filters, sortBy, sortOrder]);

  // Chargement initial
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Rechargement des compétences quand les filtres changent
  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const loadDuplicates = async () => {
    try {
      const response = await apiService.getSkillDuplicates();
      // TODO: Implémenter l'affichage des doublons
      console.log('Doublons détectés:', response.duplicates);
      if (response.duplicates && response.duplicates.length > 0) {
        toast.info(`${response.duplicates.length} doublon(s) détecté(s)`);
      } else {
        toast.success('Aucun doublon détecté');
      }
    } catch (err: any) {
      console.error('Erreur chargement doublons:', err);
      toast.error('Erreur lors de la détection des doublons');
    }
  };

  // Handlers pour les filtres et recherche
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  }, []);

  // Handlers pour les actions sur les compétences
  const handleCreateSkill = () => {
    setEditingSkill(null);
    setShowSkillModal(true);
  };

  const handleEditSkill = (skill: Skill) => {
    setEditingSkill(skill);
    setShowSkillModal(true);
  };

  const handleSaveSkill = async (skillData: { display_name: string; category?: string; description?: string; is_active?: boolean }) => {
    try {
      if (editingSkill) {
        await apiService.updateAdminSkill(editingSkill.id, skillData);
        toast.success(`Compétence "${skillData.display_name}" modifiée avec succès`);
      } else {
        await apiService.createAdminSkill(skillData);
        toast.success(`Compétence "${skillData.display_name}" créée avec succès`);
      }

      await Promise.all([loadSkills(), loadStats()]);
      setShowSkillModal(false);
      setEditingSkill(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Erreur lors de la sauvegarde';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const handleDeleteSkill = async (skill: Skill) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la compétence "${skill.display_name}" ?`)) {
      return;
    }

    try {
      setProcessingSkillId(skill.id);
      await apiService.deleteAdminSkill(skill.id);
      toast.success(`Compétence "${skill.display_name}" supprimée avec succès`);
      await Promise.all([loadSkills(), loadStats()]);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Erreur lors de la suppression';
      toast.error(errorMessage);
    } finally {
      setProcessingSkillId(null);
    }
  };



  const handleViewUsage = async (skill: Skill) => {
    try {
      setUsageData(null);
      setShowUsageModal(true);
      const response = await apiService.getSkillUsage(skill.id);
      setUsageData(response);
    } catch (err: any) {
      console.error('Erreur chargement usage:', err);
      toast.error('Erreur lors du chargement des données d\'utilisation');
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Section 1: En-tête et Métriques */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
            <div className="text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Gestion des Compétences
              </h1>
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                Gérez le référentiel de compétences de la plateforme CareerBoost
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:flex-shrink-0">
              <Button
                onClick={loadDuplicates}
                variant="outline"
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <DocumentDuplicateIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Détecter doublons</span>
                <span className="sm:hidden">Doublons</span>
              </Button>
              <Button
                onClick={() => loadInitialData()}
                variant="outline"
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Actualiser
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-6 alert-error flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="text-sm sm:text-base">{error}</span>
            </div>
          )}

          {/* Métriques */}
          {stats && <StatsWidget stats={stats} loading={loading} />}
        </div>

        {/* Section 2: Barre d'Actions Principales */}
        <div className="px-4 sm:px-0 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <Button
                onClick={handleCreateSkill}
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <PlusIcon className="h-4 w-4" />
                Ajouter une compétence
              </Button>

              <Button
                variant="outline"
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
                onClick={() => setShowCategoryModal(true)}
              >
                <CogIcon className="h-4 w-4" />
                Gérer catégories
              </Button>
            </div>

            <div className="text-sm text-gray-500 text-center sm:text-right whitespace-nowrap">
              <span className="font-semibold text-gray-700">{totalResults}</span> compétence{totalResults !== 1 ? 's' : ''} au total
            </div>
          </div>
        </div>

        {/* Section 3 & 4: Filtres et Liste des Compétences */}
        <div className="px-4 sm:px-0 space-y-6">
          {/* Filtres */}
          <SearchFilters
            onSearch={handleSearch}
            onFilterChange={handleFilterChange}
            onSortChange={handleSortChange}
            loading={loading}
            totalResults={totalResults}
          />

          {/* Liste des compétences */}
          {skills.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-200">
              <div className="max-w-md mx-auto">
                <div className="p-4 bg-gray-50 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                  <CogIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  Aucune compétence trouvée
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {searchQuery || Object.keys(filters).length > 0
                    ? 'Essayez de modifier vos critères de recherche ou réinitialisez les filtres'
                    : 'Commencez par ajouter votre première compétence pour enrichir votre référentiel'
                  }
                </p>
                {!searchQuery && Object.keys(filters).length === 0 && (
                  <div className="mt-6">
                    <Button onClick={handleCreateSkill} className="inline-flex items-center gap-2">
                      <PlusIcon className="h-4 w-4" />
                      Ajouter une compétence
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {skills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    onEdit={handleEditSkill}
                    onDelete={handleDeleteSkill}
                    onViewUsage={handleViewUsage}
                    isProcessing={processingSkillId === skill.id}
                  />
                ))}
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalResults}
                itemsPerPage={20}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>

      {/* Modales */}
      <SkillModal
        isOpen={showSkillModal}
        onClose={() => {
          setShowSkillModal(false);
          setEditingSkill(null);
        }}
        onSave={handleSaveSkill}
        skill={editingSkill}
        loading={processingSkillId !== null}
      />

      <SkillUsageModal
        isOpen={showUsageModal}
        onClose={() => {
          setShowUsageModal(false);
          setUsageData(null);
        }}
        usage={usageData}
        loading={!usageData && showUsageModal}
      />

      {/* Modal de gestion des catégories */}
      <CategoryManagementModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onCategoriesUpdated={() => {
          loadInitialData();
        }}
      />
    </div>
  );
};

export default AdminSkills;
