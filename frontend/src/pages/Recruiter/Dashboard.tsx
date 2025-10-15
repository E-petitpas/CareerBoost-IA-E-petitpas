import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import { ChartBarIcon, ExclamationTriangleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const RecruiterDashboard: React.FC = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadRecruiterData();
  }, []);

  const loadRecruiterData = async () => {
    try {
      setLoading(true);
      setError('');

      if (hasRole('RECRUITER')) {
        const response = await apiService.getRecruiterDashboard();

        // Si l'entreprise est en attente, rediriger vers le dashboard principal
        if (response.status === 'pending_validation') {
          navigate('/dashboard', { replace: true });
          return;
        }

        setStats(response.stats || null);
      }
    } catch (err: any) {
      console.error('RecruiterDashboard: Erreur lors du chargement:', err);

      if (err.response?.status === 403) {
        // Rediriger vers le dashboard principal qui gère les cas PENDING/REJECTED
        navigate('/dashboard', { replace: true });
        return;
      }

      setError(err.response?.data?.error || err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Erreur de chargement</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Retour au dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Tableau de bord recruteur
            </h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Dashboard principal
            </button>
          </div>

          <div className="text-center py-12">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Dashboard avancé en développement
            </h3>
            <p className="text-gray-500 mb-6">
              Cette page sera développée prochainement avec des statistiques détaillées.
            </p>
            <p className="text-sm text-gray-400">
              En attendant, utilisez le dashboard principal pour accéder à toutes les fonctionnalités.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
