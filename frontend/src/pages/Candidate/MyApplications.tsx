import React from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

const MyApplications: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Mes candidatures
        </h1>

        <div className="text-center py-12">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            Cette page sera développée prochainement pour afficher vos candidatures.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MyApplications;
