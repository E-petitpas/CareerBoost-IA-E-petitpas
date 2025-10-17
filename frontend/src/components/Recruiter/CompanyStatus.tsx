/**
 * Composant d'affichage du statut de l'entreprise
 * Affiche le statut de validation et les actions disponibles
 */

import React, { useState } from 'react';
import apiService from '../../services/api';

interface CompanyStatusProps {
  companyId: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  validatedAt?: string;
  validationReason?: string;
  onStatusChange?: (newStatus: string) => void;
}

export const CompanyStatus: React.FC<CompanyStatusProps> = ({
  companyId,
  status,
  validatedAt,
  validationReason,
  onStatusChange
}) => {
  const [isContesting, setIsContesting] = useState(false);
  const [contestMessage, setContestMessage] = useState('');
  const [contestError, setContestError] = useState<string | null>(null);
  const [contestSuccess, setContestSuccess] = useState(false);

  const handleContestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContestError(null);
    setContestSuccess(false);

    if (!contestMessage.trim()) {
      setContestError('Veuillez entrer un message');
      return;
    }

    try {
      await apiService.contestCompanyRejection(companyId, contestMessage);
      setContestSuccess(true);
      setContestMessage('');
      setIsContesting(false);
    } catch (error: any) {
      setContestError(error.response?.data?.error || 'Une erreur est survenue');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Statut de votre entreprise</h3>

      {/* Statut PENDING */}
      {status === 'PENDING' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-yellow-800">
                En attente de validation
              </h4>
              <p className="mt-2 text-sm text-yellow-700">
                Votre entreprise est actuellement en attente de validation par notre équipe.
                Ce processus prend généralement 24 à 48 heures ouvrées.
              </p>
              <p className="mt-2 text-sm text-yellow-700">
                Vous recevrez un email de confirmation une fois votre entreprise validée.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statut VERIFIED */}
      {status === 'VERIFIED' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-green-800">
                Entreprise validée ✓
              </h4>
              <p className="mt-2 text-sm text-green-700">
                Votre entreprise a été validée avec succès. Vous pouvez maintenant publier vos offres d'emploi.
              </p>
              {validatedAt && (
                <p className="mt-2 text-xs text-green-600">
                  Validée le {new Date(validatedAt).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Statut REJECTED */}
      {status === 'REJECTED' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-red-800">
                Entreprise rejetée
              </h4>
              {validationReason && (
                <p className="mt-2 text-sm text-red-700">
                  <strong>Raison :</strong> {validationReason}
                </p>
              )}
              <p className="mt-2 text-sm text-red-700">
                Vous pouvez contester cette décision en nous envoyant un message détaillé.
              </p>

              {!isContesting ? (
                <button
                  onClick={() => setIsContesting(true)}
                  className="mt-3 inline-flex items-center px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                >
                  Contester cette décision
                </button>
              ) : (
                <form onSubmit={handleContestSubmit} className="mt-3 space-y-2">
                  {contestError && (
                    <p className="text-red-600 text-sm">{contestError}</p>
                  )}
                  {contestSuccess && (
                    <p className="text-green-600 text-sm">
                      Votre contestation a été envoyée avec succès.
                    </p>
                  )}
                  <textarea
                    value={contestMessage}
                    onChange={(e) => setContestMessage(e.target.value)}
                    placeholder="Expliquez pourquoi vous contestez cette décision..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition"
                    >
                      Envoyer
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsContesting(false);
                        setContestMessage('');
                        setContestError(null);
                      }}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyStatus;

