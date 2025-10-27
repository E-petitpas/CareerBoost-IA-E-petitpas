import React, { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
  EyeIcon,
  CheckCircleIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import apiService, { API_BASE_URL } from '../../services/api';
import CVAnalysisFlow from '../../components/CV/CVAnalysisFlow';

interface DocumentsSectionProps {
  profile: any;
  onUpdate: () => void;
}

const DocumentsSection: React.FC<DocumentsSectionProps> = ({ profile, onUpdate }) => {
  const [isGeneratingCV, setIsGeneratingCV] = useState(false);
  const [showCVAnalysis, setShowCVAnalysis] = useState(false);
  const [cvUrl, setCvUrl] = useState<string | null>(profile?.cv_url || null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState('');

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
    setGenerationProgress(0);
    setGenerationStep('Initialisation...');

    try {
      // Simulation du progrès pour une meilleure UX
      const progressSteps = [
        { progress: 10, step: 'Analyse de votre profil...' },
        { progress: 30, step: 'Génération du contenu avec IA...' },
        { progress: 60, step: 'Mise en forme du document...' },
        { progress: 80, step: 'Finalisation du CV...' },
        { progress: 95, step: 'Dernières vérifications...' }
      ];

      // Démarrer la génération
      const generationPromise = apiService.generateCV();

      // Simuler le progrès pendant que la génération se fait
      let currentStep = 0;
      const progressInterval = setInterval(() => {
        if (currentStep < progressSteps.length) {
          setGenerationProgress(progressSteps[currentStep].progress);
          setGenerationStep(progressSteps[currentStep].step);
          currentStep++;
        }
      }, 8000); // Changer d'étape toutes les 8 secondes

      const response = await generationPromise;

      // Nettoyer l'intervalle
      clearInterval(progressInterval);

      // Finaliser
      setGenerationProgress(100);
      setGenerationStep('CV généré avec succès !');

      setCvUrl(response.cv_url);
      setSuccess('✨ CV généré avec succès ! Votre profil a été transformé en un CV professionnel.');
      onUpdate(); // Rafraîchir le profil

    } catch (err: any) {
      console.error('Erreur génération CV:', err);

      let errorMessage = '❌ Erreur lors de la génération du CV.';

      if (err.code === 'ECONNABORTED') {
        errorMessage = '⏱️ La génération prend plus de temps que prévu. Veuillez patienter et réessayer dans quelques instants.';
      } else if (err.response?.status === 500) {
        errorMessage = '🔧 Erreur serveur lors de la génération. Notre équipe technique a été notifiée.';
      } else if (err.response?.data?.error) {
        errorMessage = `❌ ${err.response.data.error}`;
      }

      setError(errorMessage);
      setGenerationStep('Erreur lors de la génération');

    } finally {
      setIsGeneratingCV(false);
      setGenerationProgress(0);
      setGenerationStep('');
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

  // Gestion du flux d'analyse CV
  const handleCVAnalysisComplete = async () => {
    setShowCVAnalysis(false);
    setSuccess('✨ Votre profil a été enrichi avec les données de votre CV ! Le CV analysé est maintenant affiché ci-dessous.');

    // Rafraîchir le profil parent pour récupérer les nouvelles données (compétences, cv_url, etc.)
    onUpdate();
  };

  const handleCVAnalysisCancel = () => {
    setShowCVAnalysis(false);
  };

  // Si on affiche le flux d'analyse CV, on remplace tout le contenu
  if (showCVAnalysis) {
    return (
      <div className="p-6">
        <CVAnalysisFlow
          onComplete={handleCVAnalysisComplete}
          onCancel={handleCVAnalysisCancel}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            CV
          </h3>
          <p className="text-sm text-gray-600">
            Gérez vos documents professionnels et utilisez l'IA pour les optimiser.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleGenerateCV}
            disabled={isGeneratingCV}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGeneratingCV ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {generationStep || 'Génération...'}
              </>
            ) : (
              <>
                <SparklesIcon className="h-4 w-4 mr-2" />
                Générer un CV avec IA
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded-md shadow-sm animate-fade-in">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-red-800 mb-2">{error}</p>

              {/* Conseils selon le type d'erreur */}
              {error.includes('temps que prévu') && (
                <div className="text-xs text-red-700 bg-red-100 p-2 rounded">
                  <p className="font-medium mb-1">💡 Conseils :</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Vérifiez votre connexion internet</li>
                    <li>Assurez-vous que votre profil est complet</li>
                    <li>Réessayez dans quelques minutes</li>
                  </ul>
                </div>
              )}

              {error.includes('serveur') && (
                <div className="text-xs text-red-700 bg-red-100 p-2 rounded">
                  <p className="font-medium mb-1">🔧 Problème technique temporaire</p>
                  <p>Nos équipes travaillent à résoudre ce problème. Réessayez dans quelques minutes.</p>
                </div>
              )}

              <div className="mt-3">
                <button
                  onClick={handleGenerateCV}
                  disabled={isGeneratingCV}
                  className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  Réessayer
                </button>
              </div>
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

      {/* Barre de progression pendant la génération */}
      {isGeneratingCV && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center mb-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">{generationStep}</p>
              <p className="text-xs text-blue-700 mt-1">
                Cette opération peut prendre jusqu'à 1 minute. Merci de patienter...
              </p>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${generationProgress}%` }}
            ></div>
          </div>

          {/* Pourcentage */}
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-blue-600">{generationProgress}%</span>
            <span className="text-xs text-blue-600">
              {generationProgress < 100 ? 'En cours...' : 'Terminé !'}
            </span>
          </div>
        </div>
      )}

      {/* Section Import de CV avec IA */}
      <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <CpuChipIcon className="h-6 w-6 text-blue-600 mr-2" />
          <h4 className="text-lg font-medium text-gray-900">Analyse intelligente de CV</h4>
          <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            IA
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Uploadez votre CV et laissez notre IA extraire automatiquement vos compétences,
          expériences et formations pour enrichir votre profil.
        </p>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowCVAnalysis(true)}
            disabled={isGeneratingCV}
            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SparklesIcon className="h-5 w-5 mr-2" />
            Analyser mon CV avec l'IA
          </button>
          <div className="text-sm text-gray-500">
            <p>• Extraction automatique des données</p>
            <p>• Formats supportés : PDF, DOC, DOCX</p>
          </div>
        </div>
      </div>

      {/* Section Import classique supprimée */}

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
            // Affichage du contenu IA ou du PDF
            <div className="h-[800px] bg-gray-50">
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
