import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  CheckCircleIcon as CheckCircle,
  XCircleIcon as XCircle,
  ClockIcon as Clock,
  MapPinIcon as MapPin,
  BuildingOfficeIcon as Building,
  CurrencyDollarIcon as Euro,
  ArrowPathIcon as RefreshCw,
  EyeIcon as Eye,
  ExclamationTriangleIcon as AlertCircle,
  FunnelIcon as Filter
} from '@heroicons/react/24/outline';
import apiService from '../../services/api';

// Simple toast replacement
const toast = {
  success: (message: string) => alert(`✅ ${message}`),
  error: (message: string) => alert(`❌ ${message}`)
};

interface FranceTravailOffer {
  id: string;
  title: string;
  description: string;
  city: string;
  contract_type: string;
  experience_min: number;
  salary_min: number;
  salary_max: number;
  company_name: string;
  created_at: string;
  france_travail_id: string;
  france_travail_data: any;
  applications_count: number;
}

interface FranceTravailStats {
  total_offers: number;
  pending_offers: number;
  approved_offers: number;
  rejected_offers: number;
  last_sync_date: string;
  avg_daily_offers: number;
}

interface AggregationStatus {
  enabled: boolean;
  isRunning: boolean;
  lastSyncTime: string;
  syncIntervalHours: number;
  maxOffersPerSync: number;
}

const FranceTravailOffers: React.FC = () => {
  const [offers, setOffers] = useState<FranceTravailOffer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<FranceTravailOffer[]>([]);
  const [stats, setStats] = useState<FranceTravailStats | null>(null);
  const [aggregationStatus, setAggregationStatus] = useState<AggregationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Filtres
  const [contractTypeFilter, setContractTypeFilter] = useState<string>('all');
  const [remoteFilter, setRemoteFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOffer, setSelectedOffer] = useState<FranceTravailOffer | null>(null);

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les statistiques et le statut
      const [statsResponse, offersResponse] = await Promise.all([
        apiService.getFranceTravailStats(),
        apiService.getFranceTravailPendingOffers({ page, limit: 10 })
      ]);

      setStats(statsResponse.stats);
      setAggregationStatus(statsResponse.aggregationStatus);
      setOffers(offersResponse.offers);
      setTotalPages(offersResponse.pagination.totalPages);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Fonction de filtrage des offres
  const applyFilters = () => {
    let filtered = [...offers];

    // Filtre par type de contrat
    if (contractTypeFilter !== 'all') {
      filtered = filtered.filter(offer => {
        const contractType = offer.contract_type?.toLowerCase();
        if (contractTypeFilter === 'alternance') {
          return contractType === 'sai' || contractType === 'apprentissage' ||
                 offer.title.toLowerCase().includes('alternance') ||
                 offer.title.toLowerCase().includes('apprenti');
        }
        return contractType === contractTypeFilter;
      });
    }

    // Filtre par télétravail
    if (remoteFilter !== 'all') {
      filtered = filtered.filter(offer => {
        const description = offer.description?.toLowerCase() || '';
        const title = offer.title?.toLowerCase() || '';
        const isRemote = description.includes('télétravail') ||
                        description.includes('remote') ||
                        description.includes('full remote') ||
                        description.includes('100% télétravail') ||
                        title.includes('remote') ||
                        title.includes('télétravail');

        return remoteFilter === 'remote' ? isRemote : !isRemote;
      });
    }

    setFilteredOffers(filtered);
  };

  // Appliquer les filtres quand les offres ou les filtres changent
  React.useEffect(() => {
    applyFilters();
  }, [offers, contractTypeFilter, remoteFilter]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      await apiService.syncFranceTravail();
      toast.success('Synchronisation lancée avec succès');
      
      // Recharger les données après un délai
      setTimeout(() => {
        loadData();
      }, 2000);
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      toast.error('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const handleApprove = async (offerId: string) => {
    try {
      await apiService.approveFranceTravailOffer(offerId);
      toast.success('Offre approuvée avec succès');
      loadData(); // Recharger la liste
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
      toast.error('Erreur lors de l\'approbation');
    }
  };

  const handleReject = async (offerId: string, reason?: string) => {
    try {
      await apiService.rejectFranceTravailOffer(offerId, reason);
      toast.success('Offre rejetée avec succès');
      loadData(); // Recharger la liste
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      toast.error('Erreur lors du rejet');
    }
  };

  const formatSalary = (min: number, max: number) => {
    if (!min && !max) return 'Non spécifié';
    if (min === max) return `${min.toLocaleString()} €`;
    if (!max) return `À partir de ${min.toLocaleString()} €`;
    if (!min) return `Jusqu'à ${max.toLocaleString()} €`;
    return `${min.toLocaleString()} - ${max.toLocaleString()} €`;
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Chargement des offres France Travail...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="px-4 py-6 sm:px-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Offres France Travail</h1>
                <p className="mt-2 text-gray-600">
                  Gérez et approuvez les offres d'emploi synchronisées depuis France Travail
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleSync}
                  disabled={syncing || aggregationStatus?.isRunning}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                >
                  <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Synchronisation...' : 'Synchroniser'}
                </Button>
              </div>
            </div>
          </div>

      {/* Statistiques */}
          <div className="px-4 sm:px-0">
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total offres</p>
                  <p className="text-2xl font-bold">{stats.total_offers}</p>
                </div>
                <Building className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En attente</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pending_offers}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approuvées</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved_offers}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejetées</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected_offers}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
              </div>
            )}
          </div>

          {/* Statut de synchronisation */}
          <div className="px-4 sm:px-0">
      {aggregationStatus && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${
                  aggregationStatus.isRunning ? 'bg-green-500 animate-pulse' : 
                  aggregationStatus.enabled ? 'bg-blue-500' : 'bg-gray-400'
                }`} />
                <div>
                  <p className="font-medium">
                    Synchronisation {aggregationStatus.enabled ? 'activée' : 'désactivée'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {aggregationStatus.isRunning ? 'Synchronisation en cours...' : 
                     aggregationStatus.lastSyncTime ? 
                     `Dernière sync: ${formatDate(aggregationStatus.lastSyncTime)}` : 
                     'Aucune synchronisation effectuée'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  Intervalle: {aggregationStatus.syncIntervalHours}h
                </p>
                <p className="text-sm text-gray-600">
                  Max par sync: {aggregationStatus.maxOffersPerSync}
                </p>
              </div>
            </div>
          </CardContent>
            </Card>
          )}
          </div>

          {/* Filtres */}
          <div className="px-4 sm:px-0">
            <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres E-Petitpas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtre par type de contrat */}
            <div>
              <label className="block text-sm font-medium mb-2">Type de contrat</label>
              <select
                value={contractTypeFilter}
                onChange={(e) => setContractTypeFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tous les contrats</option>
                <option value="cdi">CDI</option>
                <option value="cdd">CDD</option>
                <option value="alternance">Alternance / Apprentissage</option>
                <option value="interim">Intérim</option>
              </select>
            </div>

            {/* Filtre par télétravail */}
            <div>
              <label className="block text-sm font-medium mb-2">Télétravail</label>
              <select
                value={remoteFilter}
                onChange={(e) => setRemoteFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tous les postes</option>
                <option value="remote">Full Remote / Télétravail</option>
                <option value="onsite">Présentiel uniquement</option>
              </select>
            </div>

            {/* Statistiques des filtres */}
            <div className="flex items-center">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Offres filtrées</p>
                <p className="text-xl font-bold text-blue-600">{filteredOffers.length}</p>
                <p className="text-xs text-gray-500">sur {offers.length} total</p>
              </div>
            </div>
          </div>
            </CardContent>
            </Card>
          </div>

          {/* Liste des offres en attente */}
          <div className="px-4 sm:px-0">
            <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Offres en attente de validation ({filteredOffers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOffers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {offers.length === 0 ? 'Aucune offre en attente de validation' : 'Aucune offre ne correspond aux filtres sélectionnés'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOffers.map((offer) => (
                <div key={offer.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{offer.title}</h3>
                        <Badge variant="outline">{offer.contract_type}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {offer.company_name}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {offer.city || 'Non spécifié'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Euro className="h-4 w-4" />
                          {formatSalary(offer.salary_min, offer.salary_max)}
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                        {offer.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Créée le {formatDate(offer.created_at)}</span>
                        <span>ID France Travail: {offer.france_travail_id}</span>
                        {offer.applications_count > 0 && (
                          <span>{offer.applications_count} candidature(s)</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedOffer(offer)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Détails
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(offer.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(offer.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeter
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Précédent
              </Button>
              <span className="flex items-center px-4">
                Page {page} sur {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Suivant
              </Button>
            </div>
          )}
            </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FranceTravailOffers;
