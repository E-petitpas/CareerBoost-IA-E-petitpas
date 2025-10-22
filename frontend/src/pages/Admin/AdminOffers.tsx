import React, { useState, useEffect } from 'react';
import {
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyEuroIcon,
  CalendarIcon,
  FlagIcon,
  DocumentDuplicateIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import apiService from '../../services/api';
import Pagination from '../../components/common/Pagination';

interface JobOffer {
  id: string;
  title: string;
  description: string;
  city?: string;
  contract_type?: string;
  experience_min?: number;
  salary_min?: number;
  salary_max?: number;
  status: 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'ARCHIVED' | 'REJECTED';
  admin_status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';
  source: 'INTERNAL' | 'EXTERNAL';
  created_at: string;
  expires_at?: string;
  companies: {
    id: string;
    name: string;
    status: string;
  };
  _count?: {
    applications: number;
  };
  reports?: Array<{
    id: string;
    reason: string;
    created_at: string;
  }>;
}

interface AdminOffersStats {
  total: number;
  pending: number;
  approved: number;
  flagged: number;
  expired: number;
  duplicates: number;
}

const AdminOffers: React.FC = () => {
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [stats, setStats] = useState<AdminOffersStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtres
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [adminStatusFilter, setAdminStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    loadOffers();
    loadStats();
  }, [currentPage, statusFilter, adminStatusFilter, sourceFilter, searchTerm]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        admin_status: adminStatusFilter !== 'all' ? adminStatusFilter : undefined,
        source: sourceFilter !== 'all' ? sourceFilter : undefined,
        search: searchTerm || undefined
      };

      const response = await apiService.getAdminOffers(params);
      setOffers(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalItems(response.pagination?.total || 0);
    } catch (err: any) {
      console.error('Erreur lors du chargement des offres:', err);
      setError(err.response?.data?.error || 'Erreur lors du chargement des offres');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // @ts-ignore - Méthode existe mais TypeScript ne la reconnaît pas
      const response = await apiService.getAdminOffersStats();
      setStats(response);
    } catch (err: any) {
      console.error('Erreur lors du chargement des statistiques:', err);
    }
  };

  const handleOfferAction = async (offerId: string, action: 'approve' | 'reject' | 'flag') => {
    try {
      // @ts-ignore - Méthode existe mais TypeScript ne la reconnaît pas
      await apiService.updateOfferAdminStatus(offerId, action);
      await loadOffers();
      await loadStats();
    } catch (err: any) {
      console.error(`Erreur lors de l'action ${action}:`, err);
      alert(err.response?.data?.error || `Erreur lors de l'action ${action}`);
    }
  };

  const getStatusBadge = (status: string, adminStatus?: string) => {
    if (adminStatus === 'REJECTED') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejetée</span>;
    }
    if (adminStatus === 'FLAGGED') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Signalée</span>;
    }
    if (adminStatus === 'APPROVED') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Approuvée</span>;
    }
    if (adminStatus === 'PENDING' || !adminStatus) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">En attente</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
  };

  const getSourceBadge = (source: string) => {
    return source === 'INTERNAL' ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Interne</span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Externe</span>
    );
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading && offers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Supervision des offres</h1>
              <p className="mt-2 text-gray-600">
                Gérez la qualité et la validation des offres d'emploi
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">Contrôle qualité</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 px-4 sm:px-0">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">

          {/* Statistiques */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DocumentDuplicateIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ClockIcon className="h-6 w-6 text-orange-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">En attente</dt>
                        <dd className="text-lg font-medium text-orange-600">{stats.pending}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Approuvées</dt>
                        <dd className="text-lg font-medium text-green-600">{stats.approved}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FlagIcon className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Signalées</dt>
                        <dd className="text-lg font-medium text-yellow-600">{stats.flagged}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Expirées</dt>
                        <dd className="text-lg font-medium text-red-600">{stats.expired}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DocumentDuplicateIcon className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Doublons</dt>
                        <dd className="text-lg font-medium text-purple-600">{stats.duplicates}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filtres */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recherche
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Titre, entreprise..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut validation
                </label>
                <select
                  value={adminStatusFilter}
                  onChange={(e) => setAdminStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tous</option>
                  <option value="PENDING">En attente</option>
                  <option value="APPROVED">Approuvées</option>
                  <option value="FLAGGED">Signalées</option>
                  <option value="REJECTED">Rejetées</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source
                </label>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Toutes</option>
                  <option value="INTERNAL">Internes</option>
                  <option value="EXTERNAL">Externes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut offre
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tous</option>
                  <option value="ACTIVE">Actives</option>
                  <option value="EXPIRED">Expirées</option>
                  <option value="ARCHIVED">Archivées</option>
                </select>
              </div>
            </div>
          </div>

          {/* Liste des offres */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {offers.map((offer) => (
                <li key={offer.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {offer.title}
                        </h3>
                        {getStatusBadge(offer.status, offer.admin_status)}
                        {getSourceBadge(offer.source)}
                        {isExpired(offer.expires_at) && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            Expirée
                          </span>
                        )}
                        {offer.reports && offer.reports.length > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <FlagIcon className="h-3 w-3 mr-1" />
                            {offer.reports.length} signalement{offer.reports.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                        <div className="flex items-center">
                          <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                          {offer.companies.name}
                        </div>
                        {offer.city && (
                          <div className="flex items-center">
                            <MapPinIcon className="h-4 w-4 mr-1" />
                            {offer.city}
                          </div>
                        )}
                        {offer.salary_min && (
                          <div className="flex items-center">
                            <CurrencyEuroIcon className="h-4 w-4 mr-1" />
                            {offer.salary_min}
                            {offer.salary_max && ` - ${offer.salary_max}`}€
                          </div>
                        )}
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {new Date(offer.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2">
                        {offer.description}
                      </p>

                      {offer._count && (
                        <div className="mt-2 text-sm text-gray-500">
                          {offer._count.applications} candidature{offer._count.applications !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => {/* TODO: Voir détails */ }}
                        className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Voir
                      </button>

                      {offer.admin_status !== 'APPROVED' && (
                        <button
                          onClick={() => handleOfferAction(offer.id, 'approve')}
                          className="inline-flex items-center px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Approuver
                        </button>
                      )}

                      {offer.admin_status !== 'FLAGGED' && (
                        <button
                          onClick={() => handleOfferAction(offer.id, 'flag')}
                          className="inline-flex items-center px-3 py-1.5 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors"
                        >
                          <FlagIcon className="h-4 w-4 mr-1" />
                          Signaler
                        </button>
                      )}

                      {offer.admin_status !== 'REJECTED' && (
                        <button
                          onClick={() => handleOfferAction(offer.id, 'reject')}
                          className="inline-flex items-center px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                        >
                          <XCircleIcon className="h-4 w-4 mr-1" />
                          Rejeter
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {offers.length === 0 && !loading && (
              <div className="text-center py-12">
                <DocumentDuplicateIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune offre trouvée</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Aucune offre ne correspond aux critères sélectionnés.
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminOffers;
