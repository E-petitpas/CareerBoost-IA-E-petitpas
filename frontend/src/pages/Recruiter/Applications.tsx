import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  EyeIcon,
  StarIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import apiService, { API_BASE_URL } from '../../services/api';
import { Application, ApplicationStatus } from '../../types';

const RecruiterApplications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [showCVModal, setShowCVModal] = useState(false);
  const [selectedCVUrl, setSelectedCVUrl] = useState<string>('');
  const [selectedCandidate, setSelectedCandidate] = useState<string>('');

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

  const handleViewCV = (cvUrl: string, candidateName: string) => {
    if (cvUrl) {
      // Construire l'URL complète en utilisant l'URL de base de l'API
      const fullUrl = cvUrl.startsWith('http') ? cvUrl : `${API_BASE_URL}${cvUrl}`;
      setSelectedCVUrl(fullUrl);
      setSelectedCandidate(candidateName);
      setShowCVModal(true);
    }
  };

  const handleUpdateApplicationStatus = async (applicationId: string, newStatus: ApplicationStatus) => {
    try {
      await apiService.updateApplicationStatus(applicationId, newStatus);
      // Recharger les candidatures pour refléter le changement
      await loadApplications();
      alert(`✅ Statut mis à jour vers "${getStatusLabel(newStatus)}"`);
    } catch (err: any) {
      console.error('Erreur mise à jour statut:', err);
      alert('❌ ' + (err.response?.data?.error || err.message || 'Erreur lors de la mise à jour du statut'));
    }
  };

  const getStatusLabel = (status: ApplicationStatus): string => {
    const statusLabels = {
      'ENVOYE': 'Envoyé',
      'EN_ATTENTE': 'En attente',
      'ENTRETIEN': 'Entretien',
      'REFUS': 'Refusé',
      'EMBAUCHE': 'Embauché'
    };
    return statusLabels[status] || status;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ENVOYE': { color: 'bg-blue-100 text-blue-800', label: 'Envoyé' },
      'EN_ATTENTE': { color: 'bg-orange-100 text-orange-800', label: 'En attente' },
      'ENTRETIEN': { color: 'bg-purple-100 text-purple-800', label: 'Entretien' },
      'EMBAUCHE': { color: 'bg-green-100 text-green-800', label: 'Embauché' },
      'REFUS': { color: 'bg-red-100 text-red-800', label: 'Refusé' }
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

                      <div className="ml-4 flex flex-wrap gap-2">
                        {(application.users as any)?.candidate_profiles?.cv_url && (
                          <button
                            onClick={() => handleViewCV(
                              (application.users as any).candidate_profiles.cv_url,
                              application.users?.name || 'Candidat inconnu'
                            )}
                            className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            Voir CV
                          </button>
                        )}

                        {/* Actions du pipeline selon le statut */}
                        {application.status === 'ENVOYE' && (
                          <>
                            <button
                              onClick={() => handleUpdateApplicationStatus(application.id, 'EN_ATTENTE')}
                              className="inline-flex items-center px-3 py-2 border border-orange-300 shadow-sm text-sm leading-4 font-medium rounded-md text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                            >
                              <ClockIcon className="h-4 w-4 mr-1" />
                              En attente
                            </button>
                            <button
                              onClick={() => handleUpdateApplicationStatus(application.id, 'REFUS')}
                              className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <XCircleIcon className="h-4 w-4 mr-1" />
                              Refuser
                            </button>
                          </>
                        )}

                        {application.status === 'EN_ATTENTE' && (
                          <>
                            <button
                              onClick={() => handleUpdateApplicationStatus(application.id, 'ENTRETIEN')}
                              className="inline-flex items-center px-3 py-2 border border-purple-300 shadow-sm text-sm leading-4 font-medium rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                            >
                              <UserGroupIcon className="h-4 w-4 mr-1" />
                              Entretien
                            </button>
                            <button
                              onClick={() => handleUpdateApplicationStatus(application.id, 'REFUS')}
                              className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <XCircleIcon className="h-4 w-4 mr-1" />
                              Refuser
                            </button>
                          </>
                        )}

                        {application.status === 'ENTRETIEN' && (
                          <>
                            <button
                              onClick={() => handleUpdateApplicationStatus(application.id, 'EMBAUCHE')}
                              className="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Recruter
                            </button>
                            <button
                              onClick={() => handleUpdateApplicationStatus(application.id, 'REFUS')}
                              className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <XCircleIcon className="h-4 w-4 mr-1" />
                              Refuser
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Modal pour afficher le CV */}
      {showCVModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                CV de {selectedCandidate}
              </h3>
              <button
                onClick={() => setShowCVModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
              {selectedCVUrl ? (
                // Tous les CVs sont maintenant en PDF
                <div className="relative h-[600px] bg-gray-50 rounded-lg overflow-hidden">
                  {/* Boutons d'action flottants */}
                  <div className="absolute top-4 right-4 z-10 flex space-x-2">
                    <a
                      href={selectedCVUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 shadow-lg"
                      title="Ouvrir dans un nouvel onglet"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Ouvrir
                    </a>
                    <a
                      href={selectedCVUrl}
                      download
                      className="inline-flex items-center px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 shadow-lg"
                      title="Télécharger le CV"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                      Télécharger
                    </a>
                  </div>

                  {/* Affichage direct du PDF */}
                  <iframe
                    src={selectedCVUrl}
                    className="w-full h-full border-0"
                    title={`CV de ${selectedCandidate}`}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun CV disponible</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowCVModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Fermer
              </button>
              <a
                href={selectedCVUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Ouvrir dans un nouvel onglet
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterApplications;
