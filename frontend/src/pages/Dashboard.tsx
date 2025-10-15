import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { DashboardStats } from '../types';
import PendingValidation from './Recruiter/PendingValidation';
import RejectedValidation from './Recruiter/RejectedValidation';
import AdminDashboard from './Admin/AdminDashboard';
import {
  BriefcaseIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingValidation, setPendingValidation] = useState<any>(null);

  useEffect(() => {
    // Nettoyer d'abord le sessionStorage pour éviter les données obsolètes
    sessionStorage.removeItem('pendingValidation');

    // Toujours charger les données en temps réel
    loadDashboardData();
  }, [hasRole]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      if (hasRole('RECRUITER')) {
        const response = await apiService.getRecruiterDashboard();

        // Vérifier si l'entreprise est en attente de validation
        if (response.status === 'pending_validation') {
          setPendingValidation(response);
          return;
        }

        setStats(response.stats || null);
      } else if (hasRole('ADMIN')) {
        // Pour les admins, on utilise le dashboard spécialisé
        return;
      }
      // Pour les candidats, on peut ajouter des stats spécifiques plus tard

    } catch (err: any) {
      console.error('Dashboard: Erreur lors du chargement:', err);
      console.log('Dashboard: Status de l\'erreur:', err.response?.status);
      console.log('Dashboard: Données de l\'erreur:', err.response?.data);

      if (err.response?.status === 403) {
        console.log('Dashboard: Erreur 403 détectée');
        if (err.response?.data?.requiresValidation) {
          console.log('Dashboard: Entreprise nécessite validation:', err.response.data);
          setPendingValidation(err.response.data);
        } else {
          console.log('Dashboard: Erreur 403 mais pas de requiresValidation');
          // Forcer la validation pour les erreurs 403 non gérées
          setPendingValidation({
            error: 'Accès refusé',
            requiresValidation: true,
            status: 'unknown'
          });
        }
      } else {
        setError(err.response?.data?.error || err.message || 'Erreur lors du chargement des données');
      }
    } finally {
      setLoading(false);
    }
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    let greeting = 'Bonjour';
    
    if (hour < 12) greeting = 'Bonjour';
    else if (hour < 18) greeting = 'Bon après-midi';
    else greeting = 'Bonsoir';
    
    return `${greeting}, ${user?.name}`;
  };

  const getRoleSpecificActions = () => {
    if (hasRole('CANDIDATE')) {
      return [
        {
          title: 'Rechercher des offres',
          description: 'Découvrez les opportunités qui vous correspondent',
          icon: BriefcaseIcon,
          action: () => navigate('/offers'),
          color: 'bg-blue-500',
        },
        {
          title: 'Mes candidatures',
          description: 'Suivez l\'état de vos candidatures',
          icon: DocumentTextIcon,
          action: () => navigate('/applications'),
          color: 'bg-green-500',
        },
        {
          title: 'Mon profil',
          description: 'Complétez et optimisez votre profil',
          icon: UserGroupIcon,
          action: () => navigate('/profile'),
          color: 'bg-purple-500',
        },
      ];
    }

    if (hasRole('RECRUITER')) {
      return [
        {
          title: 'Publier une offre',
          description: 'Créez une nouvelle offre d\'emploi',
          icon: PlusIcon,
          action: () => navigate('/recruiter/offers/new'),
          color: 'bg-blue-500',
        },
        {
          title: 'Mes offres',
          description: 'Gérez vos offres d\'emploi',
          icon: BriefcaseIcon,
          action: () => navigate('/recruiter/offers'),
          color: 'bg-green-500',
        },
        {
          title: 'Candidatures',
          description: 'Consultez les candidatures reçues',
          icon: DocumentTextIcon,
          action: () => navigate('/recruiter/applications'),
          color: 'bg-purple-500',
        },
        {
          title: 'Dashboard avancé',
          description: 'Accédez aux statistiques détaillées',
          icon: ChartBarIcon,
          action: () => navigate('/recruiter/dashboard'),
          color: 'bg-indigo-500',
        },
      ];
    }

    if (hasRole('ADMIN')) {
      return [
        {
          title: 'Entreprises',
          description: 'Gérer les entreprises et validations',
          icon: UserGroupIcon,
          action: () => navigate('/admin/companies'),
          color: 'bg-blue-500',
        },
        {
          title: 'Offres',
          description: 'Modérer les offres d\'emploi',
          icon: BriefcaseIcon,
          action: () => navigate('/admin/offers'),
          color: 'bg-green-500',
        },
        {
          title: 'France Travail',
          description: 'Gérer les offres France Travail',
          icon: BriefcaseIcon,
          action: () => navigate('/admin/france-travail'),
          color: 'bg-indigo-500',
        },
        {
          title: 'Rapports',
          description: 'Consulter les statistiques',
          icon: ChartBarIcon,
          action: () => navigate('/admin/reports'),
          color: 'bg-purple-500',
        },
      ];
    }

    return [];
  };

  const getStatsCards = () => {
    if (hasRole('RECRUITER') && stats?.offers) {
      return [
        {
          title: 'Offres actives',
          value: stats.offers.active,
          icon: BriefcaseIcon,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
        },
        {
          title: 'Total candidatures',
          value: stats.applications?.total || 0,
          icon: DocumentTextIcon,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
        },
        {
          title: 'En attente',
          value: stats.applications?.pending || 0,
          icon: EyeIcon,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
        },
        {
          title: 'Entretiens',
          value: stats.applications?.interviews || 0,
          icon: UserGroupIcon,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
        },
      ];
    }

    if (hasRole('ADMIN') && stats) {
      return [
        {
          title: 'Entreprises',
          value: stats.companies?.length || 0,
          icon: UserGroupIcon,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
        },
        {
          title: 'Offres totales',
          value: stats.offers?.total || 0,
          icon: BriefcaseIcon,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
        },
        {
          title: 'Candidatures',
          value: stats.applications?.total || 0,
          icon: DocumentTextIcon,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
        },
        {
          title: 'Taux de matching',
          value: '85%',
          icon: ChartBarIcon,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
        },
      ];
    }

    return [];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  // Si l'entreprise nécessite une validation
  if (pendingValidation) {
    // Entreprise rejetée
    if (pendingValidation.status === 'rejected') {
      return <RejectedValidation company={pendingValidation.rejectedCompany} />;
    }

    // Entreprise en attente (par défaut)
    return <PendingValidation company={pendingValidation.pendingCompany || pendingValidation.company} />;
  }

  // Si c'est un admin, utiliser le dashboard spécialisé
  if (hasRole('ADMIN')) {
    return <AdminDashboard />;
  }

  const actions = getRoleSpecificActions();
  const statsCards = getStatsCards();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">
            {getWelcomeMessage()}
          </h1>
          <p className="mt-2 text-gray-600">
            {hasRole('CANDIDATE') && 'Découvrez les opportunités qui vous correspondent'}
            {hasRole('RECRUITER') && 'Gérez vos offres et trouvez les meilleurs talents'}
            {hasRole('ADMIN') && 'Administrez la plateforme CareerBoost'}
          </p>
        </div>

        {error && (
          <div className="mb-6 px-4 sm:px-0">
            <div className="alert-error">
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {statsCards.length > 0 && (
          <div className="px-4 sm:px-0 mb-8">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {statsCards.map((stat, index) => (
                <div key={index} className="card">
                  <div className="card-body">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 p-3 rounded-lg ${stat.bgColor}`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {stat.value}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="px-4 sm:px-0">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Actions rapides
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {actions.map((action, index) => (
              <div
                key={index}
                onClick={action.action}
                className="card hover:shadow-medium transition-shadow cursor-pointer"
              >
                <div className="card-body">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 p-3 rounded-lg ${action.color} text-white`}>
                      <action.icon className="h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity - Placeholder for future implementation */}
        <div className="px-4 sm:px-0 mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Activité récente
          </h2>
          <div className="card">
            <div className="card-body text-center py-12">
              <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                L'activité récente sera affichée ici prochainement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
