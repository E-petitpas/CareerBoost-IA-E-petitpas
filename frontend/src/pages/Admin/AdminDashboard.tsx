import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BuildingOfficeIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import apiService from '../../services/api';

interface AdminStats {
  overview: {
    totalUsers: number;
    totalCompanies: number;
    pendingCompanies: number;
    totalOffers: number;
    activeOffers: number;
    totalApplications: number;
    hiredApplications: number;
    conversionRate: string;
  };
  usersByRole: Record<string, number>;
  applicationsByStatus: Record<string, number>;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAdminDashboard();
      setStats(response.stats);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Erreur de chargement</h3>
          <p className="mt-1 text-sm text-gray-500">Impossible de charger les statistiques</p>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Valider les entreprises',
      description: `${stats.overview.pendingCompanies} entreprises en attente`,
      icon: BuildingOfficeIcon,
      action: () => navigate('/admin/companies'),
      color: 'bg-yellow-500',
      urgent: stats.overview.pendingCompanies > 0
    },
    {
      title: 'Gérer les offres',
      description: `${stats.overview.activeOffers} offres actives`,
      icon: BriefcaseIcon,
      action: () => navigate('/admin/offers'),
      color: 'bg-blue-500'
    },
    {
      title: 'Voir les utilisateurs',
      description: `${stats.overview.totalUsers} utilisateurs`,
      icon: UserGroupIcon,
      action: () => navigate('/admin/users'),
      color: 'bg-green-500'
    },
    {
      title: 'Gérer les compétences',
      description: 'Référentiel de compétences',
      icon: ChartBarIcon,
      action: () => navigate('/admin/skills'),
      color: 'bg-indigo-500'
    },
    {
      title: 'Rapports',
      description: 'Générer des rapports',
      icon: ChartBarIcon,
      action: () => navigate('/admin/reports'),
      color: 'bg-purple-500'
    }
  ];

  const overviewStats = [
    {
      title: 'Utilisateurs totaux',
      value: stats.overview.totalUsers,
      icon: UserGroupIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Entreprises',
      value: stats.overview.totalCompanies,
      icon: BuildingOfficeIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      subtitle: `${stats.overview.pendingCompanies} en attente`
    },
    {
      title: 'Offres actives',
      value: stats.overview.activeOffers,
      icon: BriefcaseIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      subtitle: `${stats.overview.totalOffers} au total`
    },
    {
      title: 'Candidatures',
      value: stats.overview.totalApplications,
      icon: DocumentTextIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      subtitle: `${stats.overview.hiredApplications} embauches`
    },
    {
      title: 'Taux de conversion',
      value: `${stats.overview.conversionRate}%`,
      icon: CheckCircleIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      subtitle: 'Candidatures → Embauches'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrateur</h1>
          <p className="mt-2 text-gray-600">
            Vue d'ensemble de la plateforme CareerBoost
          </p>
        </div>

        {error && (
          <div className="mb-6 px-4 sm:px-0">
            <div className="alert-error">
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Alertes urgentes */}
        {stats.overview.pendingCompanies > 0 && (
          <div className="mb-6 px-4 sm:px-0">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>{stats.overview.pendingCompanies} entreprise(s)</strong> en attente de validation.
                    <button
                      onClick={() => navigate('/admin/companies')}
                      className="ml-2 font-medium underline hover:text-yellow-800"
                    >
                      Voir maintenant →
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          {overviewStats.map((stat, index) => (
            <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-md ${stat.bgColor}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.title}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </dd>
                      {stat.subtitle && (
                        <dd className="text-sm text-gray-500">
                          {stat.subtitle}
                        </dd>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions rapides */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Actions rapides</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={`relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg shadow hover:shadow-md transition-shadow ${action.urgent ? 'ring-2 ring-yellow-400' : ''
                  }`}
              >
                <div>
                  <span className={`rounded-lg inline-flex p-3 ${action.color} text-white`}>
                    <action.icon className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                    {action.title}
                    {action.urgent && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        Urgent
                      </span>
                    )}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {action.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Répartitions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Utilisateurs par rôle */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Utilisateurs par rôle</h3>
            <div className="space-y-3">
              {Object.entries(stats.usersByRole || {}).map(([role, count]) => (
                <div key={role} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    {role === 'CANDIDATE' && 'Candidats'}
                    {role === 'RECRUITER' && 'Recruteurs'}
                    {role === 'ADMIN' && 'Administrateurs'}
                  </span>
                  <span className="text-sm text-gray-900 font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Candidatures par statut */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Candidatures par statut</h3>
            <div className="space-y-3">
              {Object.entries(stats.applicationsByStatus || {}).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    {status === 'ENVOYE' && 'Envoyées'}
                    {status === 'EN_ATTENTE' && 'En attente'}
                    {status === 'ENTRETIEN' && 'Entretiens'}
                    {status === 'REFUS' && 'Refusées'}
                    {status === 'EMBAUCHE' && 'Embauches'}
                  </span>
                  <span className="text-sm text-gray-900 font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
