import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
  EyeIcon,
  ArrowUpTrayIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';
import apiService from '../../services/api';

interface DocumentsSectionProps {
  profile: any;
  onUpdate: () => void;
}

const DocumentsSection: React.FC<DocumentsSectionProps> = ({ profile, onUpdate }) => {
  const [isGeneratingCV, setIsGeneratingCV] = useState(false);
  const [isGeneratingLM, setIsGeneratingLM] = useState(false);
  const [isUploadingCV, setIsUploadingCV] = useState(false);
  const [cvUrl, setCvUrl] = useState<string | null>(profile?.cv_url || null);
  const [lmUrl, setLmUrl] = useState<string | null>(null);
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
      setSuccess('CV généré avec succès !');
      onUpdate(); // Rafraîchir le profil
    } catch (err: any) {
      console.error('Erreur génération CV:', err);
      setError(err.response?.data?.error || 'Erreur lors de la génération du CV');
    } finally {
      setIsGeneratingCV(false);
    }
  };

  const handleGenerateLM = async () => {
    // Pour l'instant, on va demander à l'utilisateur de choisir une offre
    // Dans une version future, cela sera intégré dans le processus de candidature
    const offerId = prompt('Entrez l\'ID de l\'offre pour laquelle générer une lettre de motivation:');
    if (!offerId) return;

    setIsGeneratingLM(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiService.generateCoverLetter(offerId);
      setLmUrl(response.lm_url);
      setSuccess('Lettre de motivation générée avec succès !');
    } catch (err: any) {
      console.error('Erreur génération LM:', err);
      setError(err.response?.data?.error || 'Erreur lors de la génération de la lettre de motivation');
    } finally {
      setIsGeneratingLM(false);
    }
  };

  const handleViewDocument = (url: string) => {
    if (url) {
      window.open(`http://localhost:3001${url}`, '_blank');
    }
  };

  const handleDownloadDocument = (url: string, filename: string) => {
    if (url) {
      const link = document.createElement('a');
      link.href = `http://localhost:3001${url}`;
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
      setSuccess(`CV "${response.filename}" uploadé avec succès !`);
      onUpdate(); // Rafraîchir le profil

    } catch (err: any) {
      console.error('Erreur upload CV:', err);
      setError(err.response?.data?.error || 'Erreur lors de l\'upload du CV');
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
          Générez automatiquement votre CV et vos lettres de motivation personnalisées grâce à l'intelligence artificielle.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{success}</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section CV */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h4 className="text-lg font-medium text-gray-900">Curriculum Vitae</h4>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Générez un CV professionnel basé sur votre profil et vos expériences.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleGenerateCV}
              disabled={isGeneratingCV}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingCV ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Génération en cours...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Générer mon CV avec IA
                </>
              )}
            </button>

            {(cvUrl || profile?.cv_url) && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewDocument(cvUrl || profile?.cv_url)}
                  className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  Voir
                </button>
                <button
                  onClick={() => handleDownloadDocument(cvUrl || profile?.cv_url, 'mon-cv.html')}
                  className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Télécharger
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Section Lettre de Motivation */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <DocumentTextIcon className="h-6 w-6 text-green-600 mr-2" />
            <h4 className="text-lg font-medium text-gray-900">Lettre de Motivation</h4>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Générez une lettre de motivation personnalisée pour une offre spécifique.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleGenerateLM}
              disabled={isGeneratingLM}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingLM ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Génération en cours...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4 mr-2" />
                  Générer une LM avec IA
                </>
              )}
            </button>

            {lmUrl && (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewDocument(lmUrl)}
                  className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  Voir
                </button>
                <button
                  onClick={() => handleDownloadDocument(lmUrl, 'ma-lettre-motivation.html')}
                  className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Télécharger
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h5 className="text-sm font-medium text-blue-900 mb-2">💡 Conseils pour optimiser vos documents</h5>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Assurez-vous que votre profil est complet avant de générer vos documents</li>
          <li>• Ajoutez des compétences et expériences détaillées pour un meilleur résultat</li>
          <li>• Vous pouvez régénérer vos documents à tout moment après avoir mis à jour votre profil</li>
          <li>• Les lettres de motivation sont personnalisées selon l'offre d'emploi</li>
        </ul>
      </div>
    </div>
  );
};

export default DocumentsSection;
