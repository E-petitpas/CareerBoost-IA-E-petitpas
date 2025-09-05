import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useApi } from '../hooks/useAuth';
import { 
  FileText, 
  Download, 
  Edit,
  Save,
  Sparkles,
  Clock,
  Eye,
  RefreshCw,
  History,
  Trash,
  Copy,
  Settings,
  Award,
  Briefcase,
  GraduationCap,
  Mail
} from 'lucide-react';

interface DocumentVersion {
  id: string;
  type: 'cv' | 'cover_letter';
  title: string;
  content: string;
  style: string;
  created_at: string;
  job_title?: string;
  company?: string;
}

interface GenerationOptions {
  style: string;
  jobTitle?: string;
  company?: string;
  jobDescription?: string;
  tone: string;
  length: string;
  highlights: string[];
}

interface AIDocumentGeneratorProps {
  userProfile: any;
  targetJob?: {
    title: string;
    company: string;
    description: string;
  };
}

export function AIDocumentGenerator({ userProfile, targetJob }: AIDocumentGeneratorProps) {
  const [activeTab, setActiveTab] = useState<'cv' | 'cover_letter'>('cv');
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [currentDocument, setCurrentDocument] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const [generationOptions, setGenerationOptions] = useState<GenerationOptions>({
    style: 'modern',
    jobTitle: targetJob?.title || '',
    company: targetJob?.company || '',
    jobDescription: targetJob?.description || '',
    tone: 'professional',
    length: 'medium',
    highlights: []
  });

  const { apiCall } = useApi();

  // Function to generate mock document for demo
  const generateMockDocument = () => {
    if (activeTab === 'cv') {
      return `${userProfile?.firstName || 'Thomas'} ${userProfile?.lastName || 'Martin'}
Développeur ${generationOptions.jobTitle || 'Frontend React'}

📧 ${userProfile?.email || 'thomas.martin@email.com'}
📱 ${userProfile?.phone || '+33 6 12 34 56 78'}
📍 ${userProfile?.location || 'Paris, France'}

🎯 PROFIL PROFESSIONNEL
Développeur passionné avec une expertise en React et JavaScript, à la recherche de nouveaux défis techniques dans une équipe dynamique.

💼 EXPÉRIENCE PROFESSIONNELLE
Développeur Frontend - Stage
WebAgency • 2023 - 2024
• Développement d'interfaces utilisateur modernes avec React
• Intégration d'APIs REST et optimisation des performances
• Collaboration en équipe Agile sur des projets client

🎓 FORMATION
Master Informatique - Développement Web
Université Paris Diderot • 2022 - 2024

Licence Informatique
Université Paris Diderot • 2019 - 2022

🚀 COMPÉTENCES TECHNIQUES
• Langages: JavaScript, TypeScript, HTML5, CSS3
• Frameworks: React, Vue.js, Node.js
• Outils: Git, Webpack, Sass, Figma
• Bases de données: MongoDB, PostgreSQL

🌟 PROJETS NOTABLES
• Plateforme e-commerce avec React et Stripe
• Application de gestion de tâches en équipe
• Portfolio personnel responsive

🗣️ LANGUES
• Français: Natif
• Anglais: Courant (TOEIC 850)
• Espagnol: Intermédiaire

🎨 CENTRES D'INTÉRÊT
• Développement open source
• Veille technologique
• Photographie numérique`;
    } else {
      return `Objet: Candidature pour le poste de ${generationOptions.jobTitle || 'Développeur Frontend'}

Madame, Monsieur,

Actuellement ${userProfile?.targetTitle || 'développeur junior'} et diplômé en informatique, je me permets de vous adresser ma candidature pour le poste de ${generationOptions.jobTitle || 'Développeur Frontend'} au sein de ${generationOptions.company || 'votre entreprise'}.

Votre offre a particulièrement retenu mon attention car elle correspond parfaitement à mon projet professionnel. Mes compétences en ${userProfile?.skills?.slice(0, 3).join(', ') || 'React, JavaScript, CSS'} ainsi que mon expérience en développement web me permettront de contribuer efficacement à vos projets.

Au cours de mes expériences précédentes, j'ai pu développer une expertise en:
• Développement d'interfaces utilisateur modernes et responsives
• Intégration d'APIs et optimisation des performances
• Collaboration en équipe et méthodologies Agiles
• Résolution de problèmes complexes et débogage

Je suis particulièrement motivé par l'opportunité de rejoindre ${generationOptions.company || 'votre équipe'} et de contribuer à des projets innovants. Ma passion pour le développement web et ma capacité d'adaptation me permettront de m'intégrer rapidement dans votre équipe.

Je reste à votre disposition pour un entretien au cours duquel nous pourrons échanger plus en détail sur ma motivation et mes compétences. Dans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

Cordialement,
${userProfile?.firstName || 'Thomas'} ${userProfile?.lastName || 'Martin'}`;
    }
  };

  useEffect(() => {
    loadVersions();
  }, [activeTab]);

  const loadVersions = async () => {
    try {
      const response = await apiCall(`/documents/${activeTab}/versions`);
      setVersions(response.versions || []);
      
      // Load the most recent version
      if (response.versions && response.versions.length > 0) {
        setCurrentDocument(response.versions[0].content);
      }
    } catch (error) {
      console.warn('Versions loading failed (expected in demo mode):', error);
      // Use localStorage for demo mode
      try {
        const storedVersions = localStorage.getItem(`documentVersions_${activeTab}`);
        if (storedVersions) {
          const versions = JSON.parse(storedVersions);
          setVersions(versions);
          if (versions.length > 0) {
            setCurrentDocument(versions[0].content);
          }
        }
      } catch (localError) {
        console.warn('Local versions loading failed:', localError);
      }
    }
  };

  const generateDocument = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/documents/generate', {
        method: 'POST',
        body: JSON.stringify({
          type: activeTab,
          profile: userProfile,
          options: generationOptions
        })
      });
      
      setCurrentDocument(response.content);
      await loadVersions(); // Refresh versions list
      
    } catch (error) {
      console.warn('Document generation failed (expected in demo mode):', error);
      // Generate mock document for demo
      const mockContent = generateMockDocument();
      setCurrentDocument(mockContent);
      
      // Save to localStorage
      const newVersion: DocumentVersion = {
        id: Date.now().toString(),
        type: activeTab,
        title: `${activeTab === 'cv' ? 'CV' : 'Lettre'} - ${generationOptions.style}`,
        content: mockContent,
        style: generationOptions.style,
        created_at: new Date().toISOString(),
        job_title: generationOptions.jobTitle,
        company: generationOptions.company
      };
      
      try {
        const existingVersions = JSON.parse(localStorage.getItem(`documentVersions_${activeTab}`) || '[]');
        const updatedVersions = [newVersion, ...existingVersions];
        localStorage.setItem(`documentVersions_${activeTab}`, JSON.stringify(updatedVersions));
        setVersions(updatedVersions);
      } catch (localError) {
        console.warn('Local version saving failed:', localError);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveDocument = async () => {
    setLoading(true);
    try {
      await apiCall('/documents/save', {
        method: 'POST',
        body: JSON.stringify({
          type: activeTab,
          content: isEditing ? editedContent : currentDocument,
          options: generationOptions
        })
      });
      
      if (isEditing) {
        setCurrentDocument(editedContent);
        setIsEditing(false);
      }
      
      await loadVersions();
    } catch (error) {
      console.warn('Document saving failed (expected in demo mode):', error);
      // Save to localStorage in demo mode
      if (isEditing) {
        setCurrentDocument(editedContent);
        setIsEditing(false);
        
        const newVersion: DocumentVersion = {
          id: Date.now().toString(),
          type: activeTab,
          title: `${activeTab === 'cv' ? 'CV' : 'Lettre'} - Édité`,
          content: editedContent,
          style: generationOptions.style,
          created_at: new Date().toISOString(),
          job_title: generationOptions.jobTitle,
          company: generationOptions.company
        };
        
        try {
          const existingVersions = JSON.parse(localStorage.getItem(`documentVersions_${activeTab}`) || '[]');
          const updatedVersions = [newVersion, ...existingVersions];
          localStorage.setItem(`documentVersions_${activeTab}`, JSON.stringify(updatedVersions));
          setVersions(updatedVersions);
        } catch (localError) {
          console.warn('Local version saving failed:', localError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async (versionId?: string) => {
    try {
      const response = await apiCall(`/documents/export/pdf`, {
        method: 'POST',
        body: JSON.stringify({
          type: activeTab,
          versionId: versionId,
          content: versionId ? null : currentDocument
        })
      });
      
      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.warn('PDF export failed (expected in demo mode):', error);
      alert('Mode démo : fonctionnalité d\'export PDF non disponible sans backend');
    }
  };

  const deleteVersion = async (versionId: string) => {
    try {
      await apiCall(`/documents/versions/${versionId}`, {
        method: 'DELETE'
      });
      await loadVersions();
    } catch (error) {
      console.warn('Version deletion failed (expected in demo mode):', error);
      // Delete from localStorage in demo mode
      try {
        const existingVersions = JSON.parse(localStorage.getItem(`documentVersions_${activeTab}`) || '[]');
        const updatedVersions = existingVersions.filter((v: DocumentVersion) => v.id !== versionId);
        localStorage.setItem(`documentVersions_${activeTab}`, JSON.stringify(updatedVersions));
        setVersions(updatedVersions);
      } catch (localError) {
        console.warn('Local version deletion failed:', localError);
      }
    }
  };

  const loadVersion = (version: DocumentVersion) => {
    setCurrentDocument(version.content);
    setGenerationOptions(prev => ({
      ...prev,
      style: version.style,
      jobTitle: version.job_title || '',
      company: version.company || ''
    }));
    setShowHistory(false);
  };

  const cvStyles = [
    { value: 'modern', label: 'Moderne', description: 'Design épuré et contemporain' },
    { value: 'academic', label: 'Académique', description: 'Format traditionnel pour la recherche' },
    { value: 'creative', label: 'Créatif', description: 'Design original pour les métiers créatifs' },
    { value: 'tech', label: 'Tech', description: 'Optimisé pour les développeurs' },
    { value: 'executive', label: 'Exécutif', description: 'Pour les postes de direction' },
    { value: 'junior', label: 'Junior', description: 'Parfait pour les débutants' }
  ];

  const coverLetterStyles = [
    { value: 'formal', label: 'Formel', description: 'Ton professionnel et structuré' },
    { value: 'enthusiastic', label: 'Enthousiaste', description: 'Montre votre motivation' },
    { value: 'personal', label: 'Personnel', description: 'Approche plus humaine' },
    { value: 'direct', label: 'Direct', description: 'Concis et efficace' },
    { value: 'storytelling', label: 'Narratif', description: 'Raconte votre parcours' }
  ];

  const renderGenerationOptions = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Options de génération
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-2">Style du document</label>
            <Select value={generationOptions.style} onValueChange={(value) => setGenerationOptions(prev => ({ ...prev, style: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(activeTab === 'cv' ? cvStyles : coverLetterStyles).map(style => (
                  <SelectItem key={style.value} value={style.value}>
                    <div>
                      <div className="font-medium">{style.label}</div>
                      <div className="text-xs text-gray-500">{style.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm mb-2">Longueur</label>
            <Select value={generationOptions.length} onValueChange={(value) => setGenerationOptions(prev => ({ ...prev, length: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Court (1 page)</SelectItem>
                <SelectItem value="medium">Moyen (1-2 pages)</SelectItem>
                <SelectItem value="long">Détaillé (2+ pages)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {activeTab === 'cover_letter' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2">Poste visé</label>
              <Input
                placeholder="Ex: Développeur Frontend"
                value={generationOptions.jobTitle}
                onChange={(e) => setGenerationOptions(prev => ({ ...prev, jobTitle: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Entreprise</label>
              <Input
                placeholder="Nom de l'entreprise"
                value={generationOptions.company}
                onChange={(e) => setGenerationOptions(prev => ({ ...prev, company: e.target.value }))}
              />
            </div>
          </div>
        )}
        
        <div>
          <label className="block text-sm mb-2">Ton du document</label>
          <Select value={generationOptions.tone} onValueChange={(value) => setGenerationOptions(prev => ({ ...prev, tone: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professionnel</SelectItem>
              <SelectItem value="friendly">Amical</SelectItem>
              <SelectItem value="confident">Confiant</SelectItem>
              <SelectItem value="humble">Humble</SelectItem>
              <SelectItem value="dynamic">Dynamique</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {targetJob && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Briefcase className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-800">Optimisation pour le poste</span>
            </div>
            <p className="text-sm text-blue-700">
              <strong>{targetJob.title}</strong> chez {targetJob.company}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Le document sera automatiquement optimisé pour ce poste spécifique.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderDocument = () => (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            {activeTab === 'cv' ? (
              <FileText className="h-5 w-5 mr-2" />
            ) : (
              <Mail className="h-5 w-5 mr-2" />
            )}
            {activeTab === 'cv' ? 'CV généré par IA' : 'Lettre de motivation générée par IA'}
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(true)}
            >
              <History className="h-4 w-4 mr-2" />
              Historique ({versions.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditedContent(currentDocument);
                setIsEditing(!isEditing);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              {isEditing ? 'Annuler' : 'Modifier'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToPDF()}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={20}
              className="font-mono text-sm"
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Annuler
              </Button>
              <Button onClick={saveDocument} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white border rounded-lg p-6 min-h-[400px]">
            {currentDocument ? (
              <div className="whitespace-pre-wrap">{currentDocument}</div>
            ) : (
              <div className="text-center text-gray-500 py-20">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg mb-2">Aucun document généré</p>
                <p className="text-sm">
                  Configurez les options ci-dessus et cliquez sur "Générer" pour créer votre {activeTab === 'cv' ? 'CV' : 'lettre de motivation'}.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderHistoryDialog = () => (
    <Dialog open={showHistory} onOpenChange={setShowHistory}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <History className="h-5 w-5 mr-2" />
            Historique des versions
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {versions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune version sauvegardée</p>
            </div>
          ) : (
            versions.map((version) => (
              <Card key={version.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">{version.title || `${activeTab === 'cv' ? 'CV' : 'Lettre'} - ${version.style}`}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(version.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {version.style}
                        </Badge>
                        {version.job_title && (
                          <span className="text-xs">
                            Pour: {version.job_title}
                            {version.company && ` chez ${version.company}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadVersion(version)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Charger
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportToPDF(version.id)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteVersion(version.id)}
                        className="text-red-600"
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded p-3 max-h-32 overflow-hidden">
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {version.content.substring(0, 200)}...
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl flex items-center">
          <Sparkles className="h-6 w-6 mr-2 text-[--color-careerboost-blue]" />
          Générateur de documents IA
        </h2>
      </div>

      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cv" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            CV
          </TabsTrigger>
          <TabsTrigger value="cover_letter" className="flex items-center">
            <Mail className="h-4 w-4 mr-2" />
            Lettre de motivation
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="cv" className="mt-6">
          <div className="space-y-6">
            {renderGenerationOptions()}
            
            <div className="flex justify-center">
              <Button
                onClick={generateDocument}
                disabled={loading}
                className="bg-[--color-careerboost-blue] hover:bg-blue-700"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Génération en cours...
                  </div>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer mon CV
                  </>
                )}
              </Button>
            </div>
            
            {renderDocument()}
          </div>
        </TabsContent>
        
        <TabsContent value="cover_letter" className="mt-6">
          <div className="space-y-6">
            {renderGenerationOptions()}
            
            <div className="flex justify-center">
              <Button
                onClick={generateDocument}
                disabled={loading || !generationOptions.jobTitle}
                className="bg-[--color-careerboost-blue] hover:bg-blue-700"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Génération en cours...
                  </div>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Générer ma lettre
                  </>
                )}
              </Button>
            </div>
            
            {!generationOptions.jobTitle && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center text-yellow-800">
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">
                    Veuillez spécifier un poste visé pour générer une lettre de motivation personnalisée.
                  </span>
                </div>
              </div>
            )}
            
            {renderDocument()}
          </div>
        </TabsContent>
      </Tabs>

      {renderHistoryDialog()}
      
      {/* Statistics */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-semibold text-[--color-careerboost-blue] mb-1">
                {versions.filter(v => v.type === 'cv').length}
              </div>
              <div className="text-sm text-gray-600">CV générés</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-[--color-careerboost-green] mb-1">
                {versions.filter(v => v.type === 'cover_letter').length}
              </div>
              <div className="text-sm text-gray-600">Lettres générées</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-purple-600 mb-1">
                &lt;30s
              </div>
              <div className="text-sm text-gray-600">Temps moyen de génération</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}