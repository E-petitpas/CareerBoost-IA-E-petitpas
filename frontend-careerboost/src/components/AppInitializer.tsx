import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface AppInitializerProps {
  children: React.ReactNode;
}

export function AppInitializer({ children }: AppInitializerProps) {
  const { loading } = useAuth();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Simple delay to ensure all components are ready
    const timer = setTimeout(() => {
      setAppReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (loading || !appReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[--color-careerboost-blue] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl mb-2">CareerBoost E-petitpas</h2>
          <p className="text-gray-600">Chargement de l'application...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}