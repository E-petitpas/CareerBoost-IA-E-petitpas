/**
 * Page de gestion des entreprises pour les recruteurs
 * Permet de voir et modifier les informations de l'entreprise
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiService from '../../services/api';
import { CompanyForm } from '../../components/Recruiter/CompanyForm';
import { CompanyStatus } from '../../components/Recruiter/CompanyStatus';

interface Company {
  id: string;
  name: string;
  siren: string;
  domain: string;
  sector?: string;
  size?: string;
  logo_url?: string;
  description?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  created_at: string;
  validated_at?: string;
  validation_reason?: string;
}

export const ManageCompanies: React.FC = () => {
  const { companyId } = useParams<{ companyId?: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(!!companyId);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'status'>('info');

  useEffect(() => {
    if (companyId) {
      fetchCompany();
    }
  }, [companyId]);

  const fetchCompany = async () => {
    if (!companyId) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getCompanyDetails(companyId);
      setCompany(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = (updatedCompany: any) => {
    setCompany(updatedCompany);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (!companyId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Aucune entreprise sélectionnée
            </h1>
            <p className="text-gray-600">
              Veuillez sélectionner une entreprise depuis la liste.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error && !company) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchCompany}
              className="mt-4 text-red-600 hover:text-red-800 font-medium"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
          <p className="text-gray-600 mt-2">Gestion de votre entreprise</p>
        </div>

        {/* Onglets */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 font-medium border-b-2 transition ${activeTab === 'info'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
          >
            Informations
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`px-4 py-2 font-medium border-b-2 transition ${activeTab === 'status'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
          >
            Statut de validation
          </button>
        </div>

        {/* Contenu des onglets */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {activeTab === 'info' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Informations de l'entreprise
              </h2>
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}
              <CompanyForm
                initialData={company}
                companyId={company.id}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            </div>
          )}

          {activeTab === 'status' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Statut de validation
              </h2>
              <CompanyStatus
                companyId={company.id}
                status={company.status}
                validatedAt={company.validated_at}
                validationReason={company.validation_reason}
                onStatusChange={fetchCompany}
              />

              {/* Informations supplémentaires */}
              <div className="mt-8 bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  À propos du processus de validation
                </h3>
                <ul className="space-y-3 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-3">•</span>
                    <span>
                      Votre entreprise est vérifiée par notre équipe pour assurer la qualité et la sécurité
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-3">•</span>
                    <span>
                      Le processus prend généralement 24 à 48 heures ouvrées
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-3">•</span>
                    <span>
                      Vous recevrez un email de confirmation une fois validée
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-3">•</span>
                    <span>
                      Si rejetée, vous pouvez contester la décision avec des informations corrigées
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageCompanies;

