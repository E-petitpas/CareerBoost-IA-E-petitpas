import React, { useState, useRef } from 'react';
import {
  DocumentArrowUpIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { CVUploadResponse } from '../../types';
import apiService from '../../services/api';

interface CVUploaderProps {
  onUploadSuccess: (result: CVUploadResponse) => void;
  onUploadError: (error: string) => void;
  disabled?: boolean;
}

const CVUploader: React.FC<CVUploaderProps> = ({
  onUploadSuccess,
  onUploadError,
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedFormats = [
    { ext: '.pdf', desc: 'Documents PDF' },
    { ext: '.doc', desc: 'Documents Word 97-2003' },
    { ext: '.docx', desc: 'Documents Word modernes' }
  ];

  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const validateFile = (file: File): string | null => {
    // Vérifier que le fichier existe
    if (!file) {
      return 'Aucun fichier sélectionné.';
    }

    // Vérifier la taille
    if (file.size === 0) {
      return 'Le fichier sélectionné est vide.';
    }

    if (file.size > maxFileSize) {
      return `Le fichier est trop volumineux (${(file.size / 1024 / 1024).toFixed(1)}MB). Taille maximale: 10MB.`;
    }

    // Vérifier le type MIME
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return `Type de fichier non supporté: ${file.type}. Seuls les fichiers PDF, DOC et DOCX sont acceptés.`;
    }

    // Vérifier l'extension du fichier (sécurité supplémentaire)
    const fileName = file.name.toLowerCase();
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!hasValidExtension) {
      return 'Extension de fichier non supportée. Utilisez .pdf, .doc ou .docx.';
    }

    // Vérifier que le nom de fichier n'est pas suspect
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return 'Nom de fichier non valide.';
    }

    return null;
  };

  const simulateProgress = () => {
    const steps = [
      { progress: 20, message: 'Upload du fichier...' },
      { progress: 40, message: 'Extraction du texte...' },
      { progress: 70, message: 'Analyse avec IA...' },
      { progress: 90, message: 'Finalisation...' },
      { progress: 100, message: 'Terminé !' }
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        const step = steps[stepIndex];
        setUploadProgress(step.progress);
        setCurrentStep(step.message);
        stepIndex++;
      } else {
        clearInterval(interval);
      }
    }, 800);

    return interval;
  };

  const handleFileUpload = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      onUploadError(validationError);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setCurrentStep('Préparation...');

    const progressInterval = simulateProgress();

    try {
      const result = await apiService.uploadAndAnalyzeCV(file);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setCurrentStep('Analyse terminée !');

      setTimeout(() => {
        onUploadSuccess(result);
      }, 500);

    } catch (error: any) {
      clearInterval(progressInterval);
      console.error('Erreur upload CV:', error);
      onUploadError(error.message || 'Erreur lors de l\'upload du CV');
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setCurrentStep('');
      }, 1000);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const openFileDialog = () => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (isUploading) {
    return (
      <div className="bg-white border-2 border-blue-200 rounded-xl p-8">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 bg-blue-100 rounded-full animate-pulse"></div>
            <SparklesIcon className="absolute inset-2 text-blue-600 animate-spin" />
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Analyse de votre CV en cours...
          </h3>

          <p className="text-sm text-gray-600 mb-4">{currentStep}</p>

          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>

          <p className="text-xs text-gray-500">
            Notre IA analyse votre CV pour extraire automatiquement vos compétences,
            expériences et formations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Zone de drop */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
          ${dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx"
          onChange={handleFileSelect}
          disabled={disabled || isUploading}
        />

        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="bg-blue-100 rounded-full p-3">
              <DocumentArrowUpIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Uploadez votre CV pour une analyse automatique
            </h3>
            <p className="text-gray-600 mb-4">
              Glissez-déposez votre CV ici ou cliquez pour sélectionner un fichier
            </p>
          </div>

          <div className="flex items-center justify-center space-x-2 text-sm text-blue-600">
            <SparklesIcon className="h-4 w-4" />
            <span className="font-medium">Analyse IA automatique</span>
          </div>
        </div>
      </div>

      {/* Informations sur les formats supportés */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
          <ExclamationTriangleIcon className="h-4 w-4 text-amber-500 mr-2" />
          Formats supportés
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {supportedFormats.map((format, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="font-mono text-gray-700">{format.ext}</span>
              <span className="text-gray-500">- {format.desc}</span>
            </div>
          ))}
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Taille maximale : 10MB</p>
          <p>• Assurez-vous que votre CV contient du texte sélectionnable (évitez les images scannées)</p>
          <p>• Les CV bien structurés donnent de meilleurs résultats d'analyse</p>
        </div>
      </div>
    </div>
  );
};

export default CVUploader;
