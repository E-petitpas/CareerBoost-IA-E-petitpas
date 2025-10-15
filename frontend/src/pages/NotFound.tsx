import React from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-24 w-24 text-gray-400" />
          <h2 className="mt-6 text-6xl font-extrabold text-gray-900">404</h2>
          <h3 className="mt-2 text-3xl font-bold text-gray-900">Page non trouvée</h3>
          <p className="mt-2 text-sm text-gray-600">
            Désolé, nous n'avons pas pu trouver la page que vous recherchez.
          </p>
        </div>
        
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="btn-primary"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
