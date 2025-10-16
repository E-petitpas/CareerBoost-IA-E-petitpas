import React from 'react';
import {
  CubeIcon,
  ChartBarIcon,
  TagIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import { Skill } from '../../../types';

interface SkillStats {
  totalSkills: number;
  topSkills: Skill[];
  skillsByCategory: any[];
  usageRate: number;
}

interface StatsWidgetProps {
  stats: SkillStats;
  loading?: boolean;
}

export const StatsWidget: React.FC<StatsWidgetProps> = ({
  stats,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const mainStats = [
    {
      title: 'Total compétences',
      value: stats.totalSkills,
      icon: CubeIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'Compétences dans le référentiel'
    },
    {
      title: 'Taux d\'utilisation',
      value: `${stats.usageRate}%`,
      icon: ArrowTrendingUpIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Compétences utilisées'
    },
    {
      title: 'Catégories',
      value: stats.skillsByCategory.length,
      icon: TagIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'Catégories différentes'
    },
    {
      title: 'Top compétences',
      value: stats.topSkills.length,
      icon: ChartBarIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      description: 'Compétences populaires'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat, index) => (
          <div key={index} className="card hover:shadow-md transition-shadow">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.description}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top 5 des compétences les plus utilisées */}
      {stats.topSkills.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5" />
              Compétences les plus utilisées
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {stats.topSkills.slice(0, 5).map((skill, index) => {
                const candidateCount = skill.candidate_count || 0;
                const offerCount = skill.offer_count || 0;
                const totalUsage = candidateCount + offerCount;

                return (
                  <div key={skill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {skill.display_name}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <UserGroupIcon className="h-4 w-4" />
                            {candidateCount} candidats
                          </span>
                          <span className="flex items-center gap-1">
                            <BriefcaseIcon className="h-4 w-4" />
                            {offerCount} offres
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {totalUsage}
                      </div>
                      <div className="text-xs text-gray-500">
                        utilisations
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Répartition par catégories */}
      {stats.skillsByCategory.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TagIcon className="h-5 w-5" />
              Répartition par catégories
            </h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {stats.skillsByCategory.map((categoryItem, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {categoryItem.count || 0}
                    </div>
                    <div className="text-sm text-gray-600 capitalize mt-1">
                      {categoryItem.category || 'Non catégorisé'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
