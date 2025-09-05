import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useAuth, useApi } from '../hooks/useAuth';
import { OnboardingWizard } from './OnboardingWizard';
import { AIDocumentGenerator } from './AIDocumentGenerator';
import { JobFeed } from './JobFeed';
import { ApplicationTracker } from './ApplicationTracker';
import { MessagingSystem } from './MessagingSystem';
import { MessageNotifications } from './MessageNotifications';
import { 
  User, 
  FileText, 
  Brain, 
  MapPin, 
  Star, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Send,
  Download,
  Plus,
  Filter,
  Search,
  Settings,
  TrendingUp,
  Sparkles,
  Bell,
  BarChart,
  MessageSquare
} from 'lucide-react';

export function LearnerDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'documents' | 'jobs' | 'applications' | 'messages' | 'settings'>('dashboard');
  const [jobOffers, setJobOffers] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { user, profile } = useAuth();
  const { apiCall } = useApi();

  // Load data from backend
  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadJobOffers();
      loadApplications();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const response = await apiCall('/profile/complete');
      setUserProfile(response.profile || {});
      
      // Check if profile is complete, if not show onboarding
      if (!response.profile || !response.profile.onboarding_completed) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.warn('Profile loading failed (expected in demo mode):', error);
      // Show onboarding for new users or demo mode
      setShowOnboarding(true);
    }
  };

  const loadJobOffers = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/offers');
      setJobOffers(response.offers || []);
    } catch (error) {
      console.warn('Job offers loading failed (expected in demo mode):', error);
      // In demo mode, we'll use mock data from JobFeed component
      setJobOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const response = await apiCall('/learner/applications');
      setApplications(response.applications || []);
    } catch (error) {
      console.warn('Applications loading failed (expected in demo mode):', error);
      // In demo mode, we'll use mock data from ApplicationTracker component
      setApplications([]);
    }
  };

  const handleOnboardingComplete = async (data: any) => {
    try {
      await apiCall('/profile/onboarding/complete', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      setUserProfile({ ...data, onboarding_completed: true });
      setShowOnboarding(false);
      await loadJobOffers(); // Refresh with new profile data
    } catch (error) {
      console.warn('Onboarding save failed (expected in demo mode):', error);
      // In demo mode, still update the local state
      setUserProfile({ ...data, onboarding_completed: true });
      setShowOnboarding(false);
      await loadJobOffers();
    }
  };

  const handleApplyToJob = async (offerId: string) => {
    try {
      const response = await apiCall('/applications', {
        method: 'POST',
        body: JSON.stringify({ offer_id: offerId })
      });
      
      // Refresh applications
      await loadApplications();
      
      alert('Candidature envoyée avec succès !');
    } catch (error) {
      console.warn('Application submission failed (expected in demo mode):', error);
      alert('Mode démo : candidature simulée avec succès !');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'reviewed': return 'bg-yellow-100 text-yellow-800';
      case 'interview': return 'bg-purple-100 text-purple-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'hired': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'interview': return <AlertCircle className="h-4 w-4" />;
      case 'hired': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'submitted': return 'Envoyée';
      case 'reviewed': return 'En cours d\'examen';
      case 'interview': return 'Entretien';
      case 'rejected': return 'Refusée';
      case 'hired': return 'Embauchée';
      default: return 'En attente';
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-[--color-careerboost-blue] to-[--color-careerboost-green] text-white">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl mb-2">Bonjour {userProfile?.firstName || user?.name} ! 👋</h2>
              <p className="text-blue-100">
                {userProfile?.targetTitle 
                  ? `À la recherche d'un poste de ${userProfile.targetTitle}`
                  : 'Prêt à booster votre carrière avec l\'IA ?'}
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{applications.filter(app => app.status === 'interview').length}</div>
              <div className="text-sm text-blue-100">Entretiens en cours</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('jobs')}>
          <CardContent className="p-6 text-center">
            <Search className="h-12 w-12 text-[--color-careerboost-blue] mx-auto mb-4" />
            <h3 className="mb-2">Découvrir des offres</h3>
            <p className="text-gray-600 text-sm mb-4">
              {jobOffers.length} nouvelles offres correspondent à votre profil
            </p>
            <Badge className="bg-[--color-careerboost-blue] text-white">
              Score moyen: 78%
            </Badge>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('documents')}>
          <CardContent className="p-6 text-center">
            <Sparkles className="h-12 w-12 text-[--color-careerboost-green] mx-auto mb-4" />
            <h3 className="mb-2">Générer CV/LM IA</h3>
            <p className="text-gray-600 text-sm mb-4">
              Créez des documents optimisés en 30 secondes
            </p>
            <Badge className="bg-[--color-careerboost-green] text-white">
              Nouveau
            </Badge>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('applications')}>
          <CardContent className="p-6 text-center">
            <BarChart className="h-12 w-12 text-purple-500 mx-auto mb-4" />
            <h3 className="mb-2">Suivi candidatures</h3>
            <p className="text-gray-600 text-sm mb-4">
              {applications.length} candidatures actives
            </p>
            <Badge className="bg-purple-500 text-white">
              Taux: 15.2%
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Activité récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {applications.slice(0, 3).map((app) => (
                <div key={app.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{app.offer_title}</p>
                    <p className="text-xs text-gray-500">{app.company_name}</p>
                  </div>
                  <Badge className={getStatusColor(app.status)}>
                    {getStatusLabel(app.status)}
                  </Badge>
                </div>
              ))}
              {applications.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  Aucune candidature pour le moment
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2" />
              Offres recommandées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {jobOffers.slice(0, 3).map((job) => (
                <div key={job.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{job.title}</p>
                    <p className="text-xs text-gray-500">{job.company_name} • {job.location}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">
                    {Math.floor(Math.random() * 30) + 70}%
                  </Badge>
                </div>
              ))}
              {jobOffers.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  Complétez votre profil pour voir des recommandations
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl">Mon Profil</h2>
        <Button
          onClick={() => setShowOnboarding(true)}
          variant="outline"
          className="border-[--color-careerboost-blue] text-[--color-careerboost-blue]"
        >
          <Settings className="h-4 w-4 mr-2" />
          Modifier mon profil
        </Button>
      </div>

      {userProfile ? (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-[--color-careerboost-blue] rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl">{userProfile.firstName} {userProfile.lastName}</h3>
                  <p className="text-gray-600">{userProfile.targetTitle || 'Poste recherché à définir'}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> {userProfile.email}</p>
                <p><strong>Téléphone:</strong> {userProfile.phone || 'Non renseigné'}</p>
                <p><strong>Localisation:</strong> {userProfile.location} (Mobilité: {userProfile.mobilityRadius}km)</p>
                {userProfile.targetSector && (
                  <p><strong>Secteur visé:</strong> {userProfile.targetSector}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compétences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {userProfile.skills?.map((skill: string, index: number) => (
                  <Badge key={index} variant="outline" className="border-[--color-careerboost-blue] text-[--color-careerboost-blue]">
                    {skill}
                  </Badge>
                ))}
                {(!userProfile.skills || userProfile.skills.length === 0) && (
                  <p className="text-gray-500 text-sm">Aucune compétence renseignée</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Formation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userProfile.educations?.map((edu: any, index: number) => (
                  <div key={index} className="border-l-2 border-[--color-careerboost-blue] pl-3">
                    <h4 className="font-medium">{edu.degree} - {edu.field}</h4>
                    <p className="text-sm text-gray-600">{edu.school}</p>
                    <p className="text-xs text-gray-500">
                      {edu.startDate} - {edu.current ? 'En cours' : edu.endDate}
                    </p>
                  </div>
                ))}
                {(!userProfile.educations || userProfile.educations.length === 0) && (
                  <p className="text-gray-500 text-sm">Aucune formation renseignée</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expériences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userProfile.experiences?.map((exp: any, index: number) => (
                  <div key={index} className="border-l-2 border-[--color-careerboost-green] pl-3">
                    <h4 className="font-medium">{exp.position}</h4>
                    <p className="text-sm text-gray-600">{exp.company}</p>
                    <p className="text-xs text-gray-500">
                      {exp.startDate} - {exp.current ? 'En cours' : exp.endDate}
                    </p>
                    {exp.description && (
                      <p className="text-xs text-gray-700 mt-1">{exp.description.substring(0, 100)}...</p>
                    )}
                  </div>
                ))}
                {(!userProfile.experiences || userProfile.experiences.length === 0) && (
                  <p className="text-gray-500 text-sm">Aucune expérience renseignée</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg mb-2">Profil incomplet</h3>
            <p className="text-gray-600 mb-4">
              Complétez votre profil pour accéder à toutes les fonctionnalités de CareerBoost.
            </p>
            <Button
              onClick={() => setShowOnboarding(true)}
              className="bg-[--color-careerboost-blue] hover:bg-blue-700"
            >
              Compléter mon profil
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderJobs = () => (
    userProfile ? (
      <JobFeed userProfile={userProfile} />
    ) : (
      <Card>
        <CardContent className="p-12 text-center">
          <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg mb-2">Profil requis</h3>
          <p className="text-gray-600 mb-4">
            Complétez votre profil pour découvrir des offres personnalisées avec scoring IA.
          </p>
          <Button
            onClick={() => setShowOnboarding(true)}
            className="bg-[--color-careerboost-blue] hover:bg-blue-700"
          >
            Compléter mon profil
          </Button>
        </CardContent>
      </Card>
    )
  );

  const renderDocuments = () => (
    userProfile ? (
      <AIDocumentGenerator userProfile={userProfile} />
    ) : (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg mb-2">Profil requis</h3>
          <p className="text-gray-600 mb-4">
            Complétez votre profil pour générer des CV et lettres de motivation optimisés par IA.
          </p>
          <Button
            onClick={() => setShowOnboarding(true)}
            className="bg-[--color-careerboost-blue] hover:bg-blue-700"
          >
            Compléter mon profil
          </Button>
        </CardContent>
      </Card>
    )
  );

  const renderApplications = () => <ApplicationTracker />;

  const renderMessages = () => (
    userProfile && user ? (
      <MessagingSystem userType="learner" userId={user.id} />
    ) : (
      <Card>
        <CardContent className="p-12 text-center">
          <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg mb-2">Messagerie indisponible</h3>
          <p className="text-gray-600 mb-4">
            Complétez votre profil pour accéder à la messagerie et communiquer avec les recruteurs.
          </p>
          <Button
            onClick={() => setShowOnboarding(true)}
            className="bg-[--color-careerboost-blue] hover:bg-blue-700"
          >
            Compléter mon profil
          </Button>
        </CardContent>
      </Card>
    )
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl mb-2">CareerBoost E-petitpas 🚀</h1>
          <p className="text-gray-600">
            {userProfile?.firstName 
              ? `Espace personnel de ${userProfile.firstName}`
              : 'Votre plateforme IA pour booster votre carrière'
            }
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {userProfile && user && (
            <MessageNotifications
              userId={user.id}
              userType="learner"
              onOpenConversation={(conversationId) => {
                setActiveTab('messages');
              }}
            />
          )}
          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
          </Button>
          {userProfile && (
            <div className="text-right">
              <p className="text-sm font-medium">{userProfile.firstName} {userProfile.lastName}</p>
              <p className="text-xs text-gray-500">{userProfile.targetTitle || 'En recherche'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl mb-2">{jobOffers.length}</div>
            <div className="text-sm text-gray-600">Offres disponibles</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl mb-2">{applications.length}</div>
            <div className="text-sm text-gray-600">Candidatures</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl mb-2">
              {applications.filter(app => app.status === 'interview').length}
            </div>
            <div className="text-sm text-gray-600">Entretiens</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl mb-2">
              {applications.length > 0 
                ? Math.round(applications.reduce((sum, app) => sum + (app.ai_score || 0), 0) / applications.length)
                : 0}%
            </div>
            <div className="text-sm text-gray-600">Score IA moyen</div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg">
        <Button 
          variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('dashboard')}
          className="flex-1"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Tableau de bord
        </Button>
        <Button 
          variant={activeTab === 'profile' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('profile')}
          className="flex-1"
        >
          <User className="h-4 w-4 mr-2" />
          Mon Profil
        </Button>
        <Button 
          variant={activeTab === 'documents' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('documents')}
          className="flex-1"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          CV & LM IA
        </Button>
        <Button 
          variant={activeTab === 'jobs' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('jobs')}
          className="flex-1"
        >
          <Search className="h-4 w-4 mr-2" />
          Offres d'emploi
        </Button>
        <Button 
          variant={activeTab === 'applications' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('applications')}
          className="flex-1"
        >
          <FileText className="h-4 w-4 mr-2" />
          Candidatures
        </Button>
        <Button 
          variant={activeTab === 'messages' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('messages')}
          className="flex-1"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Messages
        </Button>
      </div>

      {/* Content */}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'profile' && renderProfile()}
      {activeTab === 'documents' && renderDocuments()}
      {activeTab === 'jobs' && renderJobs()}
      {activeTab === 'applications' && renderApplications()}
      {activeTab === 'messages' && renderMessages()}

      {/* Onboarding Wizard */}
      {showOnboarding && (
        <OnboardingWizard
          onComplete={handleOnboardingComplete}
          onClose={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
}