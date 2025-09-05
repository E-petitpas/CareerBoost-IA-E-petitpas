import React, { useEffect } from 'react';

export function DemoNotice() {
  useEffect(() => {
    // Override console.error to filter out expected demo mode errors
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      const message = args[0];
      
      // Filter out expected API errors in demo mode
      if (typeof message === 'string' && (
        message.includes('API Error: Unauthorized') ||
        message.includes('Error loading companies') ||
        message.includes('Error loading global stats') ||
        message.includes('Backend service unavailable')
      )) {
        return; // Don't log these in demo mode
      }
      
      // Log other errors normally
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      const message = args[0];
      
      // Filter out expected warnings in demo mode
      if (typeof message === 'string' && (
        message.includes('expected in demo mode') ||
        message.includes('Using mock')
      )) {
        return; // Don't log these warnings
      }
      
      // Log other warnings normally
      originalWarn.apply(console, args);
    };

    // Show a single info message in console about demo mode
    const isDemoMode = localStorage.getItem('demoUser') !== null;
    if (isDemoMode) {
      console.info('🚀 CareerBoost E-petitpas - Mode Démonstration Actif\n' +
                   'Les données affichées sont simulées pour présenter les fonctionnalités.\n' +
                   'Toutes les interactions sont fonctionnelles mais utilisent des données mock.');
    }

    // Cleanup function to restore original console methods
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return null; // This component doesn't render anything
}