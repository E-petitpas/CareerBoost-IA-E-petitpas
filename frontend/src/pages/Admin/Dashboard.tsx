import React from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';

const AdminDashboard: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Administration
        </h1>

        <div className="text-center py-12">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            Cette page sera développée prochainement avec les outils d'administration.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
