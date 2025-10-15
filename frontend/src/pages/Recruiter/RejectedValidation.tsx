import React from 'react';
import { 
  XCircleIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface RejectedValidationProps {
  company?: {
    id: string;
    name: string;
    siren?: string;
    domain: string;
    created_at: string;
  };
}

const RejectedValidation: React.FC<RejectedValidationProps> = ({ company }) => {
  const handleContactSupport = () => {
    const subject = encodeURIComponent(`Demande de révision - Entreprise ${company?.name || 'Non spécifiée'}`);
    const body = encodeURIComponent(`Bonjour,

Je souhaite contester la décision de rejet de mon entreprise "${company?.name || 'Non spécifiée'}" (SIREN: ${company?.siren || 'Non spécifié'}).

Informations de l'entreprise :
- Nom : ${company?.name || 'Non spécifié'}
- SIREN : ${company?.siren || 'Non spécifié'}
- Domaine : ${company?.domain || 'Non spécifié'}
- Date d'inscription : ${company?.created_at ? new Date(company.created_at).toLocaleDateString('fr-FR') : 'Non spécifiée'}

Motif de la contestation :
[Veuillez expliquer pourquoi vous pensez que la décision de rejet est incorrecte]

Documents justificatifs :
[Veuillez lister les documents que vous pouvez fournir]

Cordialement,
[Votre nom]`);
    
    window.location.href = `mailto:admin@careerboost.fr?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <XCircleIcon className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Validation refusée
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Votre entreprise n'a pas été validée par notre équipe
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Informations de l'entreprise */}
          {company && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Informations de votre entreprise
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Nom :</span> {company.name}
                </div>
                {company.siren && (
                  <div>
                    <span className="font-medium">SIREN :</span> {company.siren}
                  </div>
                )}
                <div>
                  <span className="font-medium">Domaine :</span> {company.domain}
                </div>
                <div>
                  <span className="font-medium">Date d'inscription :</span>{' '}
                  {new Date(company.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>
          )}

          {/* Message d'explication */}
          <div className="mb-6">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-gray-700">
                <p className="mb-3">
                  Votre demande de validation d'entreprise a été refusée par notre équipe de modération.
                </p>
                <p className="mb-3">
                  Les raisons les plus courantes de refus sont :
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Informations d'entreprise incomplètes ou incorrectes</li>
                  <li>SIREN invalide ou non vérifié</li>
                  <li>Domaine email non professionnel</li>
                  <li>Activité non conforme à nos conditions d'utilisation</li>
                  <li>Documents justificatifs manquants</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions disponibles */}
          <div className="space-y-4">
            {/* Contacter le support */}
            <button
              onClick={handleContactSupport}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <EnvelopeIcon className="h-4 w-4 mr-2" />
              Contester la décision
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </button>

            {/* Informations de contact */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Besoin d'aide ?
              </h4>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <a 
                    href="mailto:support@careerboost.fr" 
                    className="text-blue-600 hover:text-blue-500"
                  >
                    support@careerboost.fr
                  </a>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span>01 23 45 67 89</span>
                  <span className="ml-2 text-xs text-gray-500">(Lun-Ven 9h-18h)</span>
                </div>
              </div>
            </div>

            {/* Nouvelle demande */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-start">
                <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-gray-600">
                  <p className="mb-2">
                    <span className="font-medium">Nouvelle demande :</span>
                  </p>
                  <p>
                    Si vous souhaitez créer un nouveau compte avec des informations corrigées, 
                    vous pouvez vous inscrire à nouveau avec une adresse email différente.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Déconnexion */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
              }}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Se déconnecter et retourner à l'accueil
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          CareerBoost E-petitpas - Plateforme de recrutement intelligente
        </p>
      </div>
    </div>
  );
};

export default RejectedValidation;
