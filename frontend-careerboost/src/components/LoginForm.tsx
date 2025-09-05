import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { useAuth } from '../hooks/useAuth';
import { X, Eye, EyeOff, Users, Building2, Settings, AlertCircle } from 'lucide-react';

interface LoginFormProps {
  isSignup: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LoginForm({ isSignup, onClose, onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userType, setUserType] = useState<'learner' | 'recruiter' | 'admin'>('learner');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (isSignup) {
        if (!name.trim()) {
          setError('Le nom est requis');
          setLoading(false);
          return;
        }
        result = await signUp(email, password, name, userType);
      } else {
        result = await signIn(email, password);
      }

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Une erreur est survenue');
      }
    } catch (err) {
      setError('Une erreur inattendue est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Demo accounts for testing
  const demoAccounts = [
    { type: 'learner', email: 'apprenant@demo.com', password: 'demo123', name: 'Marie Dubois' },
    { type: 'recruiter', email: 'entreprise@demo.com', password: 'demo123', name: 'TechStart HR' },
    { type: 'admin', email: 'admin@demo.com', password: 'demo123', name: 'Admin CareerBoost' },
  ];

  const handleDemoLogin = async (demoType: 'learner' | 'recruiter' | 'admin') => {
    const demoAccount = demoAccounts.find(acc => acc.type === demoType);
    if (!demoAccount) return;

    setLoading(true);
    setError('');

    try {
      // First try to sign up (in case account doesn't exist)
      await signUp(demoAccount.email, demoAccount.password, demoAccount.name, demoType);
      // Then sign in
      const result = await signIn(demoAccount.email, demoAccount.password);
      if (result.success) {
        onSuccess();
      } else {
        setError('Erreur lors de la connexion de démonstration');
      }
    } catch (err) {
      // If signup fails, try to sign in directly
      const result = await signIn(demoAccount.email, demoAccount.password);
      if (result.success) {
        onSuccess();
      } else {
        setError('Erreur lors de la connexion de démonstration');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 z-10"
        >
          <X className="h-4 w-4" />
        </Button>
        
        <CardHeader>
          <CardTitle className="text-center">
            {isSignup ? 'Créer un compte' : 'Se connecter'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Demo Login Section */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <h4 className="text-sm font-medium mb-3 text-center">
              🚀 Essayez en un clic avec les comptes de démonstration
            </h4>
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('learner')}
                disabled={loading}
                className="justify-start"
              >
                <Users className="h-4 w-4 mr-2" />
                Demo Apprenant
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('recruiter')}
                disabled={loading}
                className="justify-start"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Demo Entreprise
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('admin')}
                disabled={loading}
                className="justify-start"
              >
                <Settings className="h-4 w-4 mr-2" />
                Demo Admin
              </Button>
            </div>
          </div>

          <div className="flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-3 text-sm text-gray-500">ou</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Manual Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Nom complet *</label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Votre nom complet"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Type de compte *</label>
                  <Select value={userType} onValueChange={(value: 'learner' | 'recruiter' | 'admin') => setUserType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="learner">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          Apprenant
                        </div>
                      </SelectItem>
                      <SelectItem value="recruiter">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 mr-2" />
                          Entreprise/Recruteur
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Mot de passe *</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {isSignup && (
                <p className="text-xs text-gray-500 mt-1">
                  Au moins 6 caractères
                </p>
              )}
            </div>
            
            {error && (
              <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-[--color-careerboost-blue] hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {isSignup ? 'Création...' : 'Connexion...'}
                </div>
              ) : (
                isSignup ? 'Créer mon compte' : 'Se connecter'
              )}
            </Button>
          </form>
          
          <div className="text-center text-sm text-gray-600">
            {isSignup ? (
              <>
                Déjà un compte ?{' '}
                <button 
                  className="text-[--color-careerboost-blue] hover:underline"
                  onClick={() => {
                    setError('');
                    onClose();
                  }}
                >
                  Se connecter
                </button>
              </>
            ) : (
              <>
                Pas encore de compte ?{' '}
                <button 
                  className="text-[--color-careerboost-blue] hover:underline"
                  onClick={() => {
                    setError('');
                    onClose();
                  }}
                >
                  Créer un compte
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}