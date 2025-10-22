import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
  EyeIcon,
  ArrowUpTrayIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import apiService, { API_BASE_URL } from '../../services/api';

interface DocumentsSectionProps {
  profile: any;
  onUpdate: () => void;
}

const DocumentsSection: React.FC<DocumentsSectionProps> = ({ profile, onUpdate }) => {
  const [isGeneratingCV, setIsGeneratingCV] = useState(false);
  const [isUploadingCV, setIsUploadingCV] = useState(false);
  const [cvUrl, setCvUrl] = useState<string | null>(profile?.cv_url || null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Mettre à jour cvUrl quand le profil change
  useEffect(() => {
    console.log('Profile CV URL:', profile?.cv_url);
    console.log('Current cvUrl state:', cvUrl);
    console.log('Condition cvUrl pour affichage boutons:', cvUrl, !!cvUrl);
    console.log('Profile cv_url direct:', profile?.cv_url, !!profile?.cv_url);
    console.log('Rendu de la grille CV/LM');

    if (profile?.cv_url && profile.cv_url !== cvUrl) {
      setCvUrl(profile.cv_url);
      console.log('CV URL mis à jour de', cvUrl, 'vers', profile.cv_url);
    }
  }, [profile?.cv_url, cvUrl]);

  const handleGenerateCV = async () => {
    setIsGeneratingCV(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiService.generateCV();
      setCvUrl(response.cv_url);
      setSuccess('✨ CV généré avec succès ! Votre profil a été transformé en un CV professionnel.');
      onUpdate(); // Rafraîchir le profil
    } catch (err: any) {
      console.error('Erreur génération CV:', err);
      setError(err.response?.data?.error || '❌ Erreur lors de la génération du CV. Veuillez réessayer.');
    } finally {
      setIsGeneratingCV(false);
    }
  };



  const handleViewDocument = (url: string) => {
    if (url) {
      // Construire l'URL complète en utilisant l'URL de base de l'API
      const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
      window.open(fullUrl, '_blank');
    }
  };

  const handleDownloadDocument = (url: string, filename: string) => {
    if (url) {
      const link = document.createElement('a');
      // Construire l'URL complète en utilisant l'URL de base de l'API
      link.href = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
      link.download = filename;
      link.click();
    }
  };

  const handleUploadCV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setError('Format de fichier non supporté. Veuillez utiliser PDF, DOC ou DOCX.');
      return;
    }

    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Le fichier est trop volumineux. Taille maximum : 10MB.');
      return;
    }

    setIsUploadingCV(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('cv', file);

      const response = await apiService.uploadCV(formData);
      setCvUrl(response.cv_url);
      setSuccess(`✅ CV "${response.filename}" uploadé avec succès ! L'extraction automatique des compétences et expériences est en cours...`);
      onUpdate(); // Rafraîchir le profil

    } catch (err: any) {
      console.error('Erreur upload CV:', err);
      setError(err.response?.data?.error || '❌ Erreur lors de l\'upload du CV. Veuillez réessayer.');
    } finally {
      setIsUploadingCV(false);
      // Reset input
      event.target.value = '';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Génération de documents avec IA
        </h3>
        <p className="text-sm text-gray-600">
          Générez automatiquement votre CV grâce à l'intelligence artificielle.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-md shadow-sm animate-fade-in">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 rounded-md shadow-sm animate-fade-in">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Section Import de CV */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <DocumentArrowUpIcon className="h-6 w-6 text-blue-600 mr-2" />
          <h4 className="text-lg font-medium text-gray-900">Importer un CV existant</h4>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Uploadez votre CV existant (PDF, DOC, DOCX) pour extraire automatiquement vos compétences et expériences.
        </p>

        <div className="flex items-center space-x-4">
          <label className="flex items-center justify-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
            {isUploadingCV ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Upload en cours...
              </>
            ) : (
              <>
                <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                Choisir un fichier
              </>
            )}
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleUploadCV}
              disabled={isUploadingCV}
              className="hidden"
            />
          </label>
          <span className="text-sm text-gray-500">PDF, DOC, DOCX (max 10MB)</span>
        </div>
      </div>

      {/* Section CV - Affichage direct */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <h4 className="text-lg font-medium text-gray-900">Mon CV</h4>
                <p className="text-sm text-gray-600">Curriculum Vitae actuel</p>
              </div>
            </div>
            {(cvUrl || profile?.cv_url) && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleDownloadDocument(cvUrl || profile?.cv_url, 'mon-cv.pdf')}
                  className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Télécharger
                </button>
                <button
                  onClick={() => handleViewDocument(cvUrl || profile?.cv_url)}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  Ouvrir
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Contenu principal du CV */}
        <div className="flex-1">
          {(cvUrl || profile?.cv_url) ? (
            // Affichage direct du CV
            <div className="h-[800px] bg-gray-50">
              {/* Tous les CVs sont maintenant en PDF */}
              <div className="relative h-full bg-white overflow-hidden">
                {/* Badge de statut en haut */}
                <div className="absolute top-4 left-4 z-10">
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 shadow-sm">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-green-800">
                        CV disponible pour vos candidatures
                      </span>
                    </div>
                  </div>
                </div>

                {/* Affichage direct du PDF */}
                <iframe
                  src={`${API_BASE_URL}${cvUrl || profile?.cv_url}`}
                  className="w-full h-full border-0 rounded-b-lg"
                  title="Mon CV"
                />
              </div>
            </div>
          ) : (
            // Aucun CV - Invitation à en générer un
            <div className="flex flex-col items-center justify-center h-[400px] p-8 bg-gray-50 rounded-b-lg">
              <div className="text-center">
                <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun CV disponible
                </h3>
                <p className="text-gray-600 mb-6">
                  Générez votre CV professionnel avec l'IA ou uploadez un CV existant.
                </p>
                <button
                  onClick={handleGenerateCV}
                  disabled={isGeneratingCV}
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingCV ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-5 w-5 mr-3" />
                      Générer mon CV avec IA
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bouton de régénération pour CV existant */}
        {(cvUrl || profile?.cv_url) && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={handleGenerateCV}
              disabled={isGeneratingCV}
              className="w-full flex items-center justify-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingCV ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Régénération en cours...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Régénérer mon CV avec IA
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h5 className="text-sm font-medium text-blue-900 mb-2">💡 Conseils pour optimiser vos documents</h5>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Assurez-vous que votre profil est complet avant de générer vos documents</li>
          <li>• Ajoutez des compétences et expériences détaillées pour un meilleur résultat</li>
          <li>• Vous pouvez régénérer vos documents à tout moment après avoir mis à jour votre profil</li>
          <li>• Vous pouvez générer des lettres de motivation personnalisées directement depuis les offres d'emploi</li>
        </ul>
      </div>
    </div>
  );
};

export default DocumentsSection;
