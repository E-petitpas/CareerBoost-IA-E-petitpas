import React from 'react';
import {
  MapPinIcon,
  BriefcaseIcon,
  CurrencyEuroIcon,
  CalendarIcon,
  BookmarkIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { JobOffer } from '../../types';

interface OfferCardProps {
  offer: JobOffer;
  isSelected?: boolean;
  isSaved?: boolean;
  onSelect: (offer: JobOffer) => void;
  onSave: (offerId: string) => void;
  onApply: (offerId: string) => void;
}

const OfferCard: React.FC<OfferCardProps> = ({
  offer,
  isSelected = false,
  isSaved = false,
  onSelect,
  onSave,
  onApply
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

  return (
    <div
      className={`card hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1 ${isSelected ? 'ring-2 ring-primary-500 shadow-lg bg-primary-50' : ''
        }`}
    >
      <div className="card-body">
        {/* Header avec titre et score */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 mr-3">
            {offer.title}
          </h3>
          {offer.score && (
            <span className={`badge ${getScoreBadgeClass(offer.score)} flex-shrink-0`}>
              {offer.score}% match
            </span>
          )}
        </div>

        {/* Informations entreprise et localisation */}
        <div className="flex items-center text-sm text-gray-600 mb-3 flex-wrap gap-2">
          <span className="font-medium text-gray-900">{offer.companies.name}</span>
          {offer.city && (
            <>
              <span className="text-gray-400">•</span>
              <div className="flex items-center">
                <MapPinIcon className="h-4 w-4 mr-1" />
                {offer.city}
              </div>
            </>
          )}
          {offer.contract_type && (
            <>
              <span className="text-gray-400">•</span>
              <div className="flex items-center">
                <BriefcaseIcon className="h-4 w-4 mr-1" />
                {offer.contract_type}
              </div>
            </>
          )}
        </div>

        {/* Description tronquée */}
        <p className="text-gray-700 text-sm mb-4 line-clamp-2">
          {offer.description}
        </p>

        {/* Compétences requises */}
        {offer.job_offer_skills && offer.job_offer_skills.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {offer.job_offer_skills.slice(0, 4).map((skill, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center px-2 py-1 rounded text-xs ${skill.is_required
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                    }`}
                >
                  {skill.skills.display_name}
                  {skill.is_required && <span className="ml-1">*</span>}
                </span>
              ))}
              {offer.job_offer_skills.length > 4 && (
                <span className="text-xs text-gray-500 px-2 py-1">
                  +{offer.job_offer_skills.length - 4} autres
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer avec salaire, date et actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex flex-row items-center space-x-1 text-xs text-gray-500">
            <div className="flex items-center">
              <CurrencyEuroIcon className="h-4 w-4 mr-1" />
              {formatSalary(offer.salary_min, offer.salary_max, offer.currency)}
            </div>
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1" />
              {formatDate(offer.published_at)}
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave(offer.id);
              }}
              className={`btn-outline btn-sm ${isSaved ? 'text-yellow-600 border-yellow-600' : ''}`}
              title={isSaved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              {isSaved ? (
                <BookmarkSolidIcon className="h-4 w-4" />
              ) : (
                <BookmarkIcon className="h-4 w-4" />
              )}
            </button>

            <button
              onClick={() => {
                console.log('Bouton Détails cliqué pour:', offer.title);
                onSelect(offer);
              }}
              className="btn-outline btn-sm"
            >
              <EyeIcon className="h-4 w-4 mr-1" />
              Détails
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onApply(offer.id);
              }}
              className="btn-primary btn-sm"
            >
              Postuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferCard;
