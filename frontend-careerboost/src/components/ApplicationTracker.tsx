import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Progress } from './ui/progress';
import { useApi } from '../hooks/useAuth';
import { 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  MapPin,
  Building2,
  Calendar,
  MessageSquare,
  Mail,
  Phone,
  FileText,
  Download,
  Edit,
  Plus,
  Filter,
  TrendingUp,
  Target,
  Award,
  Send,
  Eye,
  Bell,
  RefreshCw,
  User
} from 'lucide-react';

interface Application {
  id: string;
  job_title: string;
  company: string;
  company_logo?: string;
  location: string;
  applied_date: string;
  status: 'submitted' | 'reviewed' | 'interview_scheduled' | 'interview_completed' | 'offer_received' | 'rejected' | 'hired';
  ai_score: number;
  next_step?: string;
  notes: ApplicationNote[];
  timeline: ApplicationEvent[];
  contact_person?: {
    name: string;
    email: string;
    phone?: string;
  };
  interview_date?: string;
  salary_offered?: string;
  response_expected?: string;
}

interface ApplicationNote {
  id: string;
  content: string;
  created_at: string;
  type: 'personal' | 'reminder' | 'interview_prep';
}

interface ApplicationEvent {
  id: string;
  type: 'applied' | 'viewed' | 'interview_request' | 'interview_completed' | 'offer' | 'rejection' | 'hired';
  date: string;
  description: string;
  automated: boolean;
}

export function ApplicationTracker() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'personal' | 'reminder' | 'interview_prep'>('personal');
  
  const { apiCall } = useApi();

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/learner/applications');
      setApplications(response.applications || []);
    } catch (error) {
      console.warn('Applications loading failed (expected in demo mode):', error);
      // Use mock data for demonstration
      const mockApplications: Application[] = [
        {
          id: '1',
          job_title: 'Développeur Frontend React',
          company: 'TechCorp',
          location: 'Paris',
          applied_date: '2024-01-15',
          status: 'interview_scheduled',
          ai_score: 92,
          next_step: 'Entretien technique prévu le 25 janvier',
          interview_date: '2024-01-25T14:00:00Z',
          contact_person: {
            name: 'Marie Dubois',
            email: 'marie.dubois@techcorp.com',
            phone: '+33 1 23 45 67 89'
          },
          notes: [
            {
              id: '1',
              content: 'Préparer les questions sur React Hooks et la gestion d\'état',
              created_at: '2024-01-16T10:00:00Z',
              type: 'interview_prep'
            },
            {
              id: '2',
              content: 'Entreprise spécialisée dans la fintech, 150 employés',
              created_at: '2024-01-15T15:30:00Z',
              type: 'personal'
            }
          ],
          timeline: [
            {
              id: '1',
              type: 'applied',
              date: '2024-01-15T09:00:00Z',
              description: 'Candidature envoyée via CareerBoost',
              automated: false
            },
            {
              id: '2',
              type: 'viewed',
              date: '2024-01-16T14:30:00Z',
              description: 'Candidature consultée par le recruteur',
              automated: true
            },
            {
              id: '3',
              type: 'interview_request',
              date: '2024-01-17T11:15:00Z',
              description: 'Invitation à un entretien reçue',
              automated: true
            }
          ]
        },
        {
          id: '2',
          job_title: 'Développeur FullStack',
          company: 'StartupInc',
          location: 'Lyon',
          applied_date: '2024-01-10',
          status: 'reviewed',
          ai_score: 78,
          next_step: 'En attente de retour (relance recommandée dans 3 jours)',
          response_expected: '2024-01-22',
          contact_person: {
            name: 'Thomas Martin',
            email: 't.martin@startupinc.fr'
          },
          notes: [
            {
              id: '3',
              content: 'Startup en série A, très bonne ambiance d\'équipe',
              created_at: '2024-01-10T16:00:00Z',
              type: 'personal'
            }
          ],
          timeline: [
            {
              id: '4',
              type: 'applied',
              date: '2024-01-10T10:00:00Z',
              description: 'Candidature envoyée',
              automated: false
            },
            {
              id: '5',
              type: 'viewed',
              date: '2024-01-12T09:30:00Z',
              description: 'Candidature consultée',
              automated: true
            }
          ]
        },
        {
          id: '3',
          job_title: 'Stage Développement Web',
          company: 'WebAgency',
          location: 'Paris',
          applied_date: '2024-01-08',
          status: 'offer_received',
          ai_score: 85,
          salary_offered: '600€/mois + tickets restaurant',
          next_step: 'Répondre à l\'offre avant le 20 janvier',
          response_expected: '2024-01-20',
          contact_person: {
            name: 'Sophie Bernard',
            email: 'recrutement@webagency.com'
          },
          notes: [],
          timeline: [
            {
              id: '6',
              type: 'applied',
              date: '2024-01-08T14:00:00Z',
              description: 'Candidature envoyée',
              automated: false
            },
            {
              id: '7',
              type: 'interview_request',
              date: '2024-01-09T10:00:00Z',
              description: 'Invitation entretien',
              automated: true
            },
            {
              id: '8',
              type: 'interview_completed',
              date: '2024-01-11T15:00:00Z',
              description: 'Entretien réalisé',
              automated: false
            },
            {
              id: '9',
              type: 'offer',
              date: '2024-01-13T16:30:00Z',
              description: 'Offre de stage reçue',
              automated: true
            }
          ]
        }
      ];
      
      setApplications(mockApplications);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      await apiCall(`/applications/${applicationId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      
      // Update local state
      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId ? { ...app, status: newStatus as any } : app
        )
      );
      
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
    } catch (error) {
      console.warn('Status update failed (expected in demo mode):', error);
      // Update local state in demo mode
      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId ? { ...app, status: newStatus as any } : app
        )
      );
      
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
    }
  };

  const addNote = async () => {
    if (!selectedApplication || !newNote.trim()) return;
    
    try {
      const noteData = {
        application_id: selectedApplication.id,
        content: newNote,
        type: noteType
      };
      
      await apiCall('/applications/notes', {
        method: 'POST',
        body: JSON.stringify(noteData)
      });
      
      // Add note locally
      const note: ApplicationNote = {
        id: Date.now().toString(),
        content: newNote,
        created_at: new Date().toISOString(),
        type: noteType
      };
      
      setSelectedApplication(prev => prev ? {
        ...prev,
        notes: [...prev.notes, note]
      } : null);
      
      // Update in applications list
      setApplications(prev =>
        prev.map(app =>
          app.id === selectedApplication.id
            ? { ...app, notes: [...app.notes, note] }
            : app
        )
      );
      
      setNewNote('');
      setShowAddNote(false);
    } catch (error) {
      console.warn('Note saving failed (expected in demo mode):', error);
      // Add note locally in demo mode
      const note: ApplicationNote = {
        id: Date.now().toString(),
        content: newNote,
        created_at: new Date().toISOString(),
        type: noteType
      };
      
      setSelectedApplication(prev => prev ? {
        ...prev,
        notes: [...prev.notes, note]
      } : null);
      
      // Update in applications list
      setApplications(prev =>
        prev.map(app =>
          app.id === selectedApplication.id
            ? { ...app, notes: [...app.notes, note] }
            : app
        )
      );
      
      setNewNote('');
      setShowAddNote(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'reviewed': return 'bg-purple-100 text-purple-800';
      case 'interview_scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'interview_completed': return 'bg-orange-100 text-orange-800';
      case 'offer_received': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'hired': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'submitted': return 'Envoyée';
      case 'reviewed': return 'En cours d\'examen';
      case 'interview_scheduled': return 'Entretien programmé';
      case 'interview_completed': return 'Entretien réalisé';
      case 'offer_received': return 'Offre reçue';
      case 'rejected': return 'Refusée';
      case 'hired': return 'Embauchée';
      default: return 'En attente';
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'submitted': return 20;
      case 'reviewed': return 40;
      case 'interview_scheduled': return 60;
      case 'interview_completed': return 80;
      case 'offer_received': return 90;
      case 'hired': return 100;
      case 'rejected': return 0;
      default: return 10;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'applied': return <Send className="h-4 w-4 text-blue-600" />;
      case 'viewed': return <Eye className="h-4 w-4 text-purple-600" />;
      case 'interview_request': return <Calendar className="h-4 w-4 text-yellow-600" />;
      case 'interview_completed': return <CheckCircle className="h-4 w-4 text-orange-600" />;
      case 'offer': return <Award className="h-4 w-4 text-green-600" />;
      case 'rejection': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'hired': return <Target className="h-4 w-4 text-emerald-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.applied_date).getTime() - new Date(a.applied_date).getTime();
      case 'score':
        return b.ai_score - a.ai_score;
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  const renderApplicationCard = (app: Application) => (
    <Card key={app.id} className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-medium">{app.job_title}</h3>
              {app.status === 'offer_received' && (
                <Badge className="bg-green-500 text-white animate-pulse">
                  <Award className="h-3 w-3 mr-1" />
                  Offre
                </Badge>
              )}
            </div>
            <p className="text-gray-600 mb-1">{app.company}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
              <span className="flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {app.location}
              </span>
              <span className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(app.applied_date).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
          
          <div className="text-right space-y-2">
            <Badge className="bg-blue-100 text-blue-700">
              <Star className="h-3 w-3 mr-1" />
              {app.ai_score}%
            </Badge>
            <Badge className={getStatusColor(app.status)}>
              {getStatusLabel(app.status)}
            </Badge>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progression</span>
            <span>{getStatusProgress(app.status)}%</span>
          </div>
          <Progress value={getStatusProgress(app.status)} className="h-2" />
        </div>
        
        {/* Next Step */}
        {app.next_step && (
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <p className="text-sm text-blue-800 font-medium">Prochaine étape:</p>
            <p className="text-sm text-blue-700">{app.next_step}</p>
          </div>
        )}
        
        {/* Quick Actions */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            {app.notes.length > 0 && (
              <Badge variant="outline" className="text-xs">
                <MessageSquare className="h-3 w-3 mr-1" />
                {app.notes.length} notes
              </Badge>
            )}
            {app.response_expected && (
              <Badge variant="outline" className="text-xs text-orange-600">
                <Clock className="h-3 w-3 mr-1" />
                Réponse attendue
              </Badge>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedApplication(app)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Détails
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderApplicationDetails = () => (
    selectedApplication && (
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            {selectedApplication.job_title} - {selectedApplication.company}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Badge className={getStatusColor(selectedApplication.status)} className="mb-2">
                  {getStatusLabel(selectedApplication.status)}
                </Badge>
                <div className="text-sm text-gray-600">Statut actuel</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-lg font-semibold text-blue-600 mb-1">{selectedApplication.ai_score}%</div>
                <div className="text-sm text-gray-600">Score IA</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-lg font-semibold text-gray-800 mb-1">
                  {Math.floor((Date.now() - new Date(selectedApplication.applied_date).getTime()) / (1000 * 60 * 60 * 24))}j
                </div>
                <div className="text-sm text-gray-600">Depuis candidature</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Contact & Interview Info */}
          {(selectedApplication.contact_person || selectedApplication.interview_date || selectedApplication.salary_offered) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations importantes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedApplication.contact_person && (
                  <div>
                    <h4 className="font-medium mb-2">Contact recruteur</h4>
                    <div className="space-y-1 text-sm">
                      <p className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        {selectedApplication.contact_person.name}
                      </p>
                      <p className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        {selectedApplication.contact_person.email}
                      </p>
                      {selectedApplication.contact_person.phone && (
                        <p className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-500" />
                          {selectedApplication.contact_person.phone}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {selectedApplication.interview_date && (
                  <div>
                    <h4 className="font-medium mb-2">Entretien programmé</h4>
                    <p className="text-sm flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-green-500" />
                      {new Date(selectedApplication.interview_date).toLocaleString('fr-FR')}
                    </p>
                  </div>
                )}
                
                {selectedApplication.salary_offered && (
                  <div>
                    <h4 className="font-medium mb-2">Offre salariale</h4>
                    <p className="text-sm flex items-center">
                      <Award className="h-4 w-4 mr-2 text-green-500" />
                      {selectedApplication.salary_offered}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline des événements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedApplication.timeline.map((event, index) => (
                  <div key={event.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{event.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {event.automated && (
                          <span className="ml-2 text-blue-500">(automatique)</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Notes */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Mes notes ({selectedApplication.notes.length})</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddNote(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedApplication.notes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucune note pour le moment</p>
              ) : (
                <div className="space-y-3">
                  {selectedApplication.notes.map((note) => (
                    <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <Badge variant="outline" className="text-xs">
                          {note.type === 'personal' && '📝 Personnel'}
                          {note.type === 'reminder' && '🔔 Rappel'}
                          {note.type === 'interview_prep' && '💼 Préparation'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(note.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Status Update */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mettre à jour le statut</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Select
                  value={selectedApplication.status}
                  onValueChange={(value) => updateApplicationStatus(selectedApplication.id, value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submitted">Envoyée</SelectItem>
                    <SelectItem value="reviewed">En cours d'examen</SelectItem>
                    <SelectItem value="interview_scheduled">Entretien programmé</SelectItem>
                    <SelectItem value="interview_completed">Entretien réalisé</SelectItem>
                    <SelectItem value="offer_received">Offre reçue</SelectItem>
                    <SelectItem value="rejected">Refusée</SelectItem>
                    <SelectItem value="hired">Embauchée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    )
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl flex items-center">
          <TrendingUp className="h-6 w-6 mr-2 text-[--color-careerboost-blue]" />
          Suivi de mes candidatures ({applications.length})
        </h2>
        <Button
          variant="outline"
          onClick={loadApplications}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {applications.filter(app => app.status === 'interview_scheduled' || app.status === 'interview_completed').length}
            </div>
            <div className="text-sm text-gray-600">Entretiens</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {applications.filter(app => app.status === 'offer_received').length}
            </div>
            <div className="text-sm text-gray-600">Offres reçues</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {applications.length > 0 ? Math.round(applications.reduce((sum, app) => sum + app.ai_score, 0) / applications.length) : 0}%
            </div>
            <div className="text-sm text-gray-600">Score IA moyen</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {applications.length > 0 ? Math.round((applications.filter(app => app.status === 'offer_received' || app.status === 'hired').length / applications.length) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">Taux de succès</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les candidatures</SelectItem>
                <SelectItem value="submitted">Envoyées</SelectItem>
                <SelectItem value="reviewed">En cours d'examen</SelectItem>
                <SelectItem value="interview_scheduled">Entretiens programmés</SelectItem>
                <SelectItem value="offer_received">Offres reçues</SelectItem>
                <SelectItem value="rejected">Refusées</SelectItem>
                <SelectItem value="hired">Embauchées</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Trier par date</SelectItem>
                <SelectItem value="score">Trier par score IA</SelectItem>
                <SelectItem value="status">Trier par statut</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-[--color-careerboost-blue] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des candidatures...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              {filter === 'all' 
                ? 'Aucune candidature pour le moment.' 
                : 'Aucune candidature avec ce statut.'}
            </p>
            {filter !== 'all' && (
              <Button variant="outline" onClick={() => setFilter('all')}>
                Voir toutes les candidatures
              </Button>
            )}
          </div>
        ) : (
          filteredApplications.map(renderApplicationCard)
        )}
      </div>

      {/* Application Details Dialog */}
      <Dialog open={selectedApplication !== null} onOpenChange={() => setSelectedApplication(null)}>
        {renderApplicationDetails()}
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={showAddNote} onOpenChange={setShowAddNote}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Type de note</label>
              <Select value={noteType} onValueChange={(value: any) => setNoteType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">📝 Note personnelle</SelectItem>
                  <SelectItem value="reminder">🔔 Rappel</SelectItem>
                  <SelectItem value="interview_prep">💼 Préparation entretien</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm mb-2">Contenu</label>
              <Textarea
                placeholder="Votre note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddNote(false)}>
                Annuler
              </Button>
              <Button onClick={addNote} disabled={!newNote.trim()}>
                Ajouter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}