import React, { useState, useEffect } from 'react';
import {
  UserCircleIcon,
  PencilIcon,
  PlusIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  CogIcon,
  StarIcon,
  DocumentTextIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import apiService from '../../services/api';
import { CandidateProfile as CandidateProfileType, Experience, CandidateSkill } from '../../types';
import { EducationSection, PreferencesSection } from './ProfileSections';
import DocumentsSection from './DocumentsSection';

const CandidateProfile: React.FC = () => {
  const [profile, setProfile] = useState<CandidateProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCandidateProfile();
      setProfile(response.profile);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', name: 'Informations générales', icon: UserCircleIcon },
    { id: 'skills', name: 'Compétences', icon: StarIcon },
    { id: 'experiences', name: 'Expériences', icon: BriefcaseIcon },
    { id: 'education', name: 'Formations', icon: AcademicCapIcon },
    { id: 'documents', name: 'CV & Lettres', icon: DocumentTextIcon },
    { id: 'preferences', name: 'Préférences', icon: CogIcon },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <div className="spinner w-8 h-8"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="alert-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Mon profil
          </h1>
          <div className="text-sm text-gray-500">
            Profil candidat
          </div>
        </div>

        {/* Navigation par onglets */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenu des onglets */}
        <div className="bg-white shadow rounded-lg">
          {activeTab === 'general' && <GeneralInfoSection profile={profile} onUpdate={loadProfile} />}
          {activeTab === 'skills' && <SkillsSection profile={profile} onUpdate={loadProfile} />}
          {activeTab === 'experiences' && <ExperiencesSection profile={profile} onUpdate={loadProfile} />}
          {activeTab === 'education' && <EducationSection profile={profile} onUpdate={loadProfile} />}
          {activeTab === 'documents' && <DocumentsSection profile={profile} onUpdate={loadProfile} />}
          {activeTab === 'preferences' && <PreferencesSection profile={profile} onUpdate={loadProfile} />}
        </div>
      </div>
    </div>
  );
};

// Composants pour chaque section
const GeneralInfoSection: React.FC<{ profile: CandidateProfileType | null; onUpdate: () => void }> = ({ profile, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: profile?.title || '',
    summary: profile?.summary || '',
    experience_years: profile?.experience_years || 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiService.updateCandidateProfile(formData);
      setEditing(false);
      onUpdate();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: profile?.title || '',
      summary: profile?.summary || '',
      experience_years: profile?.experience_years || 0,
    });
    setEditing(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Informations générales</h3>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="btn-secondary flex items-center"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Modifier
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-6">
          <div>
            <label className="form-label">Titre professionnel</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Développeur Full Stack, Chef de projet..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Résumé professionnel</label>
            <textarea
              className="form-textarea"
              rows={6}
              placeholder="Décrivez votre parcours, vos compétences clés et vos objectifs professionnels..."
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">Années d'expérience</label>
            <input
              type="number"
              min="0"
              max="50"
              step="0.5"
              className="form-input"
              value={formData.experience_years}
              onChange={(e) => setFormData({ ...formData, experience_years: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCancel}
              className="btn-secondary"
              disabled={saving}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="btn-primary"
              disabled={saving}
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Informations personnelles</h4>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Nom :</span>
                  <p className="text-sm font-medium">{profile?.users?.name || 'Non renseigné'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Email :</span>
                  <p className="text-sm font-medium">{profile?.users?.email || 'Non renseigné'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Ville :</span>
                  <p className="text-sm font-medium">{profile?.users?.city || 'Non renseignée'}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Profil professionnel</h4>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Titre :</span>
                  <p className="text-sm font-medium">{profile?.title || 'Non renseigné'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Expérience :</span>
                  <p className="text-sm font-medium">
                    {profile?.experience_years ? `${profile.experience_years} année${profile.experience_years > 1 ? 's' : ''}` : 'Non renseignée'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {profile?.summary && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Résumé professionnel</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{profile.summary}</p>
            </div>
          )}

          {!profile?.title && !profile?.summary && (
            <div className="text-center py-8 text-gray-500">
              <UserCircleIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Complétez votre profil pour améliorer vos chances d'être remarqué par les recruteurs.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SkillsSection: React.FC<{ profile: CandidateProfileType | null; onUpdate: () => void }> = ({ profile, onUpdate }) => {
  const [skills, setSkills] = useState<CandidateSkill[]>(profile?.candidate_skills || []);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [skillSuggestions, setSkillSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [newSkill, setNewSkill] = useState({
    skill_name: '',
    proficiency_level: 3
  });

  // Synchroniser l'état local avec les données du profil
  useEffect(() => {
    if (profile?.candidate_skills) {
      setSkills(profile.candidate_skills);
    }
  }, [profile?.candidate_skills]);

  const getProficiencyLabel = (level?: number) => {
    if (!level) return 'Non évalué';
    const labels = ['', 'Débutant', 'Intermédiaire', 'Confirmé', 'Expert', 'Maître'];
    return labels[level] || 'Non évalué';
  };

  const getProficiencyColor = (level?: number) => {
    if (!level) return 'bg-gray-100 text-gray-600';
    const colors = [
      '',
      'bg-red-100 text-red-700 border-red-200',
      'bg-orange-100 text-orange-700 border-orange-200',
      'bg-yellow-100 text-yellow-700 border-yellow-200',
      'bg-green-100 text-green-700 border-green-200',
      'bg-blue-100 text-blue-700 border-blue-200'
    ];
    return colors[level] || 'bg-gray-100 text-gray-600';
  };



  const handleSave = async () => {
    try {
      setSaving(true);
      const skillsData = skills.map(skill => ({
        skill_id: skill.skills.id,
        proficiency_level: skill.proficiency_level,
        last_used_on: skill.last_used_on
      }));
      await apiService.updateCandidateSkills(skillsData);
      setEditing(false);
      onUpdate();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleSearchSkills = async (query: string) => {
    if (query.trim().length < 2) {
      setSkillSuggestions([]);
      return;
    }

    try {
      setLoadingSuggestions(true);
      const response = await apiService.searchSkills(query, 10);
      setSkillSuggestions(response.skills || []);
    } catch (err: any) {
      console.error('Erreur recherche compétences:', err);
      setSkillSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSelectSuggestion = (suggestion: any) => {
    setNewSkill({
      ...newSkill,
      skill_name: suggestion.display_name
    });
    setSkillSuggestions([]);
  };

  const handleAddSkill = async () => {
    if (!newSkill.skill_name.trim()) {
      alert('Veuillez saisir le nom de la compétence');
      return;
    }

    try {
      setSaving(true);
      await apiService.addCandidateSkill(newSkill);
      setNewSkill({
        skill_name: '',
        proficiency_level: 3
      });
      setShowAddForm(false);
      setSkillSuggestions([]);
      onUpdate();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Erreur lors de l\'ajout de la compétence');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette compétence ?')) {
      return;
    }

    try {
      setSaving(true);
      await apiService.deleteCandidateSkill(skillId);
      onUpdate();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Compétences</h3>
        <div className="flex space-x-3">
          {editing && (
            <>
              <button
                onClick={() => setEditing(false)}
                className="btn-secondary"
                disabled={saving}
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="btn-primary"
                disabled={saving}
              >
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </>
          )}
          {!editing && skills.length > 0 && (
            <>
              <button
                onClick={() => {
                  setEditing(true);
                  setShowAddForm(true);
                }}
                className="btn-primary flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Ajouter
              </button>
              <button
                onClick={() => setEditing(true)}
                className="btn-secondary flex items-center"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Modifier
              </button>
            </>
          )}
        </div>
      </div>

      {skills.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <StarIcon className="h-10 w-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune compétence renseignée</h3>
          <p className="text-sm text-gray-600 mb-4">Ajoutez vos compétences pour améliorer votre profil et augmenter vos chances de matching.</p>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Ajouter mes compétences
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Skills Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 rounded-full p-2">
                  <StarIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{skills.length} compétence{skills.length > 1 ? 's' : ''} renseignée{skills.length > 1 ? 's' : ''}</h4>
                  <p className="text-sm text-gray-600">
                    {skills.filter(s => s.proficiency_level && s.proficiency_level >= 4).length} expert{skills.filter(s => s.proficiency_level && s.proficiency_level >= 4).length > 1 ? 's' : ''} • {' '}
                    {skills.filter(s => s.proficiency_level && s.proficiency_level === 3).length} confirmé{skills.filter(s => s.proficiency_level && s.proficiency_level === 3).length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Skills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skills.map((skill, index) => (
              <div key={skill.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-base">{skill.skills.display_name}</h4>
                    {skill.skills.category && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full mt-1 inline-block">
                        {skill.skills.category}
                      </span>
                    )}
                  </div>
                  {editing && (
                    <button
                      onClick={() => handleDeleteSkill(skill.id.toString())}
                      className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors"
                      disabled={saving}
                      title="Supprimer cette compétence"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {editing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Niveau de maîtrise</label>
                      <select
                        value={skill.proficiency_level || ''}
                        onChange={(e) => {
                          const newSkills = [...skills];
                          newSkills[index].proficiency_level = parseInt(e.target.value) || undefined;
                          setSkills(newSkills);
                        }}
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Non évalué</option>
                        <option value="1">Débutant</option>
                        <option value="2">Intermédiaire</option>
                        <option value="3">Confirmé</option>
                        <option value="4">Expert</option>
                        <option value="5">Maître</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getProficiencyColor(skill.proficiency_level)}`}>
                        {getProficiencyLabel(skill.proficiency_level)}
                      </span>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIcon
                            key={star}
                            className={`h-4 w-4 ${star <= (skill.proficiency_level || 0)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                              }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {editing && (
        <div className="mt-6">
          {!showAddForm ? (
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-dashed border-blue-200 rounded-xl p-6 text-center hover:border-blue-300 transition-colors">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <PlusIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Ajouter une compétence</h4>
              <p className="text-sm text-gray-600 mb-4">Enrichissez votre profil avec vos compétences techniques et métier</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Ajouter une compétence
              </button>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Ajouter une nouvelle compétence</h4>
                  <p className="text-sm text-gray-600 mt-1">Recherchez et sélectionnez une compétence dans notre base de données</p>
                </div>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewSkill({ skill_name: '', proficiency_level: 3 });
                    setSkillSuggestions([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la compétence *
                  </label>
                  <input
                    type="text"
                    value={newSkill.skill_name}
                    onChange={(e) => {
                      setNewSkill({ ...newSkill, skill_name: e.target.value });
                      handleSearchSkills(e.target.value);
                    }}
                    placeholder="Ex: JavaScript, React, Python..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    autoComplete="off"
                  />
                  {skillSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                      {loadingSuggestions ? (
                        <div className="p-3 text-sm text-gray-500 flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          Recherche...
                        </div>
                      ) : (
                        skillSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.id}
                            type="button"
                            onClick={() => handleSelectSuggestion(suggestion)}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm text-gray-700 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="font-medium">{suggestion.display_name}</div>
                            {suggestion.category && (
                              <div className="text-xs text-gray-500 mt-1">{suggestion.category}</div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Niveau de maîtrise *
                  </label>
                  <select
                    value={newSkill.proficiency_level}
                    onChange={(e) => setNewSkill({ ...newSkill, proficiency_level: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value={1}>Débutant - Notions de base</option>
                    <option value={2}>Intermédiaire - Utilisation courante</option>
                    <option value={3}>Confirmé - Maîtrise solide</option>
                    <option value={4}>Expert - Expertise avancée</option>
                    <option value={5}>Maître - Référent technique</option>
                  </select>
                  <div className="mt-2 text-xs text-gray-500">
                    Sélectionnez le niveau qui correspond le mieux à votre expérience
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewSkill({
                      skill_name: '',
                      proficiency_level: 3
                    });
                    setSkillSuggestions([]);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddSkill}
                  disabled={saving || !newSkill.skill_name.trim()}
                  className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Ajout...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Ajouter la compétence
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ExperiencesSection: React.FC<{ profile: CandidateProfileType | null; onUpdate: () => void }> = ({ profile, onUpdate }) => {
  const [experiences] = useState<Experience[]>(profile?.experiences || []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    company: '',
    role_title: '',
    start_date: '',
    end_date: '',
    description: ''
  });

  const resetForm = () => {
    setFormData({
      company: '',
      role_title: '',
      start_date: '',
      end_date: '',
      description: ''
    });
  };

  const handleAdd = async () => {
    try {
      setSaving(true);
      await apiService.createExperience(formData);
      setShowAddForm(false);
      resetForm();
      onUpdate();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'ajout');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      setSaving(true);
      await apiService.updateExperience(id, formData);
      setEditingId(null);
      resetForm();
      onUpdate();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette expérience ?')) return;

    try {
      await apiService.deleteExperience(id);
      onUpdate();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  const startEdit = (experience: Experience) => {
    setFormData({
      company: experience.company || '',
      role_title: experience.role_title || '',
      start_date: experience.start_date || '',
      end_date: experience.end_date || '',
      description: experience.description || ''
    });
    setEditingId(experience.id);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Expériences professionnelles</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Ajouter une expérience
        </button>
      </div>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-4">Nouvelle expérience</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="form-label">Entreprise *</label>
              <input
                type="text"
                className="form-input"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="form-label">Poste *</label>
              <input
                type="text"
                className="form-input"
                value={formData.role_title}
                onChange={(e) => setFormData({ ...formData, role_title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="form-label">Date de début</label>
              <input
                type="date"
                className="form-input"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Date de fin</label>
              <input
                type="date"
                className="form-input"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez vos missions, responsabilités et réalisations..."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowAddForm(false);
                resetForm();
              }}
              className="btn-secondary"
              disabled={saving}
            >
              Annuler
            </button>
            <button
              onClick={handleAdd}
              className="btn-primary"
              disabled={saving || !formData.company || !formData.role_title}
            >
              {saving ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      {/* Liste des expériences */}
      {experiences.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <BriefcaseIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Aucune expérience professionnelle renseignée.</p>
          <p className="text-sm">Ajoutez vos expériences pour enrichir votre profil.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {experiences.map((experience) => (
            <div key={experience.id} className="border border-gray-200 rounded-lg p-4">
              {editingId === experience.id ? (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="form-label">Entreprise *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label">Poste *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.role_title}
                        onChange={(e) => setFormData({ ...formData, role_title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label">Date de début</label>
                      <input
                        type="date"
                        className="form-input"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label">Date de fin</label>
                      <input
                        type="date"
                        className="form-input"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setEditingId(null);
                        resetForm();
                      }}
                      className="btn-secondary"
                      disabled={saving}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => handleUpdate(experience.id)}
                      className="btn-primary"
                      disabled={saving}
                    >
                      {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{experience.role_title}</h4>
                      <p className="text-gray-600">{experience.company}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEdit(experience)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(experience.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {(experience.start_date || experience.end_date) && (
                    <p className="text-sm text-gray-500 mb-2">
                      {formatDate(experience.start_date)}
                      {experience.start_date && experience.end_date && ' - '}
                      {experience.end_date ? formatDate(experience.end_date) : (experience.start_date && 'Présent')}
                    </p>
                  )}

                  {experience.description && (
                    <p className="text-sm text-gray-700 leading-relaxed">{experience.description}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CandidateProfile;
