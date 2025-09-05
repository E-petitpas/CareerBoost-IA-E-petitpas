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
  Search,
  Filter,
  MapPin,
  Clock,
  Star,
  Heart,
  Share2,
  Flag,
  ExternalLink,
  Zap,
  Building2,
  Calendar,
  DollarSign,
  Wifi,
  Users,
  Briefcase,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  TrendingUp,
  Award,
  Crown,
  Eye,
  Send
} from 'lucide-react';

interface JobOffer {
  id: string;
  title: string;
  company: string;
  location: string;
  distance: number;
  type: string;
  salary?: string;
  remote: boolean;
  description: string;
  requirements: string[];
  benefits: string[];
  skills_required: string[];
  skills_optional: string[];
  experience_level: string;
  posted_date: string;
  source: string;
  source_url?: string;
  ai_score: number;
  ai_explanation: string;
  matched_skills: string[];
  missing_skills: string[];
  is_premium?: boolean;
  applications_count?: number;
}

interface JobFilters {
  search: string;
  location: string;
  distance: number;
  contractTypes: string[];
  salaryMin: string;
  salaryMax: string;
  remoteWork: boolean;
  minScore: number;
  sortBy: string;
}

interface JobFeedProps {
  userProfile: any;
}

export function JobFeed({ userProfile }: JobFeedProps) {
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobOffer[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteLists, setFavoriteLists] = useState<Array<{ id: string; name: string; jobs: string[] }>>([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobOffer | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [parsedJobText, setParsedJobText] = useState('');
  const [showParseDialog, setShowParseDialog] = useState(false);
  
  const [filters, setFilters] = useState<JobFilters>({
    search: '',
    location: userProfile?.location || '',
    distance: userProfile?.mobility_radius || 25,
    contractTypes: [],
    salaryMin: '',
    salaryMax: '',
    remoteWork: false,
    minScore: 0,
    sortBy: 'ai_score'
  });

  const { apiCall } = useApi();

  useEffect(() => {
    loadJobs();
    loadFavorites();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jobs, filters]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/jobs/feed', {
        method: 'POST',
        body: JSON.stringify({
          profile: userProfile,
          preferences: filters
        })
      });
      
      setJobs(response.jobs || []);
    } catch (error) {
      console.warn('Jobs loading failed (expected in demo mode):', error);
      // Mock data for demonstration
      const mockJobs: JobOffer[] = [
        {
          id: '1',
          title: 'Développeur Frontend React',
          company: 'TechCorp',
          location: 'Paris',
          distance: 5,
          type: 'CDI',
          salary: '45-55k€',
          remote: true,
          description: 'Rejoignez notre équipe pour développer des applications web modernes...',
          requirements: ['React', 'TypeScript', '3+ ans expérience'],
          benefits: ['Télétravail', 'Tickets restaurant', 'Mutuelle'],
          skills_required: ['React', 'JavaScript', 'CSS'],
          skills_optional: ['TypeScript', 'Node.js'],
          experience_level: 'medior',
          posted_date: '2024-01-15',
          source: 'CareerBoost',
          ai_score: 92,
          ai_explanation: 'Excellent match ! Vos compétences React et JavaScript correspondent parfaitement. Le poste est dans votre zone de mobilité.',
          matched_skills: ['React', 'JavaScript', 'CSS'],
          missing_skills: ['TypeScript'],
          is_premium: true,
          applications_count: 23
        },
        {
          id: '2',
          title: 'Développeur FullStack',
          company: 'StartupInc',
          location: 'Lyon',
          distance: 15,
          type: 'CDI',
          salary: '40-50k€',
          remote: false,
          description: 'Startup en pleine croissance recherche un développeur polyvalent...',
          requirements: ['JavaScript', 'Node.js', 'MongoDB'],
          benefits: ['BSPCE', 'Flextime', 'Formation'],
          skills_required: ['JavaScript', 'Node.js'],
          skills_optional: ['React', 'MongoDB'],
          experience_level: 'junior',
          posted_date: '2024-01-14',
          source: 'Indeed',
          source_url: 'https://indeed.fr/job123',
          ai_score: 78,
          ai_explanation: 'Bon potentiel de match. Vos compétences JavaScript sont valorisées. Nécessite apprentissage de Node.js.',
          matched_skills: ['JavaScript'],
          missing_skills: ['Node.js', 'MongoDB'],
          applications_count: 45
        },
        {
          id: '3',
          title: 'Stage Développement Web',
          company: 'WebAgency',
          location: 'Paris',
          distance: 8,
          type: 'Stage',
          remote: true,
          description: 'Stage de 6 mois dans une agence web dynamique...',
          requirements: ['HTML', 'CSS', 'JavaScript'],
          benefits: ['Mentorat', 'Projet concret', 'Possible embauche'],
          skills_required: ['HTML', 'CSS'],
          skills_optional: ['JavaScript', 'React'],
          experience_level: 'junior',
          posted_date: '2024-01-13',
          source: 'WelcomeToTheJungle',
          ai_score: 85,
          ai_explanation: 'Parfait pour débuter ! Vos compétences de base correspondent et l\'entreprise forme.',
          matched_skills: ['HTML', 'CSS', 'JavaScript'],
          missing_skills: [],
          applications_count: 12
        }
      ];
      
      setJobs(mockJobs);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const response = await apiCall('/jobs/favorites');
      setFavorites(response.favorites || []);
      setFavoriteLists(response.lists || []);
    } catch (error) {
      console.warn('Favorites loading failed (expected in demo mode):', error);
      // Use localStorage in demo mode
      try {
        const storedFavorites = localStorage.getItem('jobFavorites');
        if (storedFavorites) {
          setFavorites(JSON.parse(storedFavorites));
        }
      } catch (localError) {
        console.warn('Local favorites loading failed:', localError);
      }
    }
  };

  const applyFilters = () => {
    let filtered = [...jobs];

    // Text search
    if (filters.search) {
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        job.company.toLowerCase().includes(filters.search.toLowerCase()) ||
        job.skills_required.some(skill => skill.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    // Location and distance
    if (filters.distance < 100) {
      filtered = filtered.filter(job => job.distance <= filters.distance);
    }

    // Contract types
    if (filters.contractTypes.length > 0) {
      filtered = filtered.filter(job => filters.contractTypes.includes(job.type.toLowerCase()));
    }

    // Remote work
    if (filters.remoteWork) {
      filtered = filtered.filter(job => job.remote);
    }

    // AI Score
    if (filters.minScore > 0) {
      filtered = filtered.filter(job => job.ai_score >= filters.minScore);
    }

    // Salary
    if (filters.salaryMin) {
      // Simple salary filtering (would need more sophisticated parsing in real app)
      filtered = filtered.filter(job => {
        if (!job.salary) return false;
        const minSalary = parseInt(job.salary.split('-')[0]);
        return minSalary >= parseInt(filters.salaryMin);
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'ai_score':
          return b.ai_score - a.ai_score;
        case 'date':
          return new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime();
        case 'distance':
          return a.distance - b.distance;
        case 'salary':
          const aSalary = a.salary ? parseInt(a.salary.split('-')[0]) : 0;
          const bSalary = b.salary ? parseInt(b.salary.split('-')[0]) : 0;
          return bSalary - aSalary;
        default:
          return 0;
      }
    });

    setFilteredJobs(filtered);
  };

  const toggleFavorite = async (jobId: string) => {
    try {
      if (favorites.includes(jobId)) {
        await apiCall(`/jobs/${jobId}/favorite`, { method: 'DELETE' });
        setFavorites(prev => prev.filter(id => id !== jobId));
      } else {
        await apiCall(`/jobs/${jobId}/favorite`, { method: 'POST' });
        setFavorites(prev => [...prev, jobId]);
      }
    } catch (error) {
      console.warn('Favorite toggle failed (expected in demo mode):', error);
      // Update local state and localStorage in demo mode
      const newFavorites = favorites.includes(jobId) 
        ? favorites.filter(id => id !== jobId)
        : [...favorites, jobId];
      
      setFavorites(newFavorites);
      
      try {
        localStorage.setItem('jobFavorites', JSON.stringify(newFavorites));
      } catch (localError) {
        console.warn('Local favorites saving failed:', localError);
      }
    }
  };

  const parseJobOffer = async () => {
    if (!parsedJobText.trim()) return;
    
    setLoading(true);
    try {
      const response = await apiCall('/jobs/parse', {
        method: 'POST',
        body: JSON.stringify({
          text: parsedJobText,
          profile: userProfile
        })
      });
      
      if (response.job) {
        setSelectedJob(response.job);
        setShowParseDialog(false);
        setParsedJobText('');
      }
    } catch (error) {
      console.warn('Job parsing failed (expected in demo mode):', error);
      alert('Mode démo : fonctionnalité de parsing non disponible sans backend');
      setShowParseDialog(false);
      setParsedJobText('');
    } finally {
      setLoading(false);
    }
  };

  const applyToJob = async (job: JobOffer) => {
    try {
      await apiCall('/applications/quick-apply', {
        method: 'POST',
        body: JSON.stringify({
          job_id: job.id,
          customization: {
            message: `Candidature pour ${job.title} chez ${job.company}`
          }
        })
      });
      
      alert('Candidature envoyée avec succès !');
    } catch (error) {
      console.warn('Job application failed (expected in demo mode):', error);
      alert('Mode démo : candidature simulée avec succès !');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const renderFilters = () => (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtres de recherche
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            {showFilters ? 'Masquer' : 'Afficher'}
          </Button>
        </div>
      </CardHeader>
      {showFilters && (
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-2">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Poste, entreprise, compétence..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm mb-2">Localisation</label>
              <Input
                placeholder="Ville, région..."
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm mb-2">Distance: {filters.distance} km</label>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.distance}
                onChange={(e) => setFilters(prev => ({ ...prev, distance: parseInt(e.target.value) }))}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm mb-2">Type de contrat</label>
              <Select 
                value={filters.contractTypes.join(',')} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, contractTypes: value ? value.split(',') : [] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
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
              <label className="block text-sm mb-2">Score IA min: {filters.minScore}</label>
              <input
                type="range"
                min="0"
                max="100"
                value={filters.minScore}
                onChange={(e) => setFilters(prev => ({ ...prev, minScore: parseInt(e.target.value) }))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm mb-2">Trier par</label>
              <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai_score">Score IA</SelectItem>
                  <SelectItem value="date">Date de publication</SelectItem>
                  <SelectItem value="distance">Distance</SelectItem>
                  <SelectItem value="salary">Salaire</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.remoteWork}
                  onChange={(e) => setFilters(prev => ({ ...prev, remoteWork: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Télétravail</span>
              </label>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );

  const renderJobCard = (job: JobOffer) => (
    <Card key={job.id} className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-medium">{job.title}</h3>
              {job.is_premium && (
                <Badge className="bg-yellow-500 text-white">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
            <p className="text-gray-600 mb-2">{job.company}</p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
              <span className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {job.location} ({job.distance}km)
              </span>
              <span className="flex items-center">
                <Briefcase className="h-4 w-4 mr-1" />
                {job.type}
              </span>
              {job.salary && (
                <span className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {job.salary}
                </span>
              )}
              {job.remote && (
                <span className="flex items-center">
                  <Wifi className="h-4 w-4 mr-1" />
                  Remote
                </span>
              )}
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {new Date(job.posted_date).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
          
          <div className="text-right space-y-2">
            <Badge className={`${getScoreColor(job.ai_score)} font-semibold`}>
              <Star className="h-3 w-3 mr-1" />
              {job.ai_score}%
            </Badge>
            <div className="text-xs text-gray-500">
              {job.applications_count} candidatures
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-700 mb-2">{job.ai_explanation}</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {job.matched_skills.map((skill, index) => (
              <Badge key={index} variant="outline" className="text-xs border-green-500 text-green-700">
                {skill}
              </Badge>
            ))}
            {job.missing_skills.length > 0 && (
              <>
                {job.missing_skills.slice(0, 2).map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-xs border-orange-500 text-orange-700">
                    -{skill}
                  </Badge>
                ))}
                {job.missing_skills.length > 2 && (
                  <Badge variant="outline" className="text-xs text-gray-500">
                    +{job.missing_skills.length - 2} autres
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(job.id);
              }}
              className={favorites.includes(job.id) ? 'text-red-600' : ''}
            >
              <Heart className={`h-4 w-4 mr-1 ${favorites.includes(job.id) ? 'fill-current' : ''}`} />
              {favorites.includes(job.id) ? 'Retiré' : 'Sauvegarder'}
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedJob(job);
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Détails
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
          
          <Button
            onClick={(e) => {
              e.stopPropagation();
              applyToJob(job);
            }}
            className="bg-[--color-careerboost-blue] hover:bg-blue-700"
            size="sm"
          >
            <Zap className="h-4 w-4 mr-1" />
            Candidater en 1 clic
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderJobDetails = () => (
    selectedJob && (
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            {selectedJob.title} - {selectedJob.company}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header with key info */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg">
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div>
                <Badge className={`${getScoreColor(selectedJob.ai_score)} font-semibold text-lg px-3 py-1`}>
                  <Star className="h-4 w-4 mr-1" />
                  {selectedJob.ai_score}%
                </Badge>
                <p className="text-sm text-gray-600 mt-1">Score IA</p>
              </div>
              <div className="text-center">
                <div className="font-semibold">{selectedJob.location}</div>
                <p className="text-sm text-gray-600">{selectedJob.distance} km de chez vous</p>
              </div>
              <div className="text-center">
                <div className="font-semibold">{selectedJob.type}</div>
                {selectedJob.salary && (
                  <p className="text-sm text-gray-600">{selectedJob.salary}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* AI Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analyse IA</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{selectedJob.ai_explanation}</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-green-600 mb-2">Compétences matchées</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedJob.matched_skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="border-green-500 text-green-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-orange-600 mb-2">Compétences à acquérir</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedJob.missing_skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="border-orange-500 text-orange-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Job Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Description du poste</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-line">{selectedJob.description}</p>
            </CardContent>
          </Card>
          
          {/* Requirements and Benefits */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prérequis</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {selectedJob.requirements.map((req, index) => (
                    <li key={index} className="flex items-center">
                      <ChevronRight className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm">{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Avantages</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {selectedJob.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center">
                      <Award className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          
          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex space-x-2">
              {selectedJob.source_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={selectedJob.source_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Source: {selectedJob.source}
                  </a>
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Partager
              </Button>
              <Button variant="outline" size="sm">
                <Flag className="h-4 w-4 mr-2" />
                Signaler
              </Button>
            </div>
            
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => toggleFavorite(selectedJob.id)}
                className={favorites.includes(selectedJob.id) ? 'text-red-600' : ''}
              >
                <Heart className={`h-4 w-4 mr-2 ${favorites.includes(selectedJob.id) ? 'fill-current' : ''}`} />
                {favorites.includes(selectedJob.id) ? 'Retiré des favoris' : 'Ajouter aux favoris'}
              </Button>
              <Button
                onClick={() => applyToJob(selectedJob)}
                className="bg-[--color-careerboost-green] hover:bg-green-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Candidater maintenant
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    )
  );

  const renderParseDialog = () => (
    <Dialog open={showParseDialog} onOpenChange={setShowParseDialog}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-[--color-careerboost-blue] text-[--color-careerboost-blue]">
          <Search className="h-4 w-4 mr-2" />
          Évaluer une offre externe
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Évaluer une offre externe
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Collez le lien de l'offre ou le texte de l'annonce</label>
            <Textarea
              placeholder="https://exemple.com/offre ou collez directement le texte de l'annonce..."
              rows={6}
              value={parsedJobText}
              onChange={(e) => setParsedJobText(e.target.value)}
            />
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Comment ça marche ?</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Collez le lien ou le texte d'une offre d'emploi</li>
              <li>• Notre IA analyse l'offre et calcule votre score de compatibilité</li>
              <li>• Vous obtenez une évaluation immédiate avec les compétences matchées</li>
              <li>• Possibilité de candidater si les informations de contact sont présentes</li>
            </ul>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowParseDialog(false)}>
              Annuler
            </Button>
            <Button 
              onClick={parseJobOffer}
              disabled={!parsedJobText.trim() || loading}
              className="bg-[--color-careerboost-blue] hover:bg-blue-700"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Analyse...
                </div>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyser
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl flex items-center">
          <TrendingUp className="h-6 w-6 mr-2 text-[--color-careerboost-blue]" />
          Offres pour vous ({filteredJobs.length})
        </h2>
        <div className="flex space-x-2">
          {renderParseDialog()}
          <Button
            variant="outline"
            onClick={loadJobs}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {renderFilters()}
      
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-[--color-careerboost-blue] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des offres personnalisées...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Aucune offre trouvée avec ces critères.</p>
            <Button
              onClick={() => setFilters(prev => ({ ...prev, search: '', minScore: 0, contractTypes: [] }))}
              variant="outline"
            >
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          filteredJobs.map(renderJobCard)
        )}
      </div>

      {/* Job Details Dialog */}
      <Dialog open={selectedJob !== null} onOpenChange={() => setSelectedJob(null)}>
        {renderJobDetails()}
      </Dialog>
    </div>
  );
}