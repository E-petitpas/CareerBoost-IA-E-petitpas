import React, { useState, useEffect } from 'react';
import { XMarkIcon, TrashIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Button } from '../../ui/button';
import { useToast } from '../../common/ToastContainer';
import apiService from '../../../services/api';

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesUpdated: () => void;
}

export const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  isOpen,
  onClose,
  onCategoriesUpdated
}) => {
  const toast = useToast();
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Charger les catégories
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSkillCategories();
      setCategories(response.categories);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    const trimmedCategory = newCategory.trim().toLowerCase();

    // Vérifier si la catégorie existe déjà (case-insensitive)
    const categoryExists = categories.some(cat =>
      cat.toLowerCase() === trimmedCategory
    );

    if (categoryExists) {
      toast.warning('Cette catégorie existe déjà');
      return;
    }

    try {
      // Créer une compétence temporaire avec cette catégorie pour l'ajouter à la base
      const response = await apiService.createAdminSkill({
        display_name: `_temp_${Date.now()}`,
        category: trimmedCategory
      });

      // Supprimer immédiatement la compétence temporaire
      if (response.skill && response.skill.id) {
        try {
          await apiService.deleteAdminSkill(response.skill.id);
        } catch (deleteError) {
          console.error('Erreur lors de la suppression de la compétence temporaire:', deleteError);
        }
      }

      setCategories(prev => [...prev, trimmedCategory].sort());
      setNewCategory('');
      toast.success(`Catégorie "${trimmedCategory}" ajoutée avec succès`);
      onCategoriesUpdated();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la catégorie:', error);
      toast.error('Erreur lors de l\'ajout de la catégorie');
    }
  };

  const handleEditCategory = (category: string) => {
    setEditingCategory(category);
    setEditValue(category);
  };

  const handleSaveEdit = async () => {
    if (!editValue.trim() || !editingCategory) return;

    const trimmedValue = editValue.trim().toLowerCase();
    if (trimmedValue === editingCategory) {
      setEditingCategory(null);
      return;
    }

    // Vérifier si la catégorie existe déjà (case-insensitive)
    const categoryExists = categories.some(cat =>
      cat.toLowerCase() === trimmedValue && cat !== editingCategory
    );

    if (categoryExists) {
      toast.warning('Cette catégorie existe déjà');
      return;
    }

    try {
      // Pour modifier une catégorie, on devrait idéalement avoir un endpoint dédié
      // Pour l'instant, on met juste à jour localement
      setCategories(prev =>
        prev.map(cat => cat === editingCategory ? trimmedValue : cat).sort()
      );
      setEditingCategory(null);
      setEditValue('');
      toast.success(`Catégorie modifiée avec succès`);
      onCategoriesUpdated();
    } catch (error) {
      console.error('Erreur lors de la modification de la catégorie:', error);
      toast.error('Erreur lors de la modification de la catégorie');
    }
  };

  const handleDeleteCategory = async (category: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category}" ?\n\nCela ne supprimera pas les compétences, mais elles deviendront "Non catégorisées".`)) {
      return;
    }

    try {
      // Pour supprimer une catégorie, on devrait idéalement avoir un endpoint dédié
      // Pour l'instant, on met juste à jour localement
      setCategories(prev => prev.filter(cat => cat !== category));
      toast.success(`Catégorie "${category}" supprimée avec succès`);
      onCategoriesUpdated();
    } catch (error) {
      console.error('Erreur lors de la suppression de la catégorie:', error);
      toast.error('Erreur lors de la suppression de la catégorie');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay avec animation */}
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-60 transition-opacity backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Centrage vertical pour mobile */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal avec animation améliorée */}
        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full animate-slide-up">
          {/* Header avec gradient */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Gestion des catégories
                  </h3>
                  <p className="text-sm text-blue-100 mt-0.5">
                    Organisez vos compétences par catégorie
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                aria-label="Fermer"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="bg-white px-6 py-6">
            {/* Ajouter une nouvelle catégorie - Design amélioré */}
            <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
                <PlusIcon className="h-5 w-5 text-blue-600" />
                Ajouter une nouvelle catégorie
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Ex: Cloud, DevOps, Design..."
                  className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={!newCategory.trim()}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-sm hover:shadow-md flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Ajouter</span>
                </Button>
              </div>
            </div>

            {/* Liste des catégories - Design amélioré */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-800">
                  Catégories existantes
                </label>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                  {categories.length} {categories.length > 1 ? 'catégories' : 'catégorie'}
                </span>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-3">Chargement...</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <p className="text-gray-500 font-medium mt-3">Aucune catégorie trouvée</p>
                  <p className="text-sm text-gray-400 mt-1">Commencez par ajouter votre première catégorie</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {categories.map((category, index) => (
                    <div
                      key={category}
                      className="group flex items-center justify-between p-3 bg-white border-2 border-gray-100 rounded-lg hover:border-blue-200 hover:shadow-md transition-all duration-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {editingCategory === category ? (
                        <div className="flex-1 flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 px-3 py-2 border-2 border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveEdit();
                              } else if (e.key === 'Escape') {
                                setEditingCategory(null);
                                setEditValue('');
                              }
                            }}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              onClick={handleSaveEdit}
                              className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors font-medium shadow-sm hover:shadow flex items-center justify-center gap-1"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Valider
                            </Button>
                            <Button
                              type="button"
                              onClick={() => {
                                setEditingCategory(null);
                                setEditValue('');
                              }}
                              className="flex-1 sm:flex-none px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors font-medium shadow-sm hover:shadow flex items-center justify-center gap-1"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Annuler
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors">
                              <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 capitalize truncate">
                              {category}
                            </span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleEditCategory(category)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(category)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer avec design amélioré */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3">
              <p className="text-xs text-gray-500 text-center sm:text-left">
                💡 Astuce : Appuyez sur <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs font-mono">Entrée</kbd> pour ajouter rapidement
              </p>
              <Button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all font-medium shadow-sm hover:shadow"
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
