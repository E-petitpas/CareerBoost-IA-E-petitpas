import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Users, Building2, Settings } from 'lucide-react';

interface DemoAuthProps {
  onSelectRole: (role: 'learner' | 'recruiter' | 'admin') => void;
}

export function DemoAuth({ onSelectRole }: DemoAuthProps) {
  const handleDemoLogin = (userType: 'learner' | 'recruiter' | 'admin') => {
    // Create a demo user
    const demoUser = {
      id: `demo_${userType}_${Date.now()}`,
      email: `demo@${userType}.com`,
      name: userType === 'learner' ? 'Thomas Martin' : 
            userType === 'recruiter' ? 'Sophie Dubois' : 'Admin User',
      user_type: userType
    };
    
    // Store in localStorage for persistence
    localStorage.setItem('demoUser', JSON.stringify(demoUser));
    
    onSelectRole(userType);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4">
        <CardHeader>
          <CardTitle className="text-center">Mode Démonstration</CardTitle>
          <p className="text-center text-gray-600">
            Choisissez un rôle pour explorer l'application
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Card 
              className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 hover:border-[--color-careerboost-blue]"
              onClick={() => handleDemoLogin('learner')}
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-[--color-careerboost-blue] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg mb-2">Apprenant</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Explorer l'espace apprenant
                </p>
                <Button 
                  className="w-full bg-[--color-careerboost-blue] hover:bg-blue-700"
                  onClick={() => handleDemoLogin('learner')}
                >
                  Démo Apprenant
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 hover:border-[--color-careerboost-green]"
              onClick={() => handleDemoLogin('recruiter')}
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-[--color-careerboost-green] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg mb-2">Recruteur</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Explorer l'espace recruteur
                </p>
                <Button 
                  className="w-full bg-[--color-careerboost-green] hover:bg-green-700"
                  onClick={() => handleDemoLogin('recruiter')}
                >
                  Démo Recruteur
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 hover:border-gray-600"
              onClick={() => handleDemoLogin('admin')}
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg mb-2">Admin</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Explorer l'espace admin
                </p>
                <Button 
                  variant="outline"
                  className="w-full border-gray-600 text-gray-600 hover:bg-gray-600 hover:text-white"
                  onClick={() => handleDemoLogin('admin')}
                >
                  Démo Admin
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Mode Démonstration :</strong> Vous explorez l'interface sans données réelles. 
              Les fonctionnalités sont simulées pour présenter les capacités de la plateforme.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}