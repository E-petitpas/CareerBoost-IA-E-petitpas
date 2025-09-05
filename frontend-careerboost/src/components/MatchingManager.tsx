import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useApi } from '../hooks/useAuth';
import { 
  Users, 
  Star,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserCheck,
  UserX,
  Filter,
  Search,
  Download,
  Eye,
  TrendingUp,
  BarChart,
  Crown,
  Brain,
  Award,
  Target
} from 'lucide-react';

interface CandidateApplication {
  id: string;
  learner_name: string;
  learner_id: string;
  offer_title: string;
  offer_id: string;
  ai_score: number;
  matched_skills: string[];
  missing_skills: string[];
  distance: number;
  location: string;
  experience_level: string;
  status: 'submitted' | 'reviewed' | 'interview' | 'hired' | 'rejected';
  applied_at: string;
  is_premium?: boolean;
  cv_generated?: string;
  cover_letter_generated?: string;
}

interface MatchingAnalytics {
  totalApplications: number;
  averageScore: number;
  conversionRate: number;
  interviewsScheduled: number;
  hiredCount: number;
  applicationsByOffer: { offer_title: string; count: number; avg_score: number }[];
}

export function MatchingManager() {
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<CandidateApplication[]>([]);
  const [analytics, setAnalytics] = useState<MatchingAnalytics | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateApplication | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    minScore: '',
    status: 'all',
    premiumOnly: false,
    searchTerm: ''
  });
  const [sortBy, setSortBy] = useState<'score' | 'date' | 'distance' | 'skills'>('score');
  const { apiCall } = useApi();

  useEffect(() => {
    loadApplicationsAndAnalytics();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [applications, filters, sortBy]);

  const loadApplicationsAndAnalytics = async () => {
    try {
      setLoading(true);
      
      // Mock data - En production, ceci viendrait de l'API
      const mockApplications: CandidateApplication[] = [
        {
          id: '1',
          learner_name: 'Marie Dubois',
          learner_id: 'learner_1',
          offer_title: 'Développeur Frontend React',
          offer_id: 'offer_1',
          ai_score: 87,
          matched_skills: ['React', 'TypeScript', 'CSS', 'JavaScript', 'HTML'],
          missing_skills: ['Docker', 'AWS'],
          distance: 15,
          location: 'Paris',
          experience_level: 'medior',
          status: 'submitted',
          applied_at: '2024-01-15T10:00:00Z',
          is_premium: true,
          cv_generated: 'CV généré par IA basé sur le profil et l\'offre...',
          cover_letter_generated: 'Lettre de motivation personnalisée...'
        },
        {
          id: '2',
          learner_name: 'Thomas Martin',
          learner_id: 'learner_2',
          offer_title: 'Développeur FullStack',
          offer_id: 'offer_2',
          ai_score: 72,
          matched_skills: ['JavaScript', 'Node.js', 'MongoDB', 'Express'],
          missing_skills: ['Docker', 'Kubernetes', 'AWS'],
          distance: 25,
          location: 'Lyon',
          experience_level: 'junior',
          status: 'interview',
          applied_at: '2024-01-14T14:30:00Z',
          cv_generated: 'CV optimisé pour le poste...',
          cover_letter_generated: 'Lettre personnalisée...'
        },
        {
          id: '3',
          learner_name: 'Sophie Bernard',
          learner_id: 'learner_3',
          offer_title: 'DevOps Engineer',
          offer_id: 'offer_3',
          ai_score: 45,
          matched_skills: ['Linux', 'Git'],
          missing_skills: ['Docker', 'Kubernetes', 'Jenkins', 'Terraform', 'AWS'],
          distance: 8,
          location: 'Paris',
          experience_level: 'junior',
          status: 'submitted',
          applied_at: '2024-01-13T09:15:00Z',
          cv_generated: 'CV adapté aux compétences DevOps...',
          cover_letter_generated: 'Lettre motivante pour DevOps...'
        },
        {
          id: '4',
          learner_name: 'Lucas Petit',
          learner_id: 'learner_4',
          offer_title: 'Designer UX/UI',
          offer_id: 'offer_4',
          ai_score: 91,
          matched_skills: ['Figma', 'Adobe XD', 'Prototyping', 'User Research', 'Wireframing'],
          missing_skills: ['After Effects'],
          distance: 12,
          location: 'Paris',
          experience_level: 'senior',
          status: 'reviewed',
          applied_at: '2024-01-12T16:45:00Z',
          is_premium: true,
          cv_generated: 'CV créatif pour designer...',
          cover_letter_generated: 'Portfolio et motivation...'
        }
      ];

      const mockAnalytics: MatchingAnalytics = {
        totalApplications: mockApplications.length,
        averageScore: Math.round(mockApplications.reduce((sum, app) => sum + app.ai_score, 0) / mockApplications.length),
        conversionRate: 15.2,
        interviewsScheduled: mockApplications.filter(app => app.status === 'interview').length,
        hiredCount: mockApplications.filter(app => app.status === 'hired').length,
        applicationsByOffer: [
          { offer_title: 'Développeur Frontend React', count: 8, avg_score: 78 },
          { offer_title: 'Développeur FullStack', count: 12, avg_score: 82 },
          { offer_title: 'DevOps Engineer', count: 5, avg_score: 65 },
          { offer_title: 'Designer UX/UI', count: 6, avg_score: 89 }
        ]
      };

      setApplications(mockApplications);
      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...applications];

    // Apply filters
    if (filters.minScore) {
      filtered = filtered.filter(app => app.ai_score >= parseInt(filters.minScore));
    }
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(app => app.status === filters.status);
    }
    if (filters.premiumOnly) {
      filtered = filtered.filter(app => app.is_premium);
    }
    if (filters.searchTerm) {
      filtered = filtered.filter(app => 
        app.learner_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        app.offer_title.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.ai_score - a.ai_score;
        case 'date':
          return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
        case 'distance':
          return a.distance - b.distance;
        case 'skills':
          return b.matched_skills.length - a.matched_skills.length;
        default:
          return 0;
      }
    });

    setFilteredApplications(filtered);
  };

  const handleUpdateStatus = async (applicationId: string, newStatus: string) => {
    try {
      // En production, appel API pour mettre à jour le statut
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId ? { ...app, status: newStatus as any } : app
        )
      );
      
      if (selectedCandidate?.id === applicationId) {
        setSelectedCandidate(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-green-500 text-white';
    if (score >= 40) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'submitted': return 'Envoyé';
      case 'reviewed': return 'Examiné';
      case 'interview': return 'Entretien';
      case 'hired': return 'Embauché';
      case 'rejected': return 'Refusé';
      default: return 'En attente';
    }
  };

  const renderAnalytics = () => (
    <div className="grid md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6 text-center">
          <Users className="h-8 w-8 text-[--color-careerboost-blue] mx-auto mb-2" />
          <div className="text-2xl mb-1">{analytics?.totalApplications || 0}</div>
          <div className="text-sm text-gray-600">Candidatures totales</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 text-center">
          <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <div className="text-2xl mb-1">{analytics?.averageScore || 0}</div>
          <div className="text-sm text-gray-600">Score IA moyen</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 text-center">
          <TrendingUp className="h-8 w-8 text-[--color-careerboost-green] mx-auto mb-2" />
          <div className="text-2xl mb-1">{analytics?.conversionRate || 0}%</div>
          <div className="text-sm text-gray-600">Taux de conversion</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6 text-center">
          <Award className="h-8 w-8 text-purple-500 mx-auto mb-2" />
          <div className="text-2xl mb-1">{analytics?.hiredCount || 0}</div>
          <div className="text-sm text-gray-600">Embauches</div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFilters = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filtres et Tri
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-5 gap-4">
          <div>
            <Input
              placeholder="Rechercher..."
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              className="w-full"
            />
          </div>
          <div>
            <Input
              type="number"
              placeholder="Score min"
              value={filters.minScore}
              onChange={(e) => setFilters({ ...filters, minScore: e.target.value })}
            />
          </div>
          <div>
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="submitted">Envoyé</SelectItem>
                <SelectItem value="reviewed">Examiné</SelectItem>
                <SelectItem value="interview">Entretien</SelectItem>
                <SelectItem value="hired">Embauché</SelectItem>
                <SelectItem value="rejected">Refusé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Score IA</SelectItem>
                <SelectItem value="date">Date candidature</SelectItem>
                <SelectItem value="distance">Distance</SelectItem>
                <SelectItem value="skills">Compétences</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="premium"
              checked={filters.premiumOnly}
              onChange={(e) => setFilters({ ...filters, premiumOnly: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="premium" className="text-sm flex items-center">
              <Crown className="h-4 w-4 text-yellow-500 mr-1" />
              Premium
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderApplicationsList = () => (
    <div className="space-y-4">
      {filteredApplications.map((application) => (
        <Card key={application.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-4 flex-1">
                <div className="w-12 h-12 bg-[--color-careerboost-blue] rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">{application.learner_name.charAt(0)}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium">{application.learner_name}</h3>
                    {application.is_premium && (
                      <Badge className="bg-yellow-500 hover:bg-yellow-600 text-xs">
                        <Crown className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{application.offer_title}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {application.location} ({application.distance}km)
                    </span>
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(application.applied_at).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="text-green-600">
                      +{application.matched_skills.length} compétences
                    </span>
                    {application.missing_skills.length > 0 && (
                      <span className="text-orange-600">
                        -{application.missing_skills.length} compétences: {application.missing_skills.slice(0, 2).join(', ')}
                        {application.missing_skills.length > 2 && '...'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <Badge className={getScoreColor(application.ai_score)}>
                    <Brain className="h-3 w-3 mr-1" />
                    {application.ai_score}
                  </Badge>
                  <div className="text-xs text-gray-500 mt-1">Score IA</div>
                </div>
                <Badge className={getStatusColor(application.status)}>
                  {getStatusLabel(application.status)}
                </Badge>
              </div>
            </div>

            <div className="flex justify-end items-center space-x-2 mt-4 pt-4 border-t">
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedCandidate(application)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Voir profil
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <div className="w-10 h-10 bg-[--color-careerboost-blue] rounded-full flex items-center justify-center mr-3">
                        <span className="text-white">{application.learner_name.charAt(0)}</span>
                      </div>
                      Profil de {application.learner_name}
                    </DialogTitle>
                  </DialogHeader>
                  {selectedCandidate && renderCandidateProfile(selectedCandidate)}
                </DialogContent>
              </Dialog>
              
              <Button
                size="sm"
                className="bg-[--color-careerboost-green] hover:bg-green-700"
                onClick={() => handleUpdateStatus(application.id, 'interview')}
                disabled={application.status === 'interview' || application.status === 'hired' || application.status === 'rejected'}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Entretien
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-600"
                onClick={() => handleUpdateStatus(application.id, 'rejected')}
                disabled={application.status === 'rejected' || application.status === 'hired'}
              >
                <UserX className="h-4 w-4 mr-2" />
                Refuser
              </Button>
              
              {application.status === 'interview' && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleUpdateStatus(application.id, 'hired')}
                >
                  <Award className="h-4 w-4 mr-2" />
                  Recruter
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderCandidateProfile = (candidate: CandidateApplication) => (
    <div className="space-y-6">
      {/* Matching IA Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2 text-[--color-careerboost-blue]" />
            Analyse IA - Score {candidate.ai_score}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium mb-2 text-green-600">Compétences Matchées</h4>
              <div className="flex flex-wrap gap-1">
                {candidate.matched_skills.map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-xs border-green-500 text-green-700">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-orange-600">Compétences Manquantes</h4>
              <div className="flex flex-wrap gap-1">
                {candidate.missing_skills.map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-xs border-orange-500 text-orange-700">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Localisation</h4>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-1" />
                {candidate.location} ({candidate.distance}km)
              </div>
            </div>
          </div>
          
          {/* Score Visualization */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-4">Évaluation détaillée</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Compétences techniques</span>
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-gray-200 rounded-full mr-2">
                    <div 
                      className="h-2 bg-green-500 rounded-full" 
                      style={{ width: `${(candidate.matched_skills.length / (candidate.matched_skills.length + candidate.missing_skills.length)) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {Math.round((candidate.matched_skills.length / (candidate.matched_skills.length + candidate.missing_skills.length)) * 100)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Expérience niveau</span>
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-gray-200 rounded-full mr-2">
                    <div 
                      className="h-2 bg-blue-500 rounded-full" 
                      style={{ width: candidate.experience_level === 'senior' ? '100%' : candidate.experience_level === 'medior' ? '70%' : '40%' }}
                    />
                  </div>
                  <span className="text-sm font-medium">{candidate.experience_level}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Proximité géographique</span>
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-gray-200 rounded-full mr-2">
                    <div 
                      className="h-2 bg-purple-500 rounded-full" 
                      style={{ width: `${Math.max(20, 100 - candidate.distance * 2)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{candidate.distance}km</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CV et LM IA */}
      <Tabs defaultValue="cv">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cv">CV Généré IA</TabsTrigger>
          <TabsTrigger value="lm">Lettre de Motivation IA</TabsTrigger>
        </TabsList>
        <TabsContent value="cv">
          <Card>
            <CardHeader>
              <CardTitle>CV Optimisé par IA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">{candidate.cv_generated}</p>
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="lm">
          <Card>
            <CardHeader>
              <CardTitle>Lettre de Motivation Personnalisée</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">{candidate.cover_letter_generated}</p>
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderOfferAnalytics = () => (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart className="h-5 w-5 mr-2" />
          Rapports par Offre
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analytics?.applicationsByOffer.map((offer, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium">{offer.offer_title}</h4>
                <p className="text-sm text-gray-600">{offer.count} candidatures reçues</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-medium">Score moyen: {offer.avg_score}</div>
                <Badge className={getScoreColor(offer.avg_score)}>
                  <Target className="h-3 w-3 mr-1" />
                  {offer.avg_score >= 70 ? 'Excellent' : offer.avg_score >= 40 ? 'Bon' : 'Faible'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-[--color-careerboost-blue] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement du matching...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl flex items-center">
          <Brain className="h-6 w-6 mr-2 text-[--color-careerboost-blue]" />
          Gestion du Matching IA
        </h2>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exporter rapport
        </Button>
      </div>

      {renderAnalytics()}
      {renderFilters()}
      
      <Card>
        <CardHeader>
          <CardTitle>
            Liste des Candidatures ({filteredApplications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredApplications.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>Aucune candidature trouvée avec les filtres actuels.</p>
            </div>
          ) : (
            renderApplicationsList()
          )}
        </CardContent>
      </Card>

      {renderOfferAnalytics()}
    </div>
  );
}