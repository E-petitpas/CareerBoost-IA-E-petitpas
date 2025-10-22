import React from 'react';
import {
  MapPinIcon,
  BriefcaseIcon,
  CurrencyEuroIcon,
  CalendarIcon,
  ClockIcon,
  BuildingOfficeIcon,
  BookmarkIcon,
  ShareIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { JobOffer } from '../../types';

interface OfferDetailsProps {
  offer: JobOffer;
  isSaved?: boolean;
  isGeneratingLM?: boolean;
  onSave: (offerId: string) => void;
  onApply: (offerId: string) => void;
  onClose?: () => void;
  onGenerateLM?: (offerId: string) => void;
}

const OfferDetails: React.FC<OfferDetailsProps> = ({
  offer,
  isSaved = false,
  isGeneratingLM = false,
  onSave,
  onApply,
  onClose,
  onGenerateLM
}) => {

  const formatSalary = (min?: number, max?: number, currency = '€') => {
    if (!min && !max) return 'Salaire non spécifié';
    if (min && max) return `${min.toLocaleString()} - ${max.toLocaleString()} ${currency}`;
    if (min) return `À partir de ${min.toLocaleString()} ${currency}`;
    if (max) return `Jusqu'à ${max.toLocaleString()} ${currency}`;
    return '';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getScoreBadgeClass = (score?: number) => {
    if (!score) return '';
    if (score >= 90) return 'badge-success';
    if (score >= 70) return 'badge-warning';
    return 'badge-secondary';
  };

  const getExperienceText = (years?: number) => {
    if (!years || years === 0) return 'Débutant accepté';
    if (years === 1) return '1 an d\'expérience';
    return `${years} ans d'expérience`;
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 mr-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {offer.title}
            </h1>
            <div className="flex items-center text-gray-600 mb-3">
              <BuildingOfficeIcon className="h-5 w-5 mr-2" />
              <span className="font-medium text-lg">{offer.companies.name}</span>
              {offer.city && (
                <>
                  <span className="mx-3 text-gray-400">•</span>
                  <MapPinIcon className="h-5 w-5 mr-1" />
                  {offer.city}
                </>
              )}
            </div>
            {offer.score && (
              <span className={`badge ${getScoreBadgeClass(offer.score)}`}>
                {offer.score}% de compatibilité avec votre profil
              </span>
            )}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="btn-outline btn-sm flex items-center space-x-2 hover:bg-gray-100 transition-colors"
              title="Fermer les détails"
            >
              <XMarkIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Fermer</span>
            </button>
          )}
        </div>

        {/* Badge France Travail si applicable */}
        {offer.source === 'EXTERNAL' && offer.source_url && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start">
            <div className="flex-1">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">ℹ️ Offre externe:</span> Cette offre provient de France Travail. Vous serez redirigé vers le site officiel pour postuler.
              </p>
            </div>
          </div>
        )}

        {/* Actions principales */}
        <div className="flex flex-wrap gap-3 mt-4">
          <button
            onClick={() => onApply(offer.id)}
            className="btn-primary flex-1 sm:flex-none"
          >
            {offer.source === 'EXTERNAL' && offer.source_url ? 'Postuler sur France Travail' : 'Postuler maintenant'}
          </button>
          {onGenerateLM && (
            <button
              onClick={() => onGenerateLM(offer.id)}
              disabled={isGeneratingLM}
              className="btn-outline flex-1 sm:flex-none text-green-600 border-green-600 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed relative"
              title="Générer une lettre de motivation pour cette offre"
            >
              {isGeneratingLM ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 text-green-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="hidden sm:inline">Génération en cours...</span>
                  <span className="sm:hidden">...</span>
                </div>
              ) : (
                <>
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  <span className="hidden sm:inline">Générer ma LM</span>
                  <span className="sm:hidden">LM</span>
                </>
              )}
            </button>
          )}
          <button
            onClick={() => onSave(offer.id)}
            className={`btn-outline ${isSaved ? 'text-yellow-600 border-yellow-600' : ''}`}
            title={isSaved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            {isSaved ? (
              <BookmarkSolidIcon className="h-5 w-5" />
            ) : (
              <BookmarkIcon className="h-5 w-5" />
            )}
          </button>
          <button className="btn-outline">
            <ShareIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-6">
        {/* Informations clés */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <CurrencyEuroIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Salaire</p>
              <p className="font-semibold text-gray-900">
                {formatSalary(offer.salary_min, offer.salary_max, offer.currency)}
              </p>
            </div>
          </div>

          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <BriefcaseIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Type de contrat</p>
              <p className="font-semibold text-gray-900">
                {offer.contract_type || 'Non spécifié'}
              </p>
            </div>
          </div>

          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <ClockIcon className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Expérience requise</p>
              <p className="font-semibold text-gray-900">
                {getExperienceText(offer.experience_min)}
              </p>
            </div>
          </div>

          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <CalendarIcon className="h-8 w-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Publié le</p>
              <p className="font-semibold text-gray-900">
                {formatDate(offer.published_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Description du poste */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Description du poste
          </h2>
          <div className="prose prose-sm max-w-none text-gray-700">
            {offer.description.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-3">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Compétences requises */}
        {(() => {
          // Logic to determine if skills should be displayed
          const hasSkills = offer.job_offer_skills && offer.job_offer_skills.length > 0;

          if (!hasSkills) return null;

          // Check if skills seem to be meaningful (not just auto-generated defaults)
          const requiredSkills = offer.job_offer_skills.filter(skill => skill.is_required);
          const optionalSkills = offer.job_offer_skills.filter(skill => !skill.is_required);

          // Common default/generic skills that are often auto-added
          const commonDefaultSkills = [
            'git', 'agile', 'english', 'communication', 'teamwork', 'problem-solving',
            'microsoft-office', 'word', 'excel', 'powerpoint', 'outlook'
          ];

          // Check if most skills are generic defaults
          const totalSkills = offer.job_offer_skills.length;
          const defaultSkillsCount = offer.job_offer_skills.filter(skill =>
            commonDefaultSkills.includes(skill.skills.slug?.toLowerCase() || '')
          ).length;

          // Hide skills section if:
          // 1. More than 70% of skills are common defaults, OR
          // 2. Offer is external with very few skills (likely auto-generated), OR
          // 3. Only has generic office skills
          const isLikelyAutoGenerated = (
            (defaultSkillsCount / totalSkills > 0.7) ||
            (offer.source === 'EXTERNAL' && totalSkills <= 3) ||
            (totalSkills <= 2 && defaultSkillsCount === totalSkills)
          );

          if (isLikelyAutoGenerated) {
            return null;
          }

          return (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Compétences recherchées
              </h2>

              {/* Compétences requises */}
              {requiredSkills.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Compétences requises
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {requiredSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800 font-medium"
                      >
                        {skill.skills.display_name}
                        <ExclamationTriangleIcon className="h-4 w-4 ml-1" />
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Compétences optionnelles */}
              {optionalSkills.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Compétences appréciées
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {optionalSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                      >
                        {skill.skills.display_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Informations sur l'entreprise */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            À propos de l'entreprise
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <BuildingOfficeIcon className="h-6 w-6 text-gray-600 mr-2" />
              <span className="font-semibold text-gray-900">{offer.companies.name}</span>
            </div>
            {offer.companies.sector && (
              <p className="text-gray-600 mb-2">
                <strong>Secteur :</strong> {offer.companies.sector}
              </p>
            )}
            {offer.companies.size_employees && (
              <p className="text-gray-600">
                <strong>Taille :</strong> {offer.companies.size_employees}
              </p>
            )}
          </div>
        </div>

        {/* Call to action final */}
        <div className="bg-primary-50 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-primary-900 mb-2">
            Cette offre vous intéresse ?
          </h3>
          <p className="text-primary-700 mb-4">
            Postulez dès maintenant et mettez toutes les chances de votre côté !
          </p>
          <button
            onClick={() => onApply(offer.id)}
            className="btn-primary btn-lg"
          >
            Postuler à cette offre
          </button>
        </div>
      </div>


    </div>
  );
};

export default OfferDetails;
