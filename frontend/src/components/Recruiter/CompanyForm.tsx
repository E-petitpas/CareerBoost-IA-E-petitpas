/**
 * Formulaire de création/édition d'entreprise
 * Composant réutilisable pour les recruteurs
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import apiService from '../../services/api';

interface CompanyFormData {
  name: string;
  siren: string;
  domain?: string | null;
  sector?: string | null;
  size?: string | null;
  logo_url?: string | null;
  description?: string | null;
}

interface CompanyFormProps {
  initialData?: CompanyFormData;
  companyId?: string;
  onSuccess?: (company: any) => void;
  onError?: (error: string) => void;
  isLoading?: boolean;
}

// Schéma de validation
const validationSchema = yup.object().shape({
  name: yup
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères')
    .required('Le nom de l\'entreprise est requis'),
  siren: yup
    .string()
    .matches(/^\d{9}$/, 'Le SIREN doit contenir 9 chiffres')
    .required('Le SIREN est requis'),
  domain: yup
    .string()
    .url('Le domaine doit être une URL valide')
    .nullable()
    .optional(),
  sector: yup
    .string()
    .max(100, 'Le secteur ne peut pas dépasser 100 caractères')
    .nullable()
    .optional(),
  size: yup
    .string()
    .oneOf(['1-10', '11-50', '51-200', '201-500', '500+'], 'Taille invalide')
    .nullable()
    .optional(),
  logo_url: yup
    .string()
    .url('L\'URL du logo doit être valide')
    .nullable()
    .optional(),
  description: yup
    .string()
    .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    .nullable()
    .optional()
});

export const CompanyForm: React.FC<CompanyFormProps> = ({
  initialData,
  companyId,
  onSuccess,
  onError,
  isLoading: externalLoading = false
}) => {
  const [isLoading, setIsLoading] = useState(externalLoading);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CompanyFormData>({
    resolver: yupResolver(validationSchema) as any,
    defaultValues: initialData || {
      name: '',
      siren: '',
      domain: '',
      sector: '',
      size: '',
      logo_url: '',
      description: ''
    }
  });

  const onSubmit = async (data: CompanyFormData) => {
    setIsLoading(true);
    setSubmitError(null);

    try {
      if (companyId) {
        // Mise à jour
        const response = await apiService.updateCompanyDetails(companyId, data);
        onSuccess?.(response.data);
      } else {
        // Création (via l'inscription)
        // La création se fait lors de l'inscription
        onSuccess?.(data);
      }
      reset();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Une erreur est survenue';
      setSubmitError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{submitError}</p>
        </div>
      )}

      {/* Nom de l'entreprise */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Nom de l'entreprise *
        </label>
        <input
          id="name"
          type="text"
          placeholder="Ex: Acme Corporation"
          {...register('name')}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* SIREN */}
      <div>
        <label htmlFor="siren" className="block text-sm font-medium text-gray-700 mb-2">
          SIREN (9 chiffres) *
        </label>
        <input
          id="siren"
          type="text"
          placeholder="Ex: 123456789"
          {...register('siren')}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${errors.siren ? 'border-red-500' : 'border-gray-300'
            }`}
        />
        {errors.siren && (
          <p className="text-red-500 text-sm mt-1">{errors.siren.message}</p>
        )}
      </div>

      {/* Domaine */}
      <div>
        <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-2">
          Site web
        </label>
        <input
          id="domain"
          type="url"
          placeholder="https://www.example.com"
          {...register('domain')}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${errors.domain ? 'border-red-500' : 'border-gray-300'
            }`}
        />
        {errors.domain && (
          <p className="text-red-500 text-sm mt-1">{errors.domain.message}</p>
        )}
      </div>

      {/* Secteur */}
      <div>
        <label htmlFor="sector" className="block text-sm font-medium text-gray-700 mb-2">
          Secteur d'activité
        </label>
        <input
          id="sector"
          type="text"
          placeholder="Ex: Technologie, Finance, Santé"
          {...register('sector')}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${errors.sector ? 'border-red-500' : 'border-gray-300'
            }`}
        />
        {errors.sector && (
          <p className="text-red-500 text-sm mt-1">{errors.sector.message}</p>
        )}
      </div>

      {/* Taille */}
      <div>
        <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-2">
          Taille de l'entreprise
        </label>
        <select
          id="size"
          {...register('size')}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${errors.size ? 'border-red-500' : 'border-gray-300'
            }`}
        >
          <option value="">Sélectionner une taille</option>
          <option value="1-10">1-10 employés</option>
          <option value="11-50">11-50 employés</option>
          <option value="51-200">51-200 employés</option>
          <option value="201-500">201-500 employés</option>
          <option value="500+">500+ employés</option>
        </select>
        {errors.size && (
          <p className="text-red-500 text-sm mt-1">{errors.size.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          placeholder="Décrivez votre entreprise..."
          rows={4}
          {...register('description')}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none ${errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
        )}
      </div>

      {/* Bouton de soumission */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
      >
        {isLoading ? 'Traitement...' : companyId ? 'Mettre à jour' : 'Créer l\'entreprise'}
      </button>
    </form>
  );
};

export default CompanyForm;

