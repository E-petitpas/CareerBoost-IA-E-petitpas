import React from 'react';
import { XMarkIcon, UserGroupIcon, BriefcaseIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Skill } from '../../../types';

interface SkillUsage {
  skill: Skill;
  usage: {
    candidates: Array<{
      id: string;
      level: string;
      users: {
        name: string;
        email: string;
      };
    }>;
    offers: Array<{
      id: string;
      is_required: boolean;
      weight: number;
      job_offers: {
        id: string;
        title: string;
        companies: {
          name: string;
        };
      };
    }>;
    totalCandidates: number;
    totalOffers: number;
  };
}

interface SkillUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  usage: SkillUsage | null;
  loading?: boolean;
}

export const SkillUsageModal: React.FC<SkillUsageModalProps> = ({
  isOpen,
  onClose,
  usage,
  loading = false
}) => {
  if (!isOpen) return null;

  const getLevelBadge = (level: string) => {
    const levelColors: Record<string, string> = {
      'DEBUTANT': 'bg-yellow-100 text-yellow-800',
      'INTERMEDIAIRE': 'bg-blue-100 text-blue-800',
      'AVANCE': 'bg-green-100 text-green-800',
      'EXPERT': 'bg-purple-100 text-purple-800'
    };

    return (
      <Badge className={levelColors[level] || 'bg-gray-100 text-gray-800'}>
        {level.toLowerCase()}
      </Badge>
    );
  };

  const getRequiredBadge = (isRequired: boolean) => {
    return isRequired ? (
      <Badge variant="destructive">Requis</Badge>
    ) : (
      <Badge variant="outline">Optionnel</Badge>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Utilisation de la compétence
                </h3>
                {usage && (
                  <p className="text-sm text-gray-600 mt-1">
                    {usage.skill.display_name}
                    {usage.skill.category && (
                      <Badge variant="secondary" className="ml-2">
                        {usage.skill.category}
                      </Badge>
                    )}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="spinner w-8 h-8"></div>
              </div>
            ) : usage ? (
              <div className="space-y-6">
                {/* Statistiques générales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card">
                    <div className="card-body text-center">
                      <ChartBarIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">
                        {usage.usage.totalCandidates + usage.usage.totalOffers}
                      </div>
                      <div className="text-sm text-gray-600">Total utilisations</div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-body text-center">
                      <UserGroupIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">
                        {usage.usage.totalCandidates}
                      </div>
                      <div className="text-sm text-gray-600">Candidats</div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-body text-center">
                      <BriefcaseIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">
                        {usage.usage.totalOffers}
                      </div>
                      <div className="text-sm text-gray-600">Offres d'emploi</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Candidats utilisant cette compétence */}
                  <div className="card">
                    <div className="card-header">
                      <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                        <UserGroupIcon className="h-5 w-5" />
                        Candidats ({usage.usage.totalCandidates})
                      </h4>
                    </div>
                    <div className="card-body">
                      {usage.usage.candidates.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                          Aucun candidat n'utilise cette compétence
                        </p>
                      ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {usage.usage.candidates.map((candidate, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {candidate.users.name}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {candidate.users.email}
                                </div>
                              </div>
                              {getLevelBadge(candidate.level)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Offres utilisant cette compétence */}
                  <div className="card">
                    <div className="card-header">
                      <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                        <BriefcaseIcon className="h-5 w-5" />
                        Offres d'emploi ({usage.usage.totalOffers})
                      </h4>
                    </div>
                    <div className="card-body">
                      {usage.usage.offers.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                          Aucune offre n'utilise cette compétence
                        </p>
                      ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {usage.usage.offers.map((offer, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">
                                    {offer.job_offers.title}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {offer.job_offers.companies.name}
                                  </div>
                                </div>
                                {getRequiredBadge(offer.is_required)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Poids: {offer.weight}/5
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>


              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Aucune donnée d'utilisation disponible</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <Button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Fermer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
