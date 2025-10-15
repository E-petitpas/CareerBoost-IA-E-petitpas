import React from 'react';
import { ExclamationTriangleIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface Company {
  id: string;
  name: string;
  siren?: string;
  domain?: string;
  status: string;
  created_at: string;
}

interface PendingValidationProps {
  company: Company;
}

const PendingValidation: React.FC<PendingValidationProps> = ({ company }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <ClockIcon className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Validation en cours
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Votre entreprise est en attente de validation
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            {/* Informations de l'entreprise */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Informations de votre entreprise
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Nom :</span>
                  <p className="text-sm text-gray-900">{company.name}</p>
                </div>
                {company.siren && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">SIREN :</span>
                    <p className="text-sm text-gray-900">{company.siren}</p>
                  </div>
                )}
                {company.domain && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Domaine :</span>
                    <p className="text-sm text-gray-900">{company.domain}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-gray-500">Statut :</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <ClockIcon className="w-3 h-3 mr-1" />
                    En attente de validation
                  </span>
                </div>
              </div>
            </div>

            {/* Étapes de validation */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Processus de validation
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-sm text-gray-700">Inscription complétée</span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="w-5 h-5 text-yellow-500 mr-3" />
                  <span className="text-sm text-gray-700">Vérification des informations</span>
                </div>
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-400">Validation finale</span>
                </div>
              </div>
            </div>

            {/* Message d'information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="w-5 h-5 text-blue-400 mr-3 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">
                    Validation en cours
                  </h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Notre équipe vérifie actuellement les informations de votre entreprise. 
                    Ce processus prend généralement 24 à 48 heures ouvrées.
                  </p>
                  <p className="text-sm text-blue-700 mt-2">
                    Une fois validée, vous pourrez publier vos offres d'emploi et accéder 
                    à toutes les fonctionnalités de la plateforme.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Vérifier le statut
              </button>
              
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Besoin d'aide ? Contactez-nous à{' '}
                  <a href="mailto:support@careerboost.fr" className="text-primary-600 hover:text-primary-500">
                    support@careerboost.fr
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingValidation;
