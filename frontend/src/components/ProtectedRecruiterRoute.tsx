import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PendingValidation from '../pages/Recruiter/PendingValidation';
import RejectedValidation from '../pages/Recruiter/RejectedValidation';
import apiService from '../services/api';

interface ProtectedRecruiterRouteProps {
  children: React.ReactNode;
}

const ProtectedRecruiterRoute: React.FC<ProtectedRecruiterRouteProps> = ({ children }) => {
  const { user, hasRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pendingValidation, setPendingValidation] = useState<any>(null);

  useEffect(() => {
    checkCompanyValidation();
  }, [user]);

  const checkCompanyValidation = async () => {
    try {
      console.log('ProtectedRecruiterRoute: Début vérification, user:', user?.email, 'role:', user?.role);

      // Seuls les recruteurs sont concernés
      if (!hasRole('RECRUITER')) {
        console.log('ProtectedRecruiterRoute: Pas un recruteur, accès autorisé');
        setLoading(false);
        return;
      }

      console.log('ProtectedRecruiterRoute: Vérification validation entreprise pour recruteur...');

      // Vérifier d'abord le sessionStorage
      const storedPendingValidation = sessionStorage.getItem('pendingValidation');
      if (storedPendingValidation) {
        try {
          const pendingData = JSON.parse(storedPendingValidation);
          console.log('ProtectedRecruiterRoute: Validation en attente trouvée dans sessionStorage:', pendingData);
          setPendingValidation(pendingData);
          sessionStorage.removeItem('pendingValidation');
          setLoading(false);
          return;
        } catch (error) {
          console.error('ProtectedRecruiterRoute: Erreur parsing pendingValidation:', error);
          sessionStorage.removeItem('pendingValidation');
        }
      }

      // Faire une requête test pour vérifier le statut de validation
      console.log('ProtectedRecruiterRoute: Test avec requête simple...');
      try {
        // Utiliser une requête simple qui sera interceptée par le middleware
        const response = await apiService.checkRecruiterValidation();
        console.log('ProtectedRecruiterRoute: Validation OK, accès autorisé');
        setLoading(false);
      } catch (error: any) {
        console.log('ProtectedRecruiterRoute: Erreur lors de la vérification:', error.response?.status, error.response?.data);

        if (error.response?.status === 403 && error.response?.data?.requiresValidation) {
          console.log('ProtectedRecruiterRoute: Entreprise nécessite validation (via erreur 403)');
          console.log('ProtectedRecruiterRoute: Statut:', error.response.data.status);
          setPendingValidation(error.response.data);
        } else if (error.response?.status === 404) {
          // Route non trouvée, essayer avec le dashboard
          console.log('ProtectedRecruiterRoute: Route validation-check non trouvée, test avec dashboard...');
          try {
            const dashboardResponse = await apiService.getRecruiterDashboard();
            console.log('ProtectedRecruiterRoute: Réponse dashboard:', dashboardResponse);

            // Vérifier si la réponse indique une validation en attente
            if (dashboardResponse.status === 'pending_validation') {
              console.log('ProtectedRecruiterRoute: Entreprise en attente de validation (via dashboard)');
              setPendingValidation(dashboardResponse);
              setLoading(false);
              return;
            }

            console.log('ProtectedRecruiterRoute: Entreprise validée, accès autorisé');
            setLoading(false);
          } catch (dashboardError: any) {
            console.log('ProtectedRecruiterRoute: Erreur dashboard:', dashboardError.response?.status, dashboardError.response?.data);

            if (dashboardError.response?.status === 403 && dashboardError.response?.data?.requiresValidation) {
              console.log('ProtectedRecruiterRoute: Entreprise nécessite validation (via dashboard 403)');
              console.log('ProtectedRecruiterRoute: Statut dashboard:', dashboardError.response.data.status);
              setPendingValidation(dashboardError.response.data);
            } else {
              console.error('ProtectedRecruiterRoute: Erreur inattendue dashboard:', dashboardError);
            }
            setLoading(false);
          }
        } else {
          console.error('ProtectedRecruiterRoute: Erreur inattendue:', error);
          setLoading(false);
        }
      }

    } catch (error) {
      console.error('ProtectedRecruiterRoute: Erreur lors de la vérification:', error);
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

  // Si l'entreprise nécessite une validation
  if (pendingValidation) {
    // Entreprise rejetée
    if (pendingValidation.status === 'rejected') {
      return <RejectedValidation company={pendingValidation.rejectedCompany} />;
    }

    // Entreprise en attente (par défaut)
    return <PendingValidation company={pendingValidation.pendingCompany} />;
  }

  // Sinon, afficher le contenu normal
  return <>{children}</>;
};

export default ProtectedRecruiterRoute;
