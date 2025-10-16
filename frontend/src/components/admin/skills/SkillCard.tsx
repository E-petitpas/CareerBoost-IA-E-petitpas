import React from 'react';
import {
  PencilIcon,
  TrashIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { Badge } from '../../ui/badge';

// Utilisation du type global
import { Skill } from '../../../types';

interface SkillCardProps {
  skill: Skill;
  onEdit: (skill: Skill) => void;
  onDelete: (skill: Skill) => void;
  onViewUsage: (skill: Skill) => void;
  isProcessing?: boolean;
}

export const SkillCard: React.FC<SkillCardProps> = ({
  skill,
  onEdit,
  onDelete,
  onViewUsage,
  isProcessing = false
}) => {
  const candidateCount = skill.candidate_count || 0;
  const offerCount = skill.offer_count || 0;
  const totalUsage = skill.total_usage || candidateCount + offerCount;

  const getCategoryBadge = (category?: string) => {
    if (!category) return null;

    const categoryColors: Record<string, string> = {
      'technique': 'bg-blue-100 text-blue-800',
      'comportemental': 'bg-green-100 text-green-800',
      'transversal': 'bg-purple-100 text-purple-800',
      'linguistique': 'bg-yellow-100 text-yellow-800'
    };

    return (
      <Badge
        variant="secondary"
        className={categoryColors[category.toLowerCase()] || 'bg-gray-100 text-gray-800'}
      >
        {category}
      </Badge>
    );
  };

  const getUsageBadge = (count: number) => {
    if (count === 0) return <Badge variant="outline">Non utilisée</Badge>;
    if (count < 5) return <Badge variant="warning">Peu utilisée</Badge>;
    if (count < 20) return <Badge variant="default">Utilisée</Badge>;
    return <Badge variant="success">Très utilisée</Badge>;
  };

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="card-body">
        {/* Header avec nom et statut */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {skill.display_name}
              </h3>
            </div>
            <p className="text-sm text-gray-500">
              Slug: {skill.slug}
            </p>
          </div>

          {/* Badges */}
          <div className="flex flex-col gap-1 items-end">
            {getCategoryBadge(skill.category)}
            {getUsageBadge(totalUsage)}
          </div>
        </div>

        {/* Statistiques d'utilisation */}
        <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">
              {candidateCount}
            </div>
            <div className="text-xs text-gray-500">Candidats</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {offerCount}
            </div>
            <div className="text-xs text-gray-500">Offres</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600">
              {totalUsage}
            </div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Créée le {skill.created_at ? new Date(skill.created_at).toLocaleDateString('fr-FR') : 'N/A'}
          </div>

          <div className="flex items-center gap-2">
            {/* Voir l'utilisation */}
            <button
              onClick={() => onViewUsage(skill)}
              disabled={isProcessing}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="Voir l'utilisation"
            >
              <ChartBarIcon className="h-4 w-4" />
            </button>

            {/* Modifier */}
            <button
              onClick={() => onEdit(skill)}
              disabled={isProcessing}
              className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-md transition-colors"
              title="Modifier"
            >
              <PencilIcon className="h-4 w-4" />
            </button>



            {/* Supprimer */}
            <button
              onClick={() => onDelete(skill)}
              disabled={isProcessing}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Supprimer"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
