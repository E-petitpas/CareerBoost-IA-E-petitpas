import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  IdentificationIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import apiService from '../../services/api';

interface Company {
  id: string;
  name: string;
  siren?: string;
  domain: string;
  sector?: string;
  size_employees?: number;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  created_at: string;
  validated_at?: string;
  recruiter_count?: number;
  recruiter_name?: string;
  recruiter_email?: string;
}

const CompanyValidation: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('PENDING');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadCompanies();
  }, [filter]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPendingCompanies();
      let filteredCompanies = response.companies || [];
      
      if (filter !== 'ALL') {
        filteredCompanies = filteredCompanies.filter(company => company.status === filter);
      }
      
      setCompanies(filteredCompanies);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des entreprises');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateCompany = async (companyId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingId(companyId);
      
      if (action === 'approve') {
        await apiService.approveCompany(companyId);
      } else {
        await apiService.rejectCompany(companyId);
      }
      
      // Recharger la liste
      await loadCompanies();
      
      // Notification de succès
      const actionText = action === 'approve' ? 'approuvée' : 'rejetée';
      // Ici vous pouvez ajouter une notification toast
      console.log(`Entreprise ${actionText} avec succès`);
      
    } catch (err: any) {
      setError(err.message || `Erreur lors de la ${action === 'approve' ? 'validation' : 'rejection'}`);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-4 h-4 mr-1" />
            En attente
          </span>
        );
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Validée
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="w-4 h-4 mr-1" />
            Rejetée
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Validation des entreprises</h1>
          <p className="mt-2 text-gray-600">
            Gérez les demandes d'inscription des entreprises
          </p>
        </div>

        {error && (
          <div className="mb-6 px-4 sm:px-0">
            <div className="alert-error">
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="mb-6 px-4 sm:px-0">
          <div className="flex space-x-4">
            {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {status === 'ALL' && 'Toutes'}
                {status === 'PENDING' && 'En attente'}
                {status === 'VERIFIED' && 'Validées'}
                {status === 'REJECTED' && 'Rejetées'}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des entreprises */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {companies.length === 0 ? (
            <div className="text-center py-12">
              <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune entreprise</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'PENDING' 
                  ? 'Aucune entreprise en attente de validation'
                  : `Aucune entreprise avec le statut ${filter.toLowerCase()}`
                }
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {companies.map((company) => (
                <li key={company.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <BuildingOfficeIcon className="h-6 w-6 text-gray-400 mr-3" />
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {company.name}
                            </h3>
                            <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                              {company.siren && (
                                <div className="flex items-center">
                                  <IdentificationIcon className="h-4 w-4 mr-1" />
                                  SIREN: {company.siren}
                                </div>
                              )}
                              <div className="flex items-center">
                                <GlobeAltIcon className="h-4 w-4 mr-1" />
                                {company.domain}
                              </div>
                              <div className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                {formatDate(company.created_at)}
                              </div>
                            </div>
                            {company.sector && (
                              <p className="mt-1 text-sm text-gray-600">
                                Secteur: {company.sector}
                              </p>
                            )}
                            {company.recruiter_name && (
                              <p className="mt-1 text-sm text-gray-600">
                                Contact: {company.recruiter_name} ({company.recruiter_email})
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          {getStatusBadge(company.status)}
                          
                          {company.status === 'PENDING' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleValidateCompany(company.id, 'approve')}
                                disabled={processingId === company.id}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                              >
                                <CheckCircleIcon className="w-4 h-4 mr-1" />
                                Approuver
                              </button>
                              <button
                                onClick={() => handleValidateCompany(company.id, 'reject')}
                                disabled={processingId === company.id}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                              >
                                <XCircleIcon className="w-4 h-4 mr-1" />
                                Rejeter
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyValidation;
