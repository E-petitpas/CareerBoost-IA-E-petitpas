import React from 'react';
import { JobOffer } from '../../types';
import OfferCard from './OfferCard';
import OfferDetails from './OfferDetails';
import { BriefcaseIcon } from '@heroicons/react/24/outline';

interface OffersLayoutProps {
  offers: JobOffer[];
  selectedOffer: JobOffer | null;
  savedOffers: Set<string>;
  loading: boolean;
  error: string;
  onOfferSelect: (offer: JobOffer) => void;
  onOfferSave: (offerId: string) => void;
  onOfferApply: (offerId: string) => void;
  onCloseDetails?: () => void;
  onGenerateLM?: (offerId: string) => void;
}

const OffersLayout: React.FC<OffersLayoutProps> = ({
  offers,
  selectedOffer,
  savedOffers,
  loading,
  error,
  onOfferSelect,
  onOfferSave,
  onOfferApply,
  onCloseDetails,
  onGenerateLM
}) => {
  const renderOffersList = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="spinner w-8 h-8 mx-auto mb-4"></div>
            <p className="text-gray-500">Recherche en cours...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4">
          <div className="alert-error">
            <p>{error}</p>
          </div>
        </div>
      );
    }

    if (!offers || offers.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <BriefcaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucune offre trouvée avec ces critères.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 p-4">
        {offers.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            isSelected={selectedOffer?.id === offer.id}
            isSaved={savedOffers.has(offer.id)}
            onSelect={onOfferSelect}
            onSave={onOfferSave}
            onApply={onOfferApply}
            onGenerateLM={onGenerateLM}
          />
        ))}
      </div>
    );
  };



  console.log('OffersLayout render - selectedOffer:', selectedOffer?.title || 'null');

  return (
    <div className="h-full">
      {!selectedOffer ? (
        // Vue initiale : Liste pleine largeur
        <div className="h-full">
          {renderOffersList()}
        </div>
      ) : (
        // Vue avec détails : Layout responsive (colonne sur mobile, deux colonnes sur desktop)
        <div className="flex flex-col lg:flex-row gap-6 h-full">
          {/* Liste des offres - Colonne de gauche avec scroll indépendant */}
          <div className="w-full lg:w-1/2 flex-shrink-0">
            <div className="overflow-y-auto custom-scrollbar pr-2" style={{ height: 'calc(100vh - 200px)' }}>
              {renderOffersList()}
            </div>
          </div>

          {/* Détails de l'offre - Colonne de droite sticky */}
          <div className="w-full lg:w-1/2 flex-shrink-0 animate-slide-in-right animate-fade-in">
            <div className="sticky top-0 overflow-y-auto custom-scrollbar" style={{ height: 'calc(100vh - 200px)' }}>
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <OfferDetails
                  offer={selectedOffer}
                  isSaved={savedOffers.has(selectedOffer.id)}
                  onSave={onOfferSave}
                  onApply={onOfferApply}
                  onClose={onCloseDetails}
                  onGenerateLM={onGenerateLM}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OffersLayout;
