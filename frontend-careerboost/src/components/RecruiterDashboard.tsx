import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAuth, useApi } from '../hooks/useAuth';
import { MatchingManager } from './MatchingManager';
import { MessagingSystem } from './MessagingSystem';
import { MessageNotifications } from './MessageNotifications';
import { 
  Building2,
  PlusCircle, 
  Users, 
  TrendingUp, 
  Eye, 
  UserCheck, 
  UserX,
  Star,
  MapPin,
  Clock,
  Send,
  Download,
  Filter,
  Search,
  Crown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Brain,
  MessageSquare
} from 'lucide-react';

export function RecruiterDashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'offers' | 'candidates' | 'matching' | 'messages' | 'publish'>('dashboard');
  const [offers, setOffers] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const { user, profile } = useAuth();
  const { apiCall } = useApi();

  // Form state for publishing offers
  const [offerForm, setOfferForm] = useState({
    title: '',
    location: '',
    type: 'cdi',
    salary: '',
    skills: '',
    description: '',
    experience_level: 'junior',
    remote_work: false,
    is_premium: false
  });

  useEffect(() => {
    if (user) {
      loadOffers();
    }
  }, [user]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/recruiter/offers');
      setOffers(response.offers || []);
    } catch (error) {
      console.warn('Offers loading failed (expected in demo mode):', error);
      // Use mock data for demo
      setOffers([
        {
          id: 'offer_1',
          title: 'Développeur Frontend React',
          location: 'Paris',
          type: 'cdi',
          salary: '45-55k€',
          status: 'active',
          is_premium: true,
          applications_count: 12,
          created_at: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
          skills: ['React', 'TypeScript', 'CSS'],
          description: 'Nous recherchons un développeur frontend passionné...'
        },
        {
          id: 'offer_2',
          title: 'Développeur Full Stack',
          location: 'Lyon',
          type: 'cdi',
          salary: '40-50k€',
          status: 'active',
          is_premium: false,
          applications_count: 8,
          created_at: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 days ago
          skills: ['Node.js', 'React', 'MongoDB'],
          description: 'Rejoignez notre équipe tech en pleine croissance...'
        },
        {
          id: 'offer_3',
          title: 'Stage Développement Web',
          location: 'Remote',
          type: 'stage',
          salary: '800€/mois',
          status: 'active',
          is_premium: false,
          applications_count: 15,
          created_at: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
          skills: ['HTML', 'CSS', 'JavaScript'],
          description: 'Stage de 6 mois dans une startup innovante...'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadCandidatesForOffer = async (offerId: string) => {
    try {
      setLoading(true);
      const response = await apiCall(`/offers/${offerId}/applications`);
      setCandidates(response.applications || []);
      setSelectedOfferId(offerId);
    } catch (error) {
      console.warn('Candidates loading failed (expected in demo mode):', error);
      // Use mock data for demo
      setCandidates([
        {
          id: 'app_1',
          learner_name: 'Thomas Martin',
          offer_title: 'Développeur Frontend React',
          applied_at: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
          status: 'submitted',
          ai_score: 92
        },
        {
          id: 'app_2',
          learner_name: 'Sophie Dubois',
          offer_title: 'Développeur Frontend React',
          applied_at: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
          status: 'reviewed',
          ai_score: 87
        },
        {
          id: 'app_3',
          learner_name: 'Alexandre Durand',
          offer_title: 'Développeur Frontend React',
          applied_at: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
          status: 'interview',
          ai_score: 89
        },
        {
          id: 'app_4',
          learner_name: 'Marie Laurent',
          offer_title: 'Développeur Frontend React',
          applied_at: new Date(Date.now() - 86400000 * 4).toISOString(), // 4 days ago
          status: 'hired',
          ai_score: 94
        }
      ]);
      setSelectedOfferId(offerId);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const offerData = {
        ...offerForm,
        skills: offerForm.skills.split(',').map(s => s.trim()).filter(s => s.length > 0)
      };

      await apiCall('/offers', {
        method: 'POST',
        body: JSON.stringify(offerData)
      });

      alert('Offre publiée avec succès !');
      setOfferForm({
        title: '',
        location: '',
        type: 'cdi',
        salary: '',
        skills: '',
        description: '',
        experience_level: 'junior',
        remote_work: false,
        is_premium: false
      });
      setActiveTab('offers');
      loadOffers();
    } catch (error) {
      console.warn('Offer publishing failed (expected in demo mode):', error);
      alert('Mode démo : offre simulée avec succès !');
      // Add the new offer to local state in demo mode
      const newOffer = {
        id: `offer_${Date.now()}`,
        ...offerData,
        status: 'active',
        applications_count: 0,
        created_at: new Date().toISOString()
      };
      setOffers(prev => [newOffer, ...prev]);
      setOfferForm({
        title: '',
        location: '',
        type: 'cdi',
        salary: '',
        skills: '',
        description: '',
        experience_level: 'junior',
        remote_work: false,
        is_premium: false
      });
      setActiveTab('offers');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      await apiCall(`/applications/${applicationId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });

      // Refresh candidates list
      if (selectedOfferId) {
        await loadCandidatesForOffer(selectedOfferId);
      }

      alert('Statut mis à jour avec succès !');
    } catch (error) {
      console.warn('Application status update failed (expected in demo mode):', error);
      // Update local state in demo mode
      setCandidates(prev =>
        prev.map(candidate =>
          candidate.id === applicationId
            ? { ...candidate, status }
            : candidate
        )
      );
      alert('Mode démo : statut mis à jour localement !');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'reviewed': return 'bg-purple-100 text-purple-800';
      case 'interview': return 'bg-yellow-100 text-yellow-800';
      case 'hired': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <AlertCircle className="h-4 w-4" />;
      case 'reviewed': return <Clock className="h-4 w-4" />;
      case 'interview': return <CheckCircle className="h-4 w-4" />;
      case 'hired': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'submitted': return 'Nouveau';
      case 'reviewed': return 'Examiné';
      case 'interview': return 'Entretien';
      case 'hired': return 'Embauché';
      case 'rejected': return 'Refusé';
      default: return 'En attente';
    }
  };

  const companyStats = {
    activeOffers: offers.filter(offer => offer.status === 'active').length,
    totalApplications: offers.reduce((sum, offer) => sum + (offer.applications_count || 0), 0),
    conversionRate: 12.8, // Mock for now
    averageScore: 84 // Mock for now
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Building2 className="h-8 w-8 text-[--color-careerboost-blue] mx-auto mb-2" />
            <div className="text-2xl mb-1">{companyStats.activeOffers}</div>
            <div className="text-sm text-gray-600">Offres actives</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 text-[--color-careerboost-green] mx-auto mb-2" />
            <div className="text-2xl mb-1">{companyStats.totalApplications}</div>
            <div className="text-sm text-gray-600">Candidatures reçues</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl mb-1">{companyStats.conversionRate}%</div>
            <div className="text-sm text-gray-600">Taux de conversion</div>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setActiveTab('matching')}
        >
          <CardContent className="p-6 text-center">
            <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl mb-1">{companyStats.averageScore}</div>
            <div className="text-sm text-gray-600">Score IA moyen</div>
            <div className="text-xs text-[--color-careerboost-blue] mt-1">Voir matching →</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Offers */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Mes Offres Récentes</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setActiveTab('matching')}
              className="text-[--color-careerboost-blue] border-[--color-careerboost-blue]"
            >
              <Brain className="h-4 w-4 mr-2" />
              Voir Matching IA
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {offers.slice(0, 3).map((offer) => (
              <div key={offer.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{offer.title}</h4>
                  <p className="text-sm text-gray-600">{offer.location} • {offer.type}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-lg">{offer.applications_count || 0}</div>
                    <div className="text-xs text-gray-500">candidatures</div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      loadCandidatesForOffer(offer.id);
                      setActiveTab('candidates');
                    }}
                  >
                    Voir candidatures
                  </Button>
                </div>
              </div>
            ))}
            {offers.length === 0 && (
              <div className="text-center py-8 text-gray-600">
                <p>Aucune offre publiée pour le moment.</p>
                <Button 
                  className="mt-4 bg-[--color-careerboost-blue] hover:bg-blue-700"
                  onClick={() => setActiveTab('publish')}
                >
                  Publier ma première offre
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderOffers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl">Mes Offres d'Emploi</h2>
        <Button 
          className="bg-[--color-careerboost-blue] hover:bg-blue-700"
          onClick={() => setActiveTab('publish')}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Publier une offre
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-[--color-careerboost-blue] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Aucune offre publiée pour le moment.</p>
          <Button 
            className="bg-[--color-careerboost-blue] hover:bg-blue-700"
            onClick={() => setActiveTab('publish')}
          >
            Publier ma première offre
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <Card key={offer.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg">{offer.title}</h3>
                      {offer.is_premium && (
                        <Badge className="bg-yellow-500 hover:bg-yellow-600">
                          <Crown className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {offer.location}
                      </span>
                      <span>{offer.type.toUpperCase()}</span>
                      {offer.salary && <span>{offer.salary}</span>}
                      <span>Publié le {new Date(offer.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl mb-1">{offer.applications_count || 0}</div>
                    <div className="text-sm text-gray-600">candidatures</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <Badge 
                    variant="outline" 
                    className={offer.status === 'active' ? 'border-green-500 text-green-700' : 'border-gray-500'}
                  >
                    {offer.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        loadCandidatesForOffer(offer.id);
                        setActiveTab('candidates');
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir les candidatures
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderCandidates = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl">
          {selectedOfferId ? 'Candidatures pour cette offre' : 'Candidatures Reçues'}
        </h2>
        <div className="flex space-x-2">
          {selectedOfferId && (
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedOfferId(null);
                setCandidates([]);
              }}
            >
              ← Retour
            </Button>
          )}
          <Select onValueChange={(offerId) => loadCandidatesForOffer(offerId)}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Sélectionner une offre" />
            </SelectTrigger>
            <SelectContent>
              {offers.filter(offer => offer.id && offer.id.trim() !== '').map((offer) => (
                <SelectItem key={offer.id} value={offer.id}>
                  {offer.title} ({offer.applications_count || 0} candidatures)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-[--color-careerboost-blue] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des candidatures...</p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">
            {selectedOfferId 
              ? 'Aucune candidature pour cette offre.' 
              : 'Sélectionnez une offre pour voir les candidatures.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {candidates.map((candidate) => (
            <Card key={candidate.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[--color-careerboost-blue] rounded-full flex items-center justify-center">
                      <span className="text-white">{candidate.learner_name.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="text-lg">{candidate.learner_name}</h3>
                      <p className="text-gray-600">{candidate.offer_title}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span>Candidature du {new Date(candidate.applied_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    {candidate.ai_score && (
                      <Badge className="bg-green-500">
                        <Star className="h-3 w-3 mr-1" />
                        Score IA: {candidate.ai_score}%
                      </Badge>
                    )}
                    <Badge className={getStatusColor(candidate.status)}>
                      {getStatusIcon(candidate.status)}
                      <span className="ml-1">{getStatusLabel(candidate.status)}</span>
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-[--color-careerboost-blue] border-[--color-careerboost-blue]"
                    onClick={() => setActiveTab('messages')}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-[--color-careerboost-green] hover:bg-green-700"
                    onClick={() => handleUpdateApplicationStatus(candidate.id, 'interview')}
                    disabled={candidate.status === 'interview' || candidate.status === 'hired'}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Inviter
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 border-red-600"
                    onClick={() => handleUpdateApplicationStatus(candidate.id, 'rejected')}
                    disabled={candidate.status === 'rejected' || candidate.status === 'hired'}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Refuser
                  </Button>
                  {candidate.status === 'interview' && (
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleUpdateApplicationStatus(candidate.id, 'hired')}
                    >
                      Embaucher
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderPublishOffer = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          onClick={() => setActiveTab('offers')}
        >
          ← Retour aux offres
        </Button>
        <h2 className="text-2xl">Publier une Nouvelle Offre</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l'offre</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePublishOffer} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">Titre du poste *</label>
                  <Input 
                    placeholder="Ex: Développeur Frontend React"
                    value={offerForm.title}
                    onChange={(e) => setOfferForm({...offerForm, title: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Type de contrat *</label>
                  <Select 
                    value={offerForm.type} 
                    onValueChange={(value) => setOfferForm({...offerForm, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cdi">CDI</SelectItem>
                      <SelectItem value="cdd">CDD</SelectItem>
                      <SelectItem value="stage">Stage</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm mb-2">Localisation *</label>
                  <Input 
                    placeholder="Ex: Paris, Lyon, Remote"
                    value={offerForm.location}
                    onChange={(e) => setOfferForm({...offerForm, location: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Salaire</label>
                  <Input 
                    placeholder="Ex: 45-55k€"
                    value={offerForm.salary}
                    onChange={(e) => setOfferForm({...offerForm, salary: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">Compétences requises *</label>
                  <Input 
                    placeholder="Ex: React, TypeScript, Node.js (séparées par des virgules)"
                    value={offerForm.skills}
                    onChange={(e) => setOfferForm({...offerForm, skills: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Niveau d'expérience *</label>
                  <Select 
                    value={offerForm.experience_level} 
                    onValueChange={(value) => setOfferForm({...offerForm, experience_level: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="junior">Junior (0-2 ans)</SelectItem>
                      <SelectItem value="medior">Medior (2-5 ans)</SelectItem>
                      <SelectItem value="senior">Senior (5+ ans)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      className="rounded"
                      checked={offerForm.remote_work}
                      onChange={(e) => setOfferForm({...offerForm, remote_work: e.target.checked})}
                    />
                    <span className="text-sm">Télétravail possible</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      className="rounded"
                      checked={offerForm.is_premium}
                      onChange={(e) => setOfferForm({...offerForm, is_premium: e.target.checked})}
                    />
                    <span className="text-sm">Option Premium</span>
                    <Crown className="h-4 w-4 text-yellow-500" />
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2">Description du poste *</label>
              <Textarea 
                placeholder="Décrivez les missions, l'environnement de travail, les avantages..."
                rows={6}
                value={offerForm.description}
                onChange={(e) => setOfferForm({...offerForm, description: e.target.value})}
                required
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setActiveTab('offers')}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                className="bg-[--color-careerboost-blue] hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Publication...
                  </div>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Publier l'offre
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  const renderMessages = () => (
    user ? (
      <MessagingSystem userType="recruiter" userId={user.id} />
    ) : (
      <div className="text-center py-12">
        <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">Messagerie indisponible</p>
      </div>
    )
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl mb-2">Espace Recruteur 🏢</h1>
          <p className="text-gray-600">Gérez vos offres et trouvez les meilleurs talents</p>
        </div>
        <div className="flex items-center space-x-4">
          {user && (
            <MessageNotifications
              userId={user.id}
              userType="recruiter"
              onOpenConversation={(conversationId) => {
                setActiveTab('messages');
              }}
            />
          )}
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-[--color-careerboost-green] flex items-center justify-center">
              <span className="text-white text-sm">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-gray-600">{user?.name}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg">
        <Button 
          variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('dashboard')}
          className="flex-1"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Dashboard
        </Button>
        <Button 
          variant={activeTab === 'offers' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('offers')}
          className="flex-1"
        >
          <Building2 className="h-4 w-4 mr-2" />
          Mes Offres
        </Button>
        <Button 
          variant={activeTab === 'candidates' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('candidates')}
          className="flex-1"
        >
          <Users className="h-4 w-4 mr-2" />
          Candidatures
        </Button>
        <Button 
          variant={activeTab === 'matching' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('matching')}
          className="flex-1"
        >
          <Brain className="h-4 w-4 mr-2" />
          Matching IA
        </Button>
        <Button 
          variant={activeTab === 'messages' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('messages')}
          className="flex-1"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Messages
        </Button>
        <Button 
          variant={activeTab === 'publish' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('publish')}
          className="flex-1"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Publier
        </Button>
      </div>

      {/* Content */}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'offers' && renderOffers()}
      {activeTab === 'candidates' && renderCandidates()}
      {activeTab === 'matching' && <MatchingManager />}
      {activeTab === 'messages' && renderMessages()}
      {activeTab === 'publish' && renderPublishOffer()}
    </div>
  );
}