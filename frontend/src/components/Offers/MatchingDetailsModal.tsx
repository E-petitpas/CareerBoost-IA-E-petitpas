import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { JobOffer } from '../../types';
import { XMarkIcon, BookmarkIcon, ShareIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

interface MatchingDetailsModalProps {
  offer: JobOffer;
  isOpen: boolean;
  onClose: () => void;
  onApply: (offerId: string) => void;
  onSave?: (offerId: string) => void;
  isSaved?: boolean;
  onReport?: (offerId: string, reason: string) => void;
}

const MatchingDetailsModal: React.FC<MatchingDetailsModalProps> = ({
  offer,
  isOpen,
  onClose,
  onApply,
  onSave,
  isSaved = false,
  onReport
}) => {
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');

  if (!isOpen) return null;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: offer.title,
        text: `Découvrez cette offre: ${offer.title} chez ${offer.companies?.name}`,
        url: window.location.href
      });
    } else {
      // Fallback: copier le lien
      navigator.clipboard.writeText(window.location.href);
      alert('Lien copié dans le presse-papiers');
    }
  };

  const handleReport = () => {
    if (reportReason.trim() && onReport) {
      onReport(offer.id, reportReason);
      setShowReportForm(false);
      setReportReason('');
      alert('Signalement envoyé. Merci de votre contribution.');
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score?: number) => {
    if (!score) return 'bg-gray-100';
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getScoreLabel = (score?: number) => {
    if (!score) return 'Pas de score';
    if (score >= 80) return 'Excellent match';
    if (score >= 60) return 'Bon match';
    return 'Match faible';
  };

  // Utiliser createPortal pour rendre la modal au niveau racine du DOM
  // Cela garantit qu'elle est au-dessus de tous les éléments, même ceux avec des z-index élevés
  const modalContent = (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{offer.title}</h2>
            <p className="text-gray-600 mt-1">{offer.companies?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-6">
          {/* Score de matching */}
          <div className={`${getScoreBgColor(offer.score)} rounded-lg p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Score de matching</p>
                <p className={`text-4xl font-bold ${getScoreColor(offer.score)}`}>
                  {offer.score || 0}%
                </p>
                <p className="text-sm text-gray-600 mt-2">{getScoreLabel(offer.score)}</p>
              </div>
              <div className="text-6xl">{offer.score && offer.score >= 80 ? '🎉' : offer.score && offer.score >= 60 ? '👍' : '📊'}</div>
            </div>
          </div>

          {/* Explication détaillée du matching */}
          {offer.explanation && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <span className="mr-2">💡</span>
                Pourquoi ce score ?
              </h3>

              {/* Explication principale (format cahier des charges) */}
              <div className="bg-white rounded-md p-3 mb-4 border-l-4 border-blue-500">
                <p className="text-blue-900 font-medium">{offer.explanation}</p>
              </div>

              {/* Explication pédagogique */}
              <div className="bg-blue-100 rounded-md p-3 mb-4">
                <p className="text-sm text-blue-900 font-medium mb-2">📚 Comprendre votre score</p>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Votre score de matching est calculé en comparant votre profil avec les exigences de l'offre.
                  Les <strong>compétences obligatoires</strong> ont un impact majeur sur le score.
                  Plus vous correspondez aux critères de l'offre, plus votre score est élevé et plus vous avez de chances d'être retenu.
                </p>
              </div>

              {/* Détails du matching selon le cahier des charges */}
              <div className="space-y-3 text-sm">
                {/* Compétences correspondantes */}
                {offer.matched_skills && offer.matched_skills.length > 0 && (
                  <div className="flex items-start bg-white rounded-md p-2">
                    <span className="text-green-600 mr-2 font-bold text-lg">✅</span>
                    <div className="flex-1">
                      <p className="font-medium text-blue-900">Compétences correspondantes</p>
                      <p className="text-blue-700">
                        {offer.matched_skills.length} compétence{offer.matched_skills.length > 1 ? 's' : ''} de votre profil {offer.matched_skills.length > 1 ? 'correspondent' : 'correspond'} à cette offre
                      </p>
                      {/* Afficher les compétences obligatoires matchées */}
                      {offer.matched_skills.filter((s: any) => s.required).length > 0 && (
                        <p className="text-green-700 text-xs mt-1 font-semibold">
                          ✨ {offer.matched_skills.filter((s: any) => s.required).length} obligatoire{offer.matched_skills.filter((s: any) => s.required).length > 1 ? 's' : ''} (excellent !)
                        </p>
                      )}
                      {/* Liste des compétences matchées */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {offer.matched_skills.slice(0, 5).map((skill: any, idx: number) => (
                          <span
                            key={idx}
                            className={`text-xs px-2 py-1 rounded ${skill.required
                                ? 'bg-green-100 text-green-800 font-semibold'
                                : 'bg-blue-100 text-blue-700'
                              }`}
                          >
                            {skill.skill} {skill.required && '✨'}
                          </span>
                        ))}
                        {offer.matched_skills.length > 5 && (
                          <span className="text-xs text-blue-600">
                            +{offer.matched_skills.length - 5} autres
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Compétences manquantes */}
                {offer.missing_skills && offer.missing_skills.length > 0 && (
                  <div className="flex items-start bg-white rounded-md p-2">
                    <span className="text-red-600 mr-2 font-bold text-lg">❌</span>
                    <div className="flex-1">
                      <p className="font-medium text-blue-900">Compétences manquantes</p>
                      <p className="text-blue-700">
                        {offer.missing_skills.length} compétence{offer.missing_skills.length > 1 ? 's' : ''} {offer.missing_skills.length > 1 ? 'ne sont' : 'n\'est'} pas dans votre profil
                      </p>
                      {/* Afficher les compétences obligatoires manquantes */}
                      {offer.missing_skills.filter((s: any) => s.required).length > 0 && (
                        <p className="text-red-700 text-xs mt-1 font-semibold">
                          ⚠️ {offer.missing_skills.filter((s: any) => s.required).length} obligatoire{offer.missing_skills.filter((s: any) => s.required).length > 1 ? 's' : ''} manquante{offer.missing_skills.filter((s: any) => s.required).length > 1 ? 's' : ''} (réduit fortement le score)
                        </p>
                      )}
                      {/* Liste des compétences manquantes */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {offer.missing_skills.slice(0, 5).map((skill: any, idx: number) => (
                          <span
                            key={idx}
                            className={`text-xs px-2 py-1 rounded ${skill.required
                              ? 'bg-red-100 text-red-800 font-semibold'
                              : 'bg-gray-100 text-gray-700'
                              }`}
                          >
                            {skill.skill} {skill.required && '⚠️'}
                          </span>
                        ))}
                        {offer.missing_skills.length > 5 && (
                          <span className="text-xs text-blue-600">
                            +{offer.missing_skills.length - 5} autres
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Distance */}
                {offer.distance_km !== null && offer.distance_km !== undefined && (
                  <div className="flex items-start bg-white rounded-md p-2">
                    <span className="text-orange-600 mr-2 font-bold text-lg">📍</span>
                    <div className="flex-1">
                      <p className="font-medium text-blue-900">Localisation</p>
                      <p className="text-blue-700">
                        L'offre est à {Math.round(offer.distance_km)} km de votre domicile
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Conseils pour améliorer le score */}
              <div className="mt-4 pt-3 border-t border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-2">💡 Comment améliorer votre score ?</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  {offer.missing_skills && offer.missing_skills.filter((s: any) => s.required).length > 0 && (
                    <li>• Acquérir les compétences obligatoires manquantes (impact fort sur le score)</li>
                  )}
                  {offer.missing_skills && offer.missing_skills.filter((s: any) => !s.required).length > 0 && (
                    <li>• Développer les compétences optionnelles pour vous démarquer</li>
                  )}
                  {offer.distance_km && offer.distance_km > 30 && (
                    <li>• Envisager un déménagement ou vérifier les possibilités de télétravail</li>
                  )}
                  <li>• Compléter votre profil avec vos expériences et formations</li>
                </ul>
              </div>
            </div>
          )}

          {/* Compétences matchées */}
          {offer.matched_skills && offer.matched_skills.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                Compétences matchées ({offer.matched_skills.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {offer.matched_skills.map((skill, idx) => (
                  <div
                    key={idx}
                    className="bg-green-50 border border-green-200 rounded p-3"
                  >
                    <p className="font-medium text-green-900">{skill.skill}</p>
                    {skill.level && (
                      <p className="text-sm text-green-700 mt-1">
                        Niveau: {skill.level}/5
                      </p>
                    )}
                    {skill.required && (
                      <p className="text-xs text-green-600 mt-1">Obligatoire</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compétences manquantes */}
          {offer.missing_skills && offer.missing_skills.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="text-red-600 mr-2">❌</span>
                Compétences manquantes ({offer.missing_skills.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {offer.missing_skills.map((skill, idx) => (
                  <div
                    key={idx}
                    className={`${skill.required
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-gray-50 border border-gray-200'
                      } rounded p-3`}
                  >
                    <p className={`font-medium ${skill.required ? 'text-red-900' : 'text-gray-900'}`}>
                      {skill.skill}
                    </p>
                    {skill.required && (
                      <p className="text-xs text-red-600 mt-1">Obligatoire</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Informations de l'offre */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-4">Détails de l'offre</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offer.city && (
                <div>
                  <p className="text-sm text-gray-600">Localisation</p>
                  <p className="font-medium text-gray-900">
                    {offer.city}
                    {offer.distance_km && (
                      <span className="text-sm text-gray-600 ml-2">
                        ({Math.round(offer.distance_km)} km)
                      </span>
                    )}
                  </p>
                </div>
              )}
              {offer.contract_type && (
                <div>
                  <p className="text-sm text-gray-600">Type de contrat</p>
                  <p className="font-medium text-gray-900">{offer.contract_type}</p>
                </div>
              )}
              {offer.experience_min && (
                <div>
                  <p className="text-sm text-gray-600">Expérience requise</p>
                  <p className="font-medium text-gray-900">{offer.experience_min}+ ans</p>
                </div>
              )}
              {offer.salary_min && (
                <div>
                  <p className="text-sm text-gray-600">Salaire</p>
                  <p className="font-medium text-gray-900">
                    {offer.salary_min.toLocaleString()} - {offer.salary_max?.toLocaleString() || '?'} {offer.currency}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{offer.description}</p>
          </div>

          {/* Source originale */}
          {offer.source_url && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Source originale</h3>
              <a
                href={offer.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline break-all"
              >
                {offer.source === 'EXTERNAL' ? '🔗 Voir sur France Travail' : '🔗 Voir l\'offre originale'}
              </a>
            </div>
          )}
        </div>

        {/* Formulaire de signalement */}
        {showReportForm && (
          <div className="border-t border-gray-200 p-6 bg-red-50">
            <h3 className="font-semibold text-red-900 mb-3">Signaler cette offre</h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Décrivez le problème (contenu obsolète, abusif, etc.)"
              className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm mb-3"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowReportForm(false)}
                className="flex-1 px-3 py-2 border border-red-300 rounded-lg text-red-700 font-medium hover:bg-red-100 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleReport}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
              >
                Envoyer le signalement
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <div className="flex flex-wrap gap-2 mb-3">
            {/* Actions secondaires */}
            <button
              onClick={() => onSave?.(offer.id)}
              className={`px-3 py-2 rounded-lg font-medium transition flex items-center gap-2 ${isSaved
                ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              title="Enregistrer cette offre"
            >
              {isSaved ? (
                <BookmarkSolidIcon className="h-5 w-5" />
              ) : (
                <BookmarkIcon className="h-5 w-5" />
              )}
              <span className="hidden sm:inline">{isSaved ? 'Enregistrée' : 'Enregistrer'}</span>
            </button>

            <button
              onClick={handleShare}
              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition flex items-center gap-2"
              title="Partager cette offre"
            >
              <ShareIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Partager</span>
            </button>

            <button
              onClick={() => setShowReportForm(!showReportForm)}
              className="px-3 py-2 border border-red-300 rounded-lg text-red-700 font-medium hover:bg-red-50 transition flex items-center gap-2"
              title="Signaler un problème"
            >
              <ExclamationTriangleIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Signaler</span>
            </button>
          </div>

          {/* Actions principales */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Fermer
            </button>
            <button
              onClick={() => {
                onApply(offer.id);
                onClose();
              }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Postuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Rendre la modal via un Portal au niveau du body
  // Cela garantit qu'elle est toujours au-dessus de tous les autres éléments
  return createPortal(modalContent, document.body);
};

export default MatchingDetailsModal;

