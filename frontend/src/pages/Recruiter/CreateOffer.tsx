import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  PlusIcon,
  MapPinIcon,
  CurrencyEuroIcon,
  ClockIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

// Types
interface CreateOfferForm {
  title: string;
  description: string;
  city?: string;
  contract_type?: string;
  experience_min?: number;
  salary_min?: number;
  salary_max?: number;
  required_skills: string[];
  optional_skills: string[];
}

interface Skill {
  id: string;
  slug: string;
  display_name: string;
}

// Schéma de validation
const schema = yup.object({
  title: yup
    .string()
    .min(5, 'Le titre doit contenir au moins 5 caractères')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères')
    .required('Le titre est requis'),
  description: yup
    .string()
    .min(50, 'La description doit contenir au moins 50 caractères')
    .max(5000, 'La description ne peut pas dépasser 5000 caractères')
    .required('La description est requise'),
  city: yup.string().max(100, 'La ville ne peut pas dépasser 100 caractères').optional(),
  contract_type: yup.string().optional(),
  experience_min: yup.number().min(0, 'L\'expérience minimum ne peut pas être négative').max(50, 'L\'expérience maximum est de 50 ans').optional(),
  salary_min: yup.number().min(0, 'Le salaire minimum ne peut pas être négatif').optional(),
  salary_max: yup.number().min(yup.ref('salary_min'), 'Le salaire maximum doit être supérieur au minimum').optional(),
  required_skills: yup.array().of(yup.string().required()).required(),
  optional_skills: yup.array().of(yup.string().required()).required()
});

const CreateOffer: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [selectedRequiredSkills, setSelectedRequiredSkills] = useState<Skill[]>([]);
  const [selectedOptionalSkills, setSelectedOptionalSkills] = useState<Skill[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      city: '',
      contract_type: '',
      experience_min: undefined,
      salary_min: undefined,
      salary_max: undefined,
      required_skills: [],
      optional_skills: []
    }
  });

  // Options pour les types de contrat
  const contractTypes = [
    { value: 'CDI', label: 'CDI - Contrat à Durée Indéterminée' },
    { value: 'CDD', label: 'CDD - Contrat à Durée Déterminée' },
    { value: 'STAGE', label: 'Stage' },
    { value: 'ALTERNANCE', label: 'Alternance' },
    { value: 'INTERIM', label: 'Intérim' },
    { value: 'FREELANCE', label: 'Freelance' },
    { value: 'TEMPS_PARTIEL', label: 'Temps partiel' },
    { value: 'TEMPS_PLEIN', label: 'Temps plein' },
    { value: 'OTHER', label: 'Autre' }
  ];

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      const response = await apiService.getSkills();
      setSkills(response.skills || []);
    } catch (error) {
      console.error('Erreur lors du chargement des compétences:', error);
    }
  };

  const filteredSkills = skills.filter(skill =>
    skill.display_name.toLowerCase().includes(skillSearch.toLowerCase()) &&
    !selectedRequiredSkills.find(s => s.id === skill.id) &&
    !selectedOptionalSkills.find(s => s.id === skill.id)
  );

  const addRequiredSkill = (skill: Skill) => {
    const newSkills = [...selectedRequiredSkills, skill];
    setSelectedRequiredSkills(newSkills);
    setValue('required_skills', newSkills.map(s => s.id));
    setSkillSearch('');
    setShowSkillDropdown(false);
  };

  const addOptionalSkill = (skill: Skill) => {
    const newSkills = [...selectedOptionalSkills, skill];
    setSelectedOptionalSkills(newSkills);
    setValue('optional_skills', newSkills.map(s => s.id));
    setSkillSearch('');
    setShowSkillDropdown(false);
  };

  const removeRequiredSkill = (skillId: string) => {
    const newSkills = selectedRequiredSkills.filter(s => s.id !== skillId);
    setSelectedRequiredSkills(newSkills);
    setValue('required_skills', newSkills.map(s => s.id));
  };

  const removeOptionalSkill = (skillId: string) => {
    const newSkills = selectedOptionalSkills.filter(s => s.id !== skillId);
    setSelectedOptionalSkills(newSkills);
    setValue('optional_skills', newSkills.map(s => s.id));
  };

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);

      console.log('Création offre avec données:', data);

      const response = await apiService.createOffer(data);

      console.log('Offre créée avec succès:', response);

      // Rediriger vers la liste des offres ou le dashboard
      navigate('/recruiter/offers', {
        state: { message: 'Offre créée avec succès !' }
      });

    } catch (error: any) {
      console.error('Erreur lors de la création de l\'offre:', error);
      alert(error.response?.data?.error || 'Erreur lors de la création de l\'offre');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Créer une offre d'emploi
          </h1>
          <p className="mt-2 text-gray-600">
            Publiez une nouvelle offre pour attirer les meilleurs talents
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Informations générales */}
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <PlusIcon className="h-5 w-5 mr-2 text-blue-600" />
              Informations générales
            </h2>

            <div className="grid grid-cols-1 gap-6">
              {/* Titre */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Titre du poste *
                </label>
                <input
                  {...register('title')}
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Développeur Full Stack Junior"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description du poste *
                </label>
                <textarea
                  {...register('description')}
                  rows={8}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Décrivez le poste, les missions, l'environnement de travail..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Minimum 50 caractères. Soyez précis sur les missions et l'environnement.
                </p>
              </div>
            </div>
          </div>

          {/* Détails du poste */}
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2 text-blue-600" />
              Détails du poste
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ville */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPinIcon className="h-4 w-4 inline mr-1" />
                  Ville
                </label>
                <input
                  {...register('city')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Paris, Lyon, Remote..."
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                )}
              </div>

              {/* Type de contrat */}
              <div>
                <label htmlFor="contract_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Type de contrat
                </label>
                <select
                  {...register('contract_type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sélectionner un type</option>
                  {contractTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Expérience minimum */}
              <div>
                <label htmlFor="experience_min" className="block text-sm font-medium text-gray-700 mb-2">
                  <AcademicCapIcon className="h-4 w-4 inline mr-1" />
                  Expérience minimum (années)
                </label>
                <input
                  {...register('experience_min')}
                  type="number"
                  min="0"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
                {errors.experience_min && (
                  <p className="mt-1 text-sm text-red-600">{errors.experience_min.message}</p>
                )}
              </div>

              {/* Salaire */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CurrencyEuroIcon className="h-4 w-4 inline mr-1" />
                  Fourchette salariale (€/an)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    {...register('salary_min')}
                    type="number"
                    min="0"
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Min"
                  />
                  <input
                    {...register('salary_max')}
                    type="number"
                    min="0"
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Max"
                  />
                </div>
                {(errors.salary_min || errors.salary_max) && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.salary_min?.message || errors.salary_max?.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Compétences */}
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <AcademicCapIcon className="h-5 w-5 mr-2 text-blue-600" />
              Compétences
            </h2>

            {/* Recherche de compétences */}
            <div className="mb-6 relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rechercher une compétence
              </label>
              <input
                type="text"
                value={skillSearch}
                onChange={(e) => {
                  setSkillSearch(e.target.value);
                  setShowSkillDropdown(e.target.value.length > 0);
                }}
                onFocus={() => setShowSkillDropdown(skillSearch.length > 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Tapez pour rechercher une compétence..."
              />

              {/* Dropdown des compétences */}
              {showSkillDropdown && filteredSkills.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredSkills.slice(0, 10).map(skill => (
                    <div key={skill.id} className="border-b border-gray-100 last:border-b-0">
                      <div className="p-3">
                        <div className="font-medium text-gray-900">{skill.display_name}</div>
                        <div className="flex gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => addRequiredSkill(skill)}
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                          >
                            + Requis
                          </button>
                          <button
                            type="button"
                            onClick={() => addOptionalSkill(skill)}
                            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                          >
                            + Souhaité
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Compétences requises */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Compétences requises
                <span className="ml-2 text-xs text-red-600">(Obligatoires)</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedRequiredSkills.map(skill => (
                  <span
                    key={skill.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800"
                  >
                    {skill.display_name}
                    <button
                      type="button"
                      onClick={() => removeRequiredSkill(skill.id)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </span>
                ))}
                {selectedRequiredSkills.length === 0 && (
                  <p className="text-sm text-gray-500 italic">Aucune compétence requise sélectionnée</p>
                )}
              </div>
            </div>

            {/* Compétences souhaitées */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Compétences souhaitées
                <span className="ml-2 text-xs text-blue-600">(Optionnelles)</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedOptionalSkills.map(skill => (
                  <span
                    key={skill.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {skill.display_name}
                    <button
                      type="button"
                      onClick={() => removeOptionalSkill(skill.id)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </span>
                ))}
                {selectedOptionalSkills.length === 0 && (
                  <p className="text-sm text-gray-500 italic">Aucune compétence souhaitée sélectionnée</p>
                )}
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/recruiter/offers')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Création...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Publier l'offre
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOffer;
