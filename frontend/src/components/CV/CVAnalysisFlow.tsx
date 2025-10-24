import React, { useState } from 'react';
import {
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import CVUploader from './CVUploader';
import CVPreview from './CVPreview';
import apiService from '../../services/api';
import { CVUploadResponse, CVAnalysisResult } from '../../types';

interface CVAnalysisFlowProps {
  onComplete: () => void;
  onCancel: () => void;
}

type FlowStep = 'upload' | 'preview' | 'saving' | 'complete';

const CVAnalysisFlow: React.FC<CVAnalysisFlowProps> = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('upload');
  const [analysisResult, setAnalysisResult] = useState<CVAnalysisResult | null>(null);
  const [uploadResponse, setUploadResponse] = useState<CVUploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleUploadSuccess = (result: CVUploadResponse) => {
    console.log('✅ Upload réussi:', result);
    setUploadResponse(result);
    setAnalysisResult(result.data.analysis);
    setCurrentStep('preview');
    setError(null);
  };

  const handleUploadError = (errorMessage: string) => {
    console.error('❌ Erreur upload:', errorMessage);
    setError(errorMessage);
    setSuccess(null);
  };

  const handleSaveProfile = async (editedData: CVAnalysisResult) => {
    setCurrentStep('saving');
    setError(null);
    setSuccess(null);

    try {
      console.log('💾 Sauvegarde du profil...');

      const saveData = {
        personal_info: editedData.personal_info,
        professional_summary: editedData.professional_summary,
        experience_years: editedData.experience_years,
        skills: editedData.skills,
        experiences: editedData.experiences,
        educations: editedData.educations,
        document_id: uploadResponse?.data.document_id
      };

      const result = await apiService.saveCVAnalysisToProfile(saveData);

      console.log('✅ Profil sauvegardé:', result);
      setSuccess('Votre profil a été mis à jour avec succès !');
      setCurrentStep('complete');

      // Attendre un peu avant de fermer pour montrer le succès
      setTimeout(() => {
        onComplete();
      }, 2000);

    } catch (error: any) {
      console.error('❌ Erreur sauvegarde:', error);
      setError(error.response?.data?.details || error.message || 'Erreur lors de la sauvegarde');
      setCurrentStep('preview');
    }
  };

  const handleBackToUpload = () => {
    setCurrentStep('upload');
    setAnalysisResult(null);
    setUploadResponse(null);
    setError(null);
    setSuccess(null);
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: 'upload', name: 'Upload', completed: ['preview', 'saving', 'complete'].includes(currentStep) },
      { id: 'preview', name: 'Prévisualisation', completed: ['saving', 'complete'].includes(currentStep) },
      { id: 'saving', name: 'Sauvegarde', completed: currentStep === 'complete' }
    ];

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex items-center">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                ${step.completed
                  ? 'bg-green-600 text-white'
                  : currentStep === step.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }
              `}>
                {step.completed ? (
                  <CheckCircleIcon className="h-5 w-5" />
                ) : (
                  index + 1
                )}
              </div>
              <span className={`ml-2 text-sm font-medium ${step.completed || currentStep === step.id ? 'text-gray-900' : 'text-gray-500'
                }`}>
                {step.name}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`mx-4 h-0.5 w-16 ${steps[index + 1].completed ? 'bg-green-600' : 'bg-gray-200'
                }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Indicateur d'étapes */}
      {renderStepIndicator()}

      {/* Messages d'erreur/succès */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Erreur</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-green-800">Succès</h3>
              <p className="text-sm text-green-700 mt-1">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Contenu selon l'étape */}
      {currentStep === 'upload' && (
        <div>
          <div className="text-center mb-8">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <SparklesIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Analysez votre CV avec l'IA
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Uploadez votre CV et laissez notre intelligence artificielle extraire automatiquement
              vos compétences, expériences et formations pour enrichir votre profil.
            </p>
          </div>

          <CVUploader
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />

          <div className="mt-6 text-center">
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 font-medium"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {currentStep === 'preview' && analysisResult && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleBackToUpload}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Retour à l'upload
            </button>

            <div className="text-sm text-gray-500">
              Fichier analysé : {uploadResponse?.data.original_name}
            </div>
          </div>

          <CVPreview
            analysisResult={analysisResult}
            onSave={handleSaveProfile}
            onCancel={onCancel}
            isSaving={['saving', 'complete'].includes(currentStep)}
          />
        </div>
      )}

      {currentStep === 'saving' && (
        <div className="text-center py-12">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 bg-blue-100 rounded-full animate-pulse"></div>
            <SparklesIcon className="absolute inset-2 text-blue-600 animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Sauvegarde en cours...
          </h3>
          <p className="text-gray-600">
            Nous mettons à jour votre profil avec les informations extraites.
          </p>
        </div>
      )}

      {currentStep === 'complete' && (
        <div className="text-center py-12">
          <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Profil mis à jour avec succès !
          </h3>
          <p className="text-gray-600 mb-6">
            Votre profil a été enrichi avec les informations de votre CV.
          </p>
          <button
            onClick={onComplete}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Terminer
          </button>
        </div>
      )}
    </div>
  );
};

export default CVAnalysisFlow;
