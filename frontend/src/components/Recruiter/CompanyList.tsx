/**
 * Composant de liste des entreprises du recruteur
 * Affiche toutes les entreprises associées au recruteur
 */

import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import { CompanyStatus } from './CompanyStatus';

interface Company {
  id: string;
  name: string;
  siren: string;
  domain: string;
  sector?: string;
  size?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  created_at: string;
  validated_at?: string;
  validation_reason?: string;
}

interface CompanyListProps {
  onSelectCompany?: (company: Company) => void;
}

export const CompanyList: React.FC<CompanyListProps> = ({ onSelectCompany }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getMyCompanies();
      setCompanies(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            ⏳ En attente
          </span>
        );
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            ✓ Validée
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            ✗ Rejetée
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de vos entreprises...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchCompanies}
          className="mt-2 text-red-600 hover:text-red-800 font-medium"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <p className="text-blue-800 mb-4">
          Vous n'avez pas encore d'entreprise. Créez-en une lors de votre inscription.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {companies.map((company) => (
        <div
          key={company.id}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
        >
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{company.name}</h3>
                <p className="text-sm text-gray-500 mt-1">SIREN: {company.siren}</p>
              </div>
              {getStatusBadge(company.status)}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b">
              {company.domain && (
                <div>
                  <p className="text-xs text-gray-500 uppercase">Domaine</p>
                  <p className="text-sm font-medium text-gray-900">{company.domain}</p>
                </div>
              )}
              {company.sector && (
                <div>
                  <p className="text-xs text-gray-500 uppercase">Secteur</p>
                  <p className="text-sm font-medium text-gray-900">{company.sector}</p>
                </div>
              )}
              {company.size && (
                <div>
                  <p className="text-xs text-gray-500 uppercase">Taille</p>
                  <p className="text-sm font-medium text-gray-900">{company.size}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 uppercase">Créée le</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(company.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            {/* Afficher le statut détaillé */}
            <CompanyStatus
              companyId={company.id}
              status={company.status}
              validatedAt={company.validated_at}
              validationReason={company.validation_reason}
              onStatusChange={() => fetchCompanies()}
            />

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setSelectedCompanyId(company.id);
                  onSelectCompany?.(company);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                Modifier
              </button>
              {company.status === 'VERIFIED' && (
                <button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition"
                >
                  Publier une offre
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CompanyList;

