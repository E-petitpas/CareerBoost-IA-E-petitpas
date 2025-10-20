import React, { useState, useEffect } from 'react';
import {
  UserCircleIcon,
  PencilIcon,
  PlusIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  CogIcon,
  StarIcon,
  DocumentTextIcon
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

  const getProficiencyLabel = (level?: number) => {
    if (!level) return 'Non évalué';
    const labels = ['', 'Débutant', 'Intermédiaire', 'Confirmé', 'Expert', 'Maître'];
    return labels[level] || 'Non évalué';
  };

  const getProficiencyColor = (level?: number) => {
    if (!level) return 'bg-gray-200';
    const colors = ['', 'bg-red-200', 'bg-orange-200', 'bg-yellow-200', 'bg-green-200', 'bg-blue-200'];
    return colors[level] || 'bg-gray-200';
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
      </div>

      {skills.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <StarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Aucune compétence renseignée.</p>
          <p className="text-sm">Ajoutez vos compétences pour améliorer votre profil.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((skill, index) => (
            <div key={skill.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">{skill.skills.display_name}</h4>
                {editing && (
                  <button
                    onClick={() => handleDeleteSkill(skill.id.toString())}
                    className="text-red-500 hover:text-red-700 text-lg font-bold"
                    disabled={saving}
                  >
                    ×
                  </button>
                )}
              </div>

              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Niveau de maîtrise</label>
                    <select
                      value={skill.proficiency_level || ''}
                      onChange={(e) => {
                        const newSkills = [...skills];
                        newSkills[index].proficiency_level = parseInt(e.target.value) || undefined;
                        setSkills(newSkills);
                      }}
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
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
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${getProficiencyColor(skill.proficiency_level)}`}></span>
                    <span className="text-sm text-gray-600">{getProficiencyLabel(skill.proficiency_level)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="mt-6">
          {!showAddForm ? (
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <PlusIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <button
                onClick={() => setShowAddForm(true)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Ajouter une compétence
              </button>
            </div>
          ) : (
            <div className="p-4 border border-gray-300 rounded-lg bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-4">Ajouter une nouvelle compétence</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la compétence
                  </label>
                  <input
                    type="text"
                    value={newSkill.skill_name}
                    onChange={(e) => {
                      setNewSkill({ ...newSkill, skill_name: e.target.value });
                      handleSearchSkills(e.target.value);
                    }}
                    placeholder="Ex: JavaScript, React, Python..."
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    autoComplete="off"
                  />
                  {skillSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10">
                      {loadingSuggestions ? (
                        <div className="p-2 text-sm text-gray-500">Recherche...</div>
                      ) : (
                        skillSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.id}
                            type="button"
                            onClick={() => handleSelectSuggestion(suggestion)}
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm text-gray-700 border-b last:border-b-0"
                          >
                            {suggestion.display_name}
                            {suggestion.category && (
                              <span className="text-xs text-gray-500 ml-2">({suggestion.category})</span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Niveau de maîtrise
                  </label>
                  <select
                    value={newSkill.proficiency_level}
                    onChange={(e) => setNewSkill({ ...newSkill, proficiency_level: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value={1}>Débutant</option>
                    <option value={2}>Intermédiaire</option>
                    <option value={3}>Confirmé</option>
                    <option value={4}>Expert</option>
                    <option value={5}>Maître</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewSkill({
                      skill_name: '',
                      proficiency_level: 3
                    });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={saving}
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddSkill}
                  disabled={saving || !newSkill.skill_name.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Ajout...' : 'Ajouter'}
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
