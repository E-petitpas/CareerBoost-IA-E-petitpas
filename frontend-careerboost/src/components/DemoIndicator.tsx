import React from 'react';
import { Badge } from './ui/badge';
import { Eye, X } from 'lucide-react';
import { Button } from './ui/button';

interface DemoIndicatorProps {
  onClose?: () => void;
  showClose?: boolean;
}

export function DemoIndicator({ onClose, showClose = true }: DemoIndicatorProps) {
  // Check if we're in demo mode
  const isDemoMode = localStorage.getItem('demoUser') !== null;
  
  if (!isDemoMode) return null;

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Badge className="bg-blue-600 text-white">
            <Eye className="h-3 w-3 mr-1" />
            Mode Démonstration
          </Badge>
          <span className="text-sm text-blue-800">
            Vous explorez l'interface avec des données simulées pour découvrir les fonctionnalités de CareerBoost.
          </span>
        </div>
        
        {showClose && onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}