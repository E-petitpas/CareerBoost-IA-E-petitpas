import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import { Application } from '../../types';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyEuroIcon,
  DocumentTextIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface ExtendedApplication extends Application {
  custom_message?: string;
  notes?: Array<{
    note: string;
    created_at: string;
    actor: string;
  }>;
}

const Applications: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMyApplications();
      setApplications(response.applications);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des candidatures');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ENVOYE':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'EN_ATTENTE':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'ENTRETIEN':
        return <CalendarIcon className="h-5 w-5 text-purple-500" />;
      case 'REFUS':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'EMBAUCHE':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ENVOYE':
        return 'Envoyé';
      case 'EN_ATTENTE':
        return 'En attente';
      case 'ENTRETIEN':
        return 'Entretien';
      case 'REFUS':
        return 'Refusé';
      case 'EMBAUCHE':
        return 'Embauché';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ENVOYE':
        return 'bg-blue-100 text-blue-800';
      case 'EN_ATTENTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'ENTRETIEN':
        return 'bg-purple-100 text-purple-800';
      case 'REFUS':
        return 'bg-red-100 text-red-800';
      case 'EMBAUCHE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredApplications = applications.filter(app => 
    selectedStatus === 'all' || app.status === selectedStatus
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const updateStatus = async (applicationId: string, newStatus: string) => {
    try {
      const note = prompt('Ajouter une note (optionnel):');
      await apiService.updateApplicationStatus(applicationId, newStatus, note || undefined);
      await loadApplications(); // Recharger la liste
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={loadApplications}
            className="mt-2 btn-primary btn-sm"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes candidatures</h1>
        <p className="text-gray-600">Suivez l'évolution de vos candidatures</p>
      </div>

      {/* Filtres */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Toutes ({applications.length})
          </button>
          {['ENVOYE', 'EN_ATTENTE', 'ENTRETIEN', 'REFUS', 'EMBAUCHE'].map(status => {
            const count = applications.filter(app => app.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getStatusLabel(status)} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Liste des candidatures */}
      {filteredApplications.length === 0 ? (
        <div className="text-center py-12">
          <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {selectedStatus === 'all' ? 'Aucune candidature' : `Aucune candidature ${getStatusLabel(selectedStatus).toLowerCase()}`}
          </h3>
          <p className="text-gray-500">
            {selectedStatus === 'all' 
              ? 'Commencez par postuler à des offres qui vous intéressent'
              : 'Aucune candidature avec ce statut'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <div key={application.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {application.job_offers?.title || 'Offre supprimée'}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                      {getStatusIcon(application.status)}
                      <span className="ml-1">{getStatusLabel(application.status)}</span>
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <BuildingOfficeIcon className="h-4 w-4" />
                      {application.job_offers?.companies?.name || 'Entreprise inconnue'}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPinIcon className="h-4 w-4" />
                      {application.job_offers?.city || 'Localisation inconnue'}
                    </div>
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      Postulé le {formatDate(application.created_at)}
                    </div>
                  </div>

                  {application.score && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Score de matching:</span>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          application.score >= 90 ? 'bg-green-100 text-green-800' :
                          application.score >= 70 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {application.score}%
                        </span>
                      </div>
                      {application.explanation && (
                        <p className="text-sm text-gray-600 mt-1">{application.explanation}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {application.cv_snapshot_url && (
                    <button className="btn-outline btn-sm">
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Voir CV
                    </button>
                  )}
                  {application.lm_snapshot_url && (
                    <button className="btn-outline btn-sm">
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Voir LM
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  {application.status === 'ENVOYE' && (
                    <button
                      onClick={() => updateStatus(application.id, 'EN_ATTENTE')}
                      className="btn-outline btn-sm"
                    >
                      Marquer en attente
                    </button>
                  )}
                  {application.status === 'EN_ATTENTE' && (
                    <button
                      onClick={() => updateStatus(application.id, 'ENTRETIEN')}
                      className="btn-outline btn-sm"
                    >
                      Entretien programmé
                    </button>
                  )}
                </div>
              </div>

              {application.notes && application.notes.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Notes:</h4>
                  <div className="space-y-2">
                    {application.notes.map((note: any, index: number) => (
                      <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <p>{note.note}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(note.created_at)} - {note.actor}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Applications;
