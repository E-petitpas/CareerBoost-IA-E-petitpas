import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Skill } from '../../../types';
import apiService from '../../../services/api';
import { Button } from '../../ui/button';

// Type pour les données du formulaire (sans les champs auto-générés)
interface SkillFormData {
  display_name: string;
  category?: string;
}

interface SkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (skill: SkillFormData) => Promise<void>;
  skill?: Skill | null;
  loading?: boolean;
}

export const SkillModal: React.FC<SkillModalProps> = ({
  isOpen,
  onClose,
  onSave,
  skill = null,
  loading = false
}) => {
  const [formData, setFormData] = useState<SkillFormData>({
    display_name: '',
    category: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes or skill changes
  useEffect(() => {
    if (isOpen) {
      if (skill) {
        setFormData({
          display_name: skill.display_name || '',
          category: skill.category || ''
        });
      } else {
        setFormData({
          display_name: '',
          category: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, skill]);

  // Charger les catégories depuis l'API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await apiService.getSkillCategories();
        setCategories(response.categories);
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
        // Catégories par défaut en cas d'erreur
        setCategories(['technique', 'comportemental', 'transversal', 'linguistique', 'certification']);
      }
    };

    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.display_name.trim()) {
      newErrors.display_name = 'Le nom de la compétence est requis';
    } else if (formData.display_name.trim().length < 1) {
      newErrors.display_name = 'Le nom doit contenir au moins 1 caractère';
    }



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        ...formData,
        display_name: formData.display_name.trim(),
        category: formData.category || undefined
      });
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: any) => {
    if (field === 'category' && value === '__new__') {
      setShowNewCategoryInput(true);
      setFormData(prev => ({ ...prev, [field]: '' }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
      setShowNewCategoryInput(false);
    }
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleNewCategoryAdd = () => {
    if (newCategory.trim()) {
      const trimmedCategory = newCategory.trim().toLowerCase();
      if (!categories.includes(trimmedCategory)) {
        setCategories(prev => [...prev, trimmedCategory].sort());
      }
      setFormData(prev => ({ ...prev, category: trimmedCategory }));
      setNewCategory('');
      setShowNewCategoryInput(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {skill ? 'Modifier la compétence' : 'Ajouter une compétence'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nom de la compétence */}
              <div>
                <label className="form-label form-label-required">
                  Nom de la compétence
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => handleChange('display_name', e.target.value)}
                  className={`form-input w-full ${errors.display_name ? 'border-red-300' : ''}`}
                  placeholder="Ex: JavaScript, Communication, Gestion de projet..."
                  disabled={loading}
                />
                {errors.display_name && (
                  <p className="form-error">{errors.display_name}</p>
                )}
              </div>

              {/* Catégorie */}
              <div>
                <label className="form-label">Catégorie</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="form-select w-full"
                  disabled={loading}
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                  <option value="__new__">+ Ajouter une nouvelle catégorie</option>
                </select>

                {/* Input pour nouvelle catégorie */}
                {showNewCategoryInput && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Nom de la nouvelle catégorie"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleNewCategoryAdd();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={handleNewCategoryAdd}
                      className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowNewCategoryInput(false);
                        setNewCategory('');
                      }}
                      className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Annuler
                    </Button>
                  </div>
                )}
              </div>


            </form>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || isSubmitting}
              className="w-full sm:w-auto sm:ml-3"
            >
              {(loading || isSubmitting) ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sauvegarde en cours...
                </span>
              ) : (
                skill ? 'Modifier' : 'Ajouter'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading || isSubmitting}
              className="mt-3 w-full sm:mt-0 sm:w-auto"
            >
              Annuler
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
