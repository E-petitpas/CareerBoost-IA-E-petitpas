import React, { useState, useEffect } from 'react';
import { DocumentTextIcon, EyeIcon, StarIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import apiService from '../../services/api';
import { Application } from '../../types';

const RecruiterApplications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, [selectedCompany]);

  const loadApplications = async () => {
    try {
      console.log('🔍 Début chargement candidatures...');
      setLoading(true);
      setError(null);

      // D'abord récupérer les entreprises du recruteur
      console.log('📊 Récupération dashboard...');
      const dashboardData = await apiService.getRecruiterDashboard();
      console.log('📊 Dashboard reçu:', dashboardData);

      if (!dashboardData.stats?.companies || dashboardData.stats.companies.length === 0) {
        console.log('❌ Aucune entreprise trouvée');
        setError('Aucune entreprise validée trouvée');
        return;
      }

      // Utiliser la première entreprise par défaut
      const companyId = selectedCompany || dashboardData.stats.companies[0].id;
      console.log('🏢 ID entreprise sélectionnée:', companyId);
      setSelectedCompany(companyId);

      // Récupérer les candidatures pour cette entreprise
      console.log('📋 Récupération candidatures pour entreprise:', companyId);
      const response = await apiService.getCompanyApplications(companyId);
      console.log('📋 RÉPONSE COMPLÈTE:', response);
      console.log('📋 Type de response:', typeof response);
      console.log('📋 Clés de response:', Object.keys(response || {}));
      console.log('📋 response.data:', response.data);
      console.log('📋 response.applications:', (response as any).applications);
      console.log('📋 Nombre dans data:', response.data?.length || 'undefined');
      console.log('📋 Nombre dans applications:', (response as any).applications?.length || 'undefined');

      // Essayons les deux possibilités
      const apps = response.data || (response as any).applications || [];
      console.log('📋 Apps finales:', apps);
      console.log('📋 Nombre final:', apps.length);
      setApplications(apps);
      console.log('✅ Applications state mis à jour avec:', apps.length, 'candidatures');

    } catch (err: any) {
      console.error('❌ Erreur chargement candidatures:', err);
      setError(err.response?.data?.error || 'Erreur lors du chargement des candidatures');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCV = (cvUrl: string) => {
    if (cvUrl) {
      // Construire l'URL complète
      const fullUrl = cvUrl.startsWith('http') ? cvUrl : `http://localhost:3001${cvUrl}`;
      window.open(fullUrl, '_blank');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ENVOYE': { color: 'bg-blue-100 text-blue-800', label: 'Envoyé' },
      'VU': { color: 'bg-yellow-100 text-yellow-800', label: 'Vu' },
      'EN_ATTENTE': { color: 'bg-orange-100 text-orange-800', label: 'En attente' },
      'ENTRETIEN': { color: 'bg-purple-100 text-purple-800', label: 'Entretien' },
      'ACCEPTE': { color: 'bg-green-100 text-green-800', label: 'Accepté' },
      'REFUSE': { color: 'bg-red-100 text-red-800', label: 'Refusé' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['ENVOYE'];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-600';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  console.log('🎨 Rendu avec:', { loading, error, applicationsCount: applications.length });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadApplications}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Candidatures reçues
          </h1>
          <div className="text-sm text-gray-500">
            {applications.length} candidature{applications.length !== 1 ? 's' : ''}
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              Aucune candidature reçue pour le moment.
            </p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {applications.map((application) => (
                <li key={application.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-medium text-gray-900">
                              {application.users?.name || 'Candidat inconnu'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {(application.users as any)?.candidate_profiles?.title || 'Candidat'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {application.score && (
                              <div className={`flex items-center ${getScoreColor(application.score)}`}>
                                <StarIcon className="h-4 w-4 mr-1" />
                                <span className="font-semibold">{application.score}%</span>
                              </div>
                            )}
                            {getStatusBadge(application.status)}
                          </div>
                        </div>

                        <div className="mt-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Offre:</span> {application.job_offers?.title || 'Offre inconnue'}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Expérience:</span> {(application.users as any)?.candidate_profiles?.experience_years || 0} ans
                          </p>
                          {application.users?.city && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Localisation:</span> {application.users.city}
                            </p>
                          )}
                        </div>

                        {application.explanation && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500">
                              {application.explanation}
                            </p>
                          </div>
                        )}

                        <div className="mt-2 text-xs text-gray-400">
                          Candidature envoyée le {new Date(application.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>

                      <div className="ml-4 flex space-x-2">
                        {(application.users as any)?.candidate_profiles?.cv_url && (
                          <button
                            onClick={() => handleViewCV((application.users as any).candidate_profiles.cv_url)}
                            className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                            CV
                          </button>
                        )}
                        <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Voir détails
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterApplications;
