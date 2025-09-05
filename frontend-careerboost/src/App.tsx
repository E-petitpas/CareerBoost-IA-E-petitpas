import React, { useState } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { Users, 
  Building2, 
  Settings, 
  Home,
  Bell,
  FileText,
  Brain,
  MapPin,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  PlusCircle,
  Search,
  Filter,
  Download,
  Eye,
  UserCheck,
  UserX,
  LogOut,
  LogIn,
  UserPlus
} from 'lucide-react';
import { LearnerDashboard } from './components/LearnerDashboard';
import { RecruiterDashboard } from './components/RecruiterDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LoginForm } from './components/LoginForm';
import { MessageNotifications } from './components/MessageNotifications';
import { DemoAuth } from './components/DemoAuth';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DemoIndicator } from './components/DemoIndicator';
import { AppInitializer } from './components/AppInitializer';
import { DemoNotice } from './components/DemoNotice';

type UserRole = 'home' | 'learner' | 'recruiter' | 'admin';

function AppContent() {
  const [currentView, setCurrentView] = useState<UserRole>('home');
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const { user, loading, signOut } = useAuth();

  // Auto-navigate to user's dashboard if logged in
  React.useEffect(() => {
    if (user && currentView === 'home') {
      setCurrentView(user.user_type);
    }
  }, [user, currentView]);

  const renderNavigation = () => {
    if (currentView === 'home' && !user) return null;
    
    return (
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => setCurrentView('home')}
              className="flex items-center space-x-2"
            >
              <Home className="h-5 w-5" />
              <span>CareerBoost E-petitpas</span>
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <>
                {(user.user_type === 'learner' || user.user_type === 'recruiter') && (
                  <MessageNotifications
                    userId={user.id}
                    userType={user.user_type as 'learner' | 'recruiter'}
                    onOpenConversation={() => {
                      // Navigate to messages tab in respective dashboard
                      setCurrentView(user.user_type);
                    }}
                  />
                )}
                <Button variant="ghost" size="sm">
                  <Bell className="h-5 w-5" />
                </Button>
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-[--color-careerboost-blue] flex items-center justify-center">
                    <span className="text-white text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">{user.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>
    );
  };

  const renderHomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl mb-6">
                <span className="text-[--color-careerboost-blue]">Accélérer</span> les carrières grâce à{' '}
                <span className="text-[--color-careerboost-green]">l'IA</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                CareerBoost E-petitpas révolutionne l'insertion professionnelle des jeunes 
                et modernise le recrutement des entreprises grâce à l'intelligence artificielle.
              </p>
              {!user ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg" 
                    className="bg-[--color-careerboost-blue] hover:bg-blue-700"
                    onClick={() => setShowDemo(true)}
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    Démo Interactive
                  </Button>
                  <Button 
                    size="lg" 
                    className="bg-[--color-careerboost-green] hover:bg-green-700"
                    onClick={() => setShowSignup(true)}
                  >
                    <UserPlus className="h-5 w-5 mr-2" />
                    Créer un compte
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-[--color-careerboost-blue] text-[--color-careerboost-blue]"
                    onClick={() => setShowLogin(true)}
                  >
                    <LogIn className="h-5 w-5 mr-2" />
                    Se connecter
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg" 
                    className="bg-[--color-careerboost-blue] hover:bg-blue-700"
                    onClick={() => setCurrentView(user.user_type)}
                  >
                    Accéder à mon espace
                  </Button>
                </div>
              )}
            </div>
            <div className="relative">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1596441248825-45b1f60ce4b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJlZXIlMjBwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMG1lZXRpbmd8ZW58MXx8fHwxNzU2NjY5MzI1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Professionals meeting"
                className="w-full h-96 object-cover rounded-2xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Role Selection - only show if not logged in */}
      {!user && (
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl mb-4">Choisissez votre profil</h2>
            <p className="text-xl text-gray-600">
              Accédez à votre espace personnalisé en fonction de votre rôle
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Apprenant */}
            <Card 
              className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 hover:border-[--color-careerboost-blue]"
              onClick={() => setShowSignup(true)}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-[--color-careerboost-blue] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl mb-4">Apprenant</h3>
                <p className="text-gray-600 mb-6">
                  Trouvez votre emploi idéal avec l'aide de l'IA. 
                  CV et lettres de motivation générés automatiquement.
                </p>
                <div className="space-y-2">
                  <Button 
                    className="w-full bg-[--color-careerboost-blue] hover:bg-blue-700"
                    onClick={() => setShowDemo(true)}
                  >
                    Démo Apprenant
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full border-[--color-careerboost-blue] text-[--color-careerboost-blue]"
                    onClick={() => setShowSignup(true)}
                  >
                    Créer mon compte
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Entreprise */}
            <Card 
              className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 hover:border-[--color-careerboost-green]"
              onClick={() => setShowSignup(true)}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-[--color-careerboost-green] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl mb-4">Entreprise</h3>
                <p className="text-gray-600 mb-6">
                  Recrutez les meilleurs talents avec notre système 
                  de matching intelligent et nos outils RH avancés.
                </p>
                <div className="space-y-2">
                  <Button 
                    className="w-full bg-[--color-careerboost-green] hover:bg-green-700"
                    onClick={() => setShowDemo(true)}
                  >
                    Démo Recruteur
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full border-[--color-careerboost-green] text-[--color-careerboost-green]"
                    onClick={() => setShowSignup(true)}
                  >
                    Créer mon compte
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Administrateur */}
            <Card 
              className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 hover:border-gray-600"
              onClick={() => setShowLogin(true)}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Settings className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl mb-4">Administrateur</h3>
                <p className="text-gray-600 mb-6">
                  Supervisez la plateforme, gérez les entreprises 
                  et analysez les performances globales.
                </p>
                <div className="space-y-2">
                  <Button 
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                    onClick={() => setShowDemo(true)}
                  >
                    Démo Admin
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full border-gray-600 text-gray-600 hover:bg-gray-600 hover:text-white"
                    onClick={() => setShowLogin(true)}
                  >
                    Se connecter
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl mb-4">Pourquoi choisir CareerBoost ?</h2>
            <p className="text-xl text-gray-600">
              Une plateforme complète pour révolutionner le marché de l'emploi
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[--color-careerboost-blue] rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl mb-4">IA Avancée</h3>
              <p className="text-gray-600">
                Algorithmes de matching intelligent et génération automatique de CV/LM
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[--color-careerboost-green] rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl mb-4">Efficacité Optimale</h3>
              <p className="text-gray-600">
                Réduction drastique du temps de recrutement et d'insertion professionnelle
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl mb-4">Suivi Complet</h3>
              <p className="text-gray-600">
                Tableaux de bord détaillés et analytics pour tous les acteurs
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );



  return (
    <div className="min-h-screen bg-gray-50">
      <DemoNotice />
      <DemoIndicator 
        onClose={() => {
          localStorage.removeItem('demoUser');
          window.location.reload();
        }}
      />
      {renderNavigation()}
      
      {currentView === 'home' && renderHomePage()}
      {currentView === 'learner' && user && user.user_type === 'learner' && <LearnerDashboard />}
      {currentView === 'recruiter' && user && user.user_type === 'recruiter' && <RecruiterDashboard />}
      {currentView === 'admin' && user && user.user_type === 'admin' && <AdminDashboard />}
      
      {/* Login/Signup Modals */}
      {showLogin && (
        <LoginForm 
          isSignup={false} 
          onClose={() => setShowLogin(false)} 
          onSuccess={() => {
            setShowLogin(false);
            setCurrentView('home'); // Will auto-redirect based on user type
          }}
        />
      )}
      
      {showSignup && (
        <LoginForm 
          isSignup={true} 
          onClose={() => setShowSignup(false)} 
          onSuccess={() => {
            setShowSignup(false);
            setCurrentView('home'); // Will auto-redirect based on user type
          }}
        />
      )}
      
      {showDemo && (
        <DemoAuth 
          onSelectRole={(role) => {
            setShowDemo(false);
            setCurrentView(role);
            // Force a page refresh to update the user context
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppInitializer>
          <AppContent />
        </AppInitializer>
      </AuthProvider>
    </ErrorBoundary>
  );
}