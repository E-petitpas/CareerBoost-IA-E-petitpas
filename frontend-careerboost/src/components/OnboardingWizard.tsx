import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { useAuth, useApi } from '../hooks/useAuth';
import { 
  User, 
  GraduationCap, 
  Briefcase, 
  Code, 
  MapPin, 
  DollarSign,
  Globe,
  ChevronRight,
  ChevronLeft,
  Save,
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Plus,
  X,
  Linkedin
} from 'lucide-react';

interface OnboardingData {
  // Identité
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  
  // Titre visé
  targetTitle: string;
  targetSector: string;
  
  // Formation
  educations: Array<{
    id: string;
    school: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    current: boolean;
  }>;
  
  // Expériences
  experiences: Array<{
    id: string;
    company: string;
    position: string;
    description: string;
    startDate: string;
    endDate: string;
    current: boolean;
  }>;
  
  // Compétences
  skills: string[];
  
  // Localisation
  location: string;
  mobilityRadius: number;
  
  // Préférences
  contractTypes: string[];
  remoteWork: boolean;
  partTime: boolean;
  apprenticeship: boolean;
  
  // Langues
  languages: Array<{
    language: string;
    level: string;
  }>;
  
  // Salaire
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
  onClose: () => void;
}

export function OnboardingWizard({ onComplete, onClose }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    targetTitle: '',
    targetSector: '',
    educations: [],
    experiences: [],
    skills: [],
    location: '',
    mobilityRadius: 20,
    contractTypes: [],
    remoteWork: false,
    partTime: false,
    apprenticeship: false,
    languages: [],
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'EUR'
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedProgress, setSavedProgress] = useState(false);
  const { user } = useAuth();
  const { apiCall } = useApi();

  const totalSteps = 8;
  const progress = (currentStep / totalSteps) * 100;

  // Auto-save progress
  useEffect(() => {
    const timer = setTimeout(() => {
      saveProgress();
    }, 5000);
    return () => clearTimeout(timer);
  }, [data]);

  const saveProgress = async () => {
    try {
      await apiCall('/profile/onboarding/save', {
        method: 'POST',
        body: JSON.stringify({ step: currentStep, data })
      });
      setSavedProgress(true);
      setTimeout(() => setSavedProgress(false), 2000);
    } catch (error) {
      console.warn('Progress saving failed (expected in demo mode):', error);
      // In demo mode, save to localStorage instead
      try {
        localStorage.setItem('onboardingProgress', JSON.stringify({ step: currentStep, data }));
        setSavedProgress(true);
        setTimeout(() => setSavedProgress(false), 2000);
      } catch (localError) {
        console.warn('Local storage save failed:', localError);
      }
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 1:
        if (!data.firstName.trim()) newErrors.firstName = 'Prénom requis';
        if (!data.lastName.trim()) newErrors.lastName = 'Nom requis';
        if (!data.email.trim()) newErrors.email = 'Email requis';
        break;
      case 2:
        if (!data.targetTitle.trim()) newErrors.targetTitle = 'Titre visé requis';
        break;
      case 5:
        if (data.skills.length === 0) newErrors.skills = 'Au moins une compétence requise';
        break;
      case 6:
        if (!data.location.trim()) newErrors.location = 'Localisation requise';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const addEducation = () => {
    const newEducation = {
      id: Date.now().toString(),
      school: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      current: false
    };
    setData(prev => ({ ...prev, educations: [...prev.educations, newEducation] }));
  };

  const updateEducation = (id: string, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      educations: prev.educations.map(edu => 
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (id: string) => {
    setData(prev => ({
      ...prev,
      educations: prev.educations.filter(edu => edu.id !== id)
    }));
  };

  const addExperience = () => {
    const newExperience = {
      id: Date.now().toString(),
      company: '',
      position: '',
      description: '',
      startDate: '',
      endDate: '',
      current: false
    };
    setData(prev => ({ ...prev, experiences: [...prev.experiences, newExperience] }));
  };

  const updateExperience = (id: string, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      experiences: prev.experiences.map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeExperience = (id: string) => {
    setData(prev => ({
      ...prev,
      experiences: prev.experiences.filter(exp => exp.id !== id)
    }));
  };

  const addSkill = (skill: string) => {
    if (skill.trim() && !data.skills.includes(skill.trim())) {
      setData(prev => ({ ...prev, skills: [...prev.skills, skill.trim()] }));
    }
  };

  const removeSkill = (skill: string) => {
    setData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const handleComplete = async () => {
    if (validateStep(currentStep)) {
      setLoading(true);
      try {
        await onComplete(data);
      } catch (error) {
        console.error('Error completing onboarding:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <User className="h-12 w-12 text-[--color-careerboost-blue] mx-auto mb-4" />
        <h2 className="text-xl mb-2">Informations personnelles</h2>
        <p className="text-gray-600">Commençons par vos informations de base</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-2">Prénom *</label>
          <Input
            placeholder="Votre prénom"
            value={data.firstName}
            onChange={(e) => setData(prev => ({ ...prev, firstName: e.target.value }))}
            className={errors.firstName ? 'border-red-500' : ''}
          />
          {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
        </div>
        
        <div>
          <label className="block text-sm mb-2">Nom *</label>
          <Input
            placeholder="Votre nom"
            value={data.lastName}
            onChange={(e) => setData(prev => ({ ...prev, lastName: e.target.value }))}
            className={errors.lastName ? 'border-red-500' : ''}
          />
          {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
        </div>
        
        <div>
          <label className="block text-sm mb-2">Email *</label>
          <Input
            type="email"
            placeholder="votre@email.com"
            value={data.email}
            onChange={(e) => setData(prev => ({ ...prev, email: e.target.value }))}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>
        
        <div>
          <label className="block text-sm mb-2">Téléphone</label>
          <Input
            placeholder="+33 6 12 34 56 78"
            value={data.phone}
            onChange={(e) => setData(prev => ({ ...prev, phone: e.target.value }))}
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm mb-2">Date de naissance</label>
          <Input
            type="date"
            value={data.birthDate}
            onChange={(e) => setData(prev => ({ ...prev, birthDate: e.target.value }))}
          />
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center mb-2">
          <Linkedin className="h-5 w-5 text-blue-600 mr-2" />
          <span className="font-medium">Import LinkedIn (Bientôt disponible)</span>
        </div>
        <p className="text-sm text-gray-600">
          Importez automatiquement vos informations depuis votre profil LinkedIn pour gagner du temps.
        </p>
        <Button variant="outline" className="mt-2" disabled>
          <Linkedin className="h-4 w-4 mr-2" />
          Connecter LinkedIn
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Briefcase className="h-12 w-12 text-[--color-careerboost-blue] mx-auto mb-4" />
        <h2 className="text-xl mb-2">Objectif professionnel</h2>
        <p className="text-gray-600">Quel poste recherchez-vous ?</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-2">Titre du poste visé *</label>
          <Input
            placeholder="Ex: Développeur Frontend, Designer UX/UI..."
            value={data.targetTitle}
            onChange={(e) => setData(prev => ({ ...prev, targetTitle: e.target.value }))}
            className={errors.targetTitle ? 'border-red-500' : ''}
          />
          {errors.targetTitle && <p className="text-red-500 text-sm mt-1">{errors.targetTitle}</p>}
        </div>
        
        <div>
          <label className="block text-sm mb-2">Secteur d'activité</label>
          <Select value={data.targetSector} onValueChange={(value) => setData(prev => ({ ...prev, targetSector: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Choisissez un secteur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tech">Tech / Informatique</SelectItem>
              <SelectItem value="design">Design / Créatif</SelectItem>
              <SelectItem value="marketing">Marketing / Communication</SelectItem>
              <SelectItem value="sales">Commerce / Vente</SelectItem>
              <SelectItem value="finance">Finance / Comptabilité</SelectItem>
              <SelectItem value="hr">Ressources Humaines</SelectItem>
              <SelectItem value="education">Éducation / Formation</SelectItem>
              <SelectItem value="health">Santé / Social</SelectItem>
              <SelectItem value="other">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <GraduationCap className="h-12 w-12 text-[--color-careerboost-blue] mx-auto mb-4" />
        <h2 className="text-xl mb-2">Formation</h2>
        <p className="text-gray-600">Ajoutez vos diplômes et formations</p>
      </div>
      
      <div className="space-y-4">
        {data.educations.map((education) => (
          <Card key={education.id} className="p-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2">École/Université</label>
                <Input
                  placeholder="Nom de l'établissement"
                  value={education.school}
                  onChange={(e) => updateEducation(education.id, 'school', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Diplôme</label>
                <Input
                  placeholder="Ex: Master, Licence, BTS..."
                  value={education.degree}
                  onChange={(e) => updateEducation(education.id, 'degree', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Domaine d'étude</label>
                <Input
                  placeholder="Ex: Informatique, Marketing..."
                  value={education.field}
                  onChange={(e) => updateEducation(education.id, 'field', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Date de début</label>
                <Input
                  type="date"
                  value={education.startDate}
                  onChange={(e) => updateEducation(education.id, 'startDate', e.target.value)}
                />
              </div>
              <div>
                <label className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    checked={education.current}
                    onChange={(e) => updateEducation(education.id, 'current', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Formation en cours</span>
                </label>
                {!education.current && (
                  <Input
                    type="date"
                    value={education.endDate}
                    onChange={(e) => updateEducation(education.id, 'endDate', e.target.value)}
                  />
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeEducation(education.id)}
                  className="text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        
        <Button
          variant="outline"
          onClick={addEducation}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une formation
        </Button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Briefcase className="h-12 w-12 text-[--color-careerboost-blue] mx-auto mb-4" />
        <h2 className="text-xl mb-2">Expériences professionnelles</h2>
        <p className="text-gray-600">Vos stages, emplois et expériences</p>
      </div>
      
      <div className="space-y-4">
        {data.experiences.map((experience) => (
          <Card key={experience.id} className="p-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2">Entreprise</label>
                <Input
                  placeholder="Nom de l'entreprise"
                  value={experience.company}
                  onChange={(e) => updateExperience(experience.id, 'company', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Poste occupé</label>
                <Input
                  placeholder="Titre du poste"
                  value={experience.position}
                  onChange={(e) => updateExperience(experience.id, 'position', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-2">Description des missions</label>
                <Textarea
                  placeholder="Décrivez vos principales missions et réalisations..."
                  rows={3}
                  value={experience.description}
                  onChange={(e) => updateExperience(experience.id, 'description', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Date de début</label>
                <Input
                  type="date"
                  value={experience.startDate}
                  onChange={(e) => updateExperience(experience.id, 'startDate', e.target.value)}
                />
              </div>
              <div>
                <label className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    checked={experience.current}
                    onChange={(e) => updateExperience(experience.id, 'current', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Poste actuel</span>
                </label>
                {!experience.current && (
                  <Input
                    type="date"
                    value={experience.endDate}
                    onChange={(e) => updateExperience(experience.id, 'endDate', e.target.value)}
                  />
                )}
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeExperience(experience.id)}
                  className="text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        
        <Button
          variant="outline"
          onClick={addExperience}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une expérience
        </Button>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Upload className="h-5 w-5 text-gray-600 mr-2" />
            <span className="font-medium">Import CV (Bientôt disponible)</span>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Uploadez votre CV existant pour pré-remplir automatiquement vos expériences et compétences.
          </p>
          <Button variant="outline" disabled>
            <FileText className="h-4 w-4 mr-2" />
            Importer un CV
          </Button>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => {
    const [newSkill, setNewSkill] = useState('');
    
    const handleAddSkill = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addSkill(newSkill);
        setNewSkill('');
      }
    };
    
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <Code className="h-12 w-12 text-[--color-careerboost-blue] mx-auto mb-4" />
          <h2 className="text-xl mb-2">Compétences</h2>
          <p className="text-gray-600">Ajoutez vos compétences techniques et transversales</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Ajouter une compétence *</label>
            <div className="flex space-x-2">
              <Input
                placeholder="Ex: JavaScript, Gestion de projet, Communication..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={handleAddSkill}
                className={errors.skills ? 'border-red-500' : ''}
              />
              <Button
                onClick={() => {
                  addSkill(newSkill);
                  setNewSkill('');
                }}
                disabled={!newSkill.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {errors.skills && <p className="text-red-500 text-sm mt-1">{errors.skills}</p>}
          </div>
          
          {data.skills.length > 0 && (
            <div>
              <label className="block text-sm mb-3">Vos compétences ({data.skills.length})</label>
              <div className="flex flex-wrap gap-2">
                {data.skills.map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {skill}
                    <button
                      onClick={() => removeSkill(skill)}
                      className="ml-2 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-medium text-green-800">Suggestions IA</span>
            </div>
            <p className="text-sm text-green-700 mb-3">
              Voici quelques compétences populaires dans votre domaine :
            </p>
            <div className="flex flex-wrap gap-2">
              {['React', 'TypeScript', 'Node.js', 'CSS', 'Git'].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => addSkill(suggestion)}
                  disabled={data.skills.includes(suggestion)}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStep6 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <MapPin className="h-12 w-12 text-[--color-careerboost-blue] mx-auto mb-4" />
        <h2 className="text-xl mb-2">Localisation et mobilité</h2>
        <p className="text-gray-600">Où souhaitez-vous travailler ?</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-2">Ville/Région *</label>
          <Input
            placeholder="Ex: Paris, Lyon, Marseille..."
            value={data.location}
            onChange={(e) => setData(prev => ({ ...prev, location: e.target.value }))}
            className={errors.location ? 'border-red-500' : ''}
          />
          {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
        </div>
        
        <div>
          <label className="block text-sm mb-2">Rayon de mobilité: {data.mobilityRadius} km</label>
          <input
            type="range"
            min="0"
            max="100"
            value={data.mobilityRadius}
            onChange={(e) => setData(prev => ({ ...prev, mobilityRadius: parseInt(e.target.value) }))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Local (0 km)</span>
            <span>National (100+ km)</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep7 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Briefcase className="h-12 w-12 text-[--color-careerboost-blue] mx-auto mb-4" />
        <h2 className="text-xl mb-2">Préférences de travail</h2>
        <p className="text-gray-600">Précisez vos attentes professionnelles</p>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm mb-3">Types de contrat recherchés</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'cdi', label: 'CDI' },
              { value: 'cdd', label: 'CDD' },
              { value: 'stage', label: 'Stage' },
              { value: 'apprenticeship', label: 'Alternance' },
              { value: 'freelance', label: 'Freelance' },
              { value: 'internship', label: 'Interim' }
            ].map(({ value, label }) => (
              <label key={value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={data.contractTypes.includes(value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setData(prev => ({ ...prev, contractTypes: [...prev.contractTypes, value] }));
                    } else {
                      setData(prev => ({ ...prev, contractTypes: prev.contractTypes.filter(t => t !== value) }));
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={data.remoteWork}
              onChange={(e) => setData(prev => ({ ...prev, remoteWork: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm">Télétravail accepté</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={data.partTime}
              onChange={(e) => setData(prev => ({ ...prev, partTime: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm">Temps partiel accepté</span>
          </label>
        </div>
        
        <Separator />
        
        <div>
          <label className="block text-sm mb-3">Langues parlées</label>
          <div className="space-y-2">
            {data.languages.map((lang, index) => (
              <div key={index} className="flex space-x-2">
                <Select
                  value={lang.language}
                  onValueChange={(value) => {
                    const newLanguages = [...data.languages];
                    newLanguages[index].language = value;
                    setData(prev => ({ ...prev, languages: newLanguages }));
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Langue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="french">Français</SelectItem>
                    <SelectItem value="english">Anglais</SelectItem>
                    <SelectItem value="spanish">Espagnol</SelectItem>
                    <SelectItem value="german">Allemand</SelectItem>
                    <SelectItem value="italian">Italien</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={lang.level}
                  onValueChange={(value) => {
                    const newLanguages = [...data.languages];
                    newLanguages[index].level = value;
                    setData(prev => ({ ...prev, languages: newLanguages }));
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="native">Natif</SelectItem>
                    <SelectItem value="fluent">Courant</SelectItem>
                    <SelectItem value="intermediate">Intermédiaire</SelectItem>
                    <SelectItem value="beginner">Débutant</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newLanguages = data.languages.filter((_, i) => i !== index);
                    setData(prev => ({ ...prev, languages: newLanguages }));
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => {
                setData(prev => ({
                  ...prev,
                  languages: [...prev.languages, { language: '', level: '' }]
                }));
              }}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une langue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep8 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <DollarSign className="h-12 w-12 text-[--color-careerboost-blue] mx-auto mb-4" />
        <h2 className="text-xl mb-2">Prétentions salariales</h2>
        <p className="text-gray-600">Optionnel - Ces informations resteront confidentielles</p>
      </div>
      
      <div className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-2">Salaire minimum souhaité</label>
            <Input
              placeholder="Ex: 35000"
              value={data.salaryMin}
              onChange={(e) => setData(prev => ({ ...prev, salaryMin: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Salaire maximum souhaité</label>
            <Input
              placeholder="Ex: 45000"
              value={data.salaryMax}
              onChange={(e) => setData(prev => ({ ...prev, salaryMax: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Devise</label>
            <Select value={data.salaryCurrency} onValueChange={(value) => setData(prev => ({ ...prev, salaryCurrency: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <AlertTriangle className="h-5 w-5 text-blue-600 mr-2" />
            <span className="font-medium text-blue-800">Information</span>
          </div>
          <p className="text-sm text-blue-700">
            Ces informations sont optionnelles et ne seront partagées qu'avec votre accord explicite. 
            Elles nous aident à vous proposer des offres adaptées à vos attentes.
          </p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-medium text-green-800 mb-2">Récapitulatif de votre profil</h3>
          <div className="space-y-1 text-sm text-green-700">
            <p><strong>Objectif :</strong> {data.targetTitle || 'Non renseigné'}</p>
            <p><strong>Localisation :</strong> {data.location} ({data.mobilityRadius}km)</p>
            <p><strong>Compétences :</strong> {data.skills.length} compétences ajoutées</p>
            <p><strong>Formations :</strong> {data.educations.length} formation(s)</p>
            <p><strong>Expériences :</strong> {data.experiences.length} expérience(s)</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      case 7: return renderStep7();
      case 8: return renderStep8();
      default: return renderStep1();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[--color-careerboost-blue] to-[--color-careerboost-green] text-white">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">Configuration de votre profil</CardTitle>
              <p className="text-blue-100 mt-1">Étape {currentStep} sur {totalSteps}</p>
            </div>
            {savedProgress && (
              <div className="flex items-center text-green-200">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">Sauvegardé</span>
              </div>
            )}
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        
        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {renderCurrentStep()}
        </CardContent>
        
        <div className="border-t bg-gray-50 p-4">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Précédent
            </Button>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={saveProgress}
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
              
              {currentStep < totalSteps ? (
                <Button
                  onClick={nextStep}
                  className="bg-[--color-careerboost-blue] hover:bg-blue-700"
                >
                  Suivant
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={loading}
                  className="bg-[--color-careerboost-green] hover:bg-green-700"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Finalisation...
                    </div>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Terminer
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}