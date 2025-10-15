import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <ShieldExclamationIcon className="mx-auto h-24 w-24 text-red-400" />
          <h2 className="mt-6 text-6xl font-extrabold text-gray-900">403</h2>
          <h3 className="mt-2 text-3xl font-bold text-gray-900">Accès refusé</h3>
          <p className="mt-2 text-sm text-gray-600">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
        </div>
        
        <div className="mt-8 text-center space-y-4">
          <Link
            to="/dashboard"
            className="btn-primary"
          >
            Retour au tableau de bord
          </Link>
          <div>
            <Link
              to="/"
              className="text-primary-600 hover:text-primary-500 text-sm"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
