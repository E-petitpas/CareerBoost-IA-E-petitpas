import React, { useState, useEffect } from 'react';
import { JobOffer, OfferSearchFilters, Skill } from '../../types';
import apiService from '../../services/api';
import { SearchBar, OffersLayout } from '../../components/Offers';

const OfferSearch: React.FC = () => {
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedOffers, setSavedOffers] = useState<Set<string>>(new Set());
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<JobOffer | null>(null);
  const [filters, setFilters] = useState<OfferSearchFilters>({
    page: 1,
    limit: 10,
    sort: 'relevance',
  });

  useEffect(() => {
    searchOffers();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadSavedOffers();
    loadAvailableSkills();
  }, []);

  const loadSavedOffers = async () => {
    try {
      const response = await apiService.getSavedOffers();
      // response.data peut être un array ou undefined
      const savedOfferIds = response?.data?.map((offer: any) => offer.job_offer_id) || [];
      setSavedOffers(new Set(savedOfferIds));
    } catch (err) {
      console.error('Erreur lors du chargement des offres sauvegardées:', err);
      setSavedOffers(new Set()); // Initialiser avec un Set vide en cas d'erreur
    }
  };

  const loadAvailableSkills = async () => {
    try {
      const response = await apiService.getAllSkills();
      setAvailableSkills(response.skills || []);
    } catch (err) {
      console.error('Erreur lors du chargement des compétences:', err);
    }
  };

  const searchOffers = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Recherche offres avec filtres:', filters);
      const response = await apiService.searchOffers(filters);
      console.log('Réponse API searchOffers:', response);

      if (response && response.data) {
        setOffers(response.data);
      } else {
        console.error('Réponse API invalide:', response);
        setOffers([]);
      }
    } catch (err: any) {
      console.error('Erreur searchOffers:', err);
      setError(err.message || 'Erreur lors de la recherche d\'offres');
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<OfferSearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleOfferSelect = (offer: JobOffer) => {
    console.log('handleOfferSelect appelé avec:', offer.title);
    setSelectedOffer(offer);
  };

  const handleCloseDetails = () => {
    setSelectedOffer(null);
  };

  const toggleSaveOffer = async (offerId: string) => {
    try {
      if (savedOffers.has(offerId)) {
        await apiService.unsaveOffer(offerId);
        setSavedOffers(prev => {
          const newSet = new Set(prev);
          newSet.delete(offerId);
          return newSet;
        });
      } else {
        await apiService.saveOffer(offerId);
        setSavedOffers(prev => {
          const newSet = new Set(prev);
          newSet.add(offerId);
          return newSet;
        });
      }
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleApply = async (offerId: string) => {
    try {
      console.log('Tentative de candidature pour offre:', offerId);

      // Trouver l'offre sélectionnée
      const selectedOffer = offers.find(offer => offer.id === offerId);

      // Si l'offre provient de France Travail, rediriger vers source_url
      if (selectedOffer && selectedOffer.source === 'EXTERNAL' && selectedOffer.source_url) {
        console.log('Redirection vers France Travail:', selectedOffer.source_url);
        window.open(selectedOffer.source_url, '_blank');
        return;
      }

      const customMessage = prompt('Message personnalisé (optionnel):');
      if (customMessage === null) {
        // L'utilisateur a annulé
        return;
      }

      const result = await apiService.applyToOffer(offerId, customMessage || undefined);
      console.log('Candidature réussie:', result);

      alert('🎉 Candidature envoyée avec succès !');

      // Optionnel: rediriger vers la page de suivi des candidatures
      // window.location.href = '/applications';

    } catch (err: any) {
      console.error('Erreur candidature:', err);

      // Gestion des erreurs spécifiques
      if (err.response?.status === 409) {
        const retry = window.confirm('❌ Vous avez déjà postulé à cette offre. Voulez-vous supprimer votre candidature existante pour retester ?');
        if (retry) {
          try {
            await apiService.deleteTestApplication(offerId);
            alert('✅ Candidature supprimée. Vous pouvez maintenant postuler à nouveau.');
          } catch (deleteErr: any) {
            alert('❌ Erreur lors de la suppression: ' + (deleteErr.response?.data?.error || deleteErr.message));
          }
        }
      } else if (err.response?.status === 400) {
        alert('❌ Profil incomplet. Veuillez compléter votre profil avant de postuler.');
      } else {
        alert('❌ ' + (err.response?.data?.error || err.message || 'Erreur lors de la candidature'));
      }
    }
  };

  const handleGenerateLM = async (offerId: string) => {
    try {
      console.log('Génération de LM pour offre:', offerId);

      const result = await apiService.generateCoverLetter(offerId);
      console.log('LM générée:', result);

      alert('🎉 Lettre de motivation générée avec succès !');

      // Ouvrir la LM dans un nouvel onglet
      if (result.lm_url) {
        const fullUrl = result.lm_url.startsWith('http') ? result.lm_url : `http://localhost:3001${result.lm_url}`;
        window.open(fullUrl, '_blank');
      }

    } catch (err: any) {
      console.error('Erreur génération LM:', err);
      alert('❌ ' + (err.response?.data?.error || err.message || 'Erreur lors de la génération de la lettre de motivation'));
    }
  };

  const clearAllFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      sort: 'relevance',
    });
  };

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Recherche d'offres d'emploi
        </h1>
      </div>

      {/* SearchBar sticky */}
      <div className="sticky top-0 max-w-7xl mx-auto px-8 z-20">
        <SearchBar
          filters={filters}
          onFiltersChange={handleFilterChange}
          onSearch={searchOffers}
          loading={loading}
          availableSkills={availableSkills}
          onClearFilters={clearAllFilters}
        />
      </div>

      {/* Layout principal avec les offres */}
      <div className="pb-20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <OffersLayout
            offers={offers}
            selectedOffer={selectedOffer}
            savedOffers={savedOffers}
            loading={loading}
            error={error}
            onOfferSelect={handleOfferSelect}
            onOfferSave={toggleSaveOffer}
            onOfferApply={handleApply}
            onCloseDetails={handleCloseDetails}
            onGenerateLM={handleGenerateLM}
          />
        </div>
      </div>
    </div>
  );
};

export default OfferSearch;
