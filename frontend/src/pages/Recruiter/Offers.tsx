import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BriefcaseIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  ArchiveBoxIcon,
  MapPinIcon,
  CurrencyEuroIcon,
  CalendarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import { JobOffer as BaseJobOffer } from '../../types';

// Type étendu pour inclure le compteur de candidatures
interface JobOffer extends BaseJobOffer {
  _count?: {
    applications: number;
  };
}

const RecruiterOffers: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED' | 'EXPIRED'>('ALL');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Afficher le message de succès s'il y en a un
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Nettoyer le state pour éviter que le message persiste
      window.history.replaceState({}, document.title);
    }

    loadOffers();
  }, []);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      setError('');

      // Récupérer l'entreprise de l'utilisateur
      const userCompany = user?.company_memberships?.[0];
      if (!userCompany) {
        setError('Aucune entreprise associée');
        return;
      }

      const response = await apiService.getCompanyOffers(userCompany.company_id);
      setOffers(response.data || []);
    } catch (err: any) {
      console.error('Erreur lors du chargement des offres:', err);
      setError(err.response?.data?.error || 'Erreur lors du chargement des offres');
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveOffer = async (offerId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir archiver cette offre ?')) {
      return;
    }

    try {
      await apiService.archiveOffer(offerId);
      await loadOffers(); // Recharger la liste
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur lors de l\'archivage');
    }
  };

  const filteredOffers = offers.filter(offer => {
    if (filter === 'ALL') return true;
    return offer.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Active
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <ArchiveBoxIcon className="h-3 w-3 mr-1" />
            Archivée
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Expirée
          </span>
        );
      default:
        return null;
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Non spécifié';
    if (min && max) return `${min.toLocaleString()} - ${max.toLocaleString()} €`;
    if (min) return `À partir de ${min.toLocaleString()} €`;
    if (max) return `Jusqu'à ${max.toLocaleString()} €`;
    return 'Non spécifié';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Chargement des offres...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Message de succès */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* En-tête */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Mes offres d'emploi
            </h1>
            <p className="mt-2 text-gray-600">
              Gérez vos offres et suivez les candidatures reçues
            </p>
          </div>
          <Link
            to="/recruiter/offers/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nouvelle offre
          </Link>
        </div>

        {/* Filtres */}
        <div className="mb-6">
          <div className="flex space-x-4">
            {(['ALL', 'ACTIVE', 'ARCHIVED', 'EXPIRED'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {status === 'ALL' ? 'Toutes' :
                 status === 'ACTIVE' ? 'Actives' :
                 status === 'ARCHIVED' ? 'Archivées' : 'Expirées'}
                {status !== 'ALL' && (
                  <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                    {offers.filter(o => o.status === status).length}
                  </span>
                )}
                {status === 'ALL' && (
                  <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                    {offers.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Contenu principal */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <XCircleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">Erreur</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="text-center py-12">
            <BriefcaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'ALL' ? 'Aucune offre publiée' : `Aucune offre ${filter.toLowerCase()}`}
            </h3>
            <p className="text-gray-500 mb-6">
              {filter === 'ALL'
                ? 'Commencez par créer votre première offre d\'emploi'
                : `Vous n'avez aucune offre avec le statut ${filter.toLowerCase()}`
              }
            </p>
            {filter === 'ALL' && (
              <Link
                to="/recruiter/offers/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Créer ma première offre
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredOffers.map(offer => (
              <div key={offer.id} className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {offer.title}
                      </h3>
                      {getStatusBadge(offer.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
                      {offer.city && (
                        <div className="flex items-center">
                          <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {offer.city}
                        </div>
                      )}

                      {offer.contract_type && (
                        <div className="flex items-center">
                          <BriefcaseIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {offer.contract_type}
                        </div>
                      )}

                      <div className="flex items-center">
                        <CurrencyEuroIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {formatSalary(offer.salary_min, offer.salary_max)}
                      </div>

                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                        Créée le {formatDate(offer.created_at)}
                      </div>

                      <div className="flex items-center">
                        <UserGroupIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {offer._count?.applications || 0} candidature{(offer._count?.applications || 0) !== 1 ? 's' : ''}
                      </div>

                      {offer.experience_min !== undefined && (
                        <div className="flex items-center">
                          <span className="text-gray-400 mr-1">Exp:</span>
                          {offer.experience_min} an{offer.experience_min !== 1 ? 's' : ''} min.
                        </div>
                      )}
                    </div>

                    <p className="text-gray-700 line-clamp-2">
                      {offer.description.substring(0, 200)}
                      {offer.description.length > 200 && '...'}
                    </p>
                  </div>

                  <div className="ml-6 flex flex-col space-y-2">
                    <Link
                      to={`/recruiter/offers/${offer.id}`}
                      className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Voir
                    </Link>

                    <Link
                      to={`/recruiter/offers/${offer.id}/edit`}
                      className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Modifier
                    </Link>

                    {offer.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleArchiveOffer(offer.id)}
                        className="inline-flex items-center px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
                      >
                        <ArchiveBoxIcon className="h-4 w-4 mr-1" />
                        Archiver
                      </button>
                    )}

                    {(offer._count?.applications || 0) > 0 && (
                      <Link
                        to={`/recruiter/offers/${offer.id}/applications`}
                        className="inline-flex items-center px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
                      >
                        <UserGroupIcon className="h-4 w-4 mr-1" />
                        Candidatures
                      </Link>
                    )}
                  </div>
                </div>

                {offer.premium_until && new Date(offer.premium_until) > new Date() && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center">
                      <span className="text-yellow-800 text-sm font-medium">
                        ⭐ Offre Premium jusqu'au {formatDate(offer.premium_until)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterOffers;
