import React, { useState } from 'react';
import {
  UserCircleIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  StarIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { CVAnalysisResult, CVSkill, CVExperience, CVEducation } from '../../types';

interface CVPreviewProps {
  analysisResult: CVAnalysisResult;
  onSave: (data: CVAnalysisResult) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

const CVPreview: React.FC<CVPreviewProps> = ({
  analysisResult,
  onSave,
  onCancel,
  isSaving = false
}) => {
  const [editedData, setEditedData] = useState<CVAnalysisResult>(analysisResult);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const updatePersonalInfo = (field: string, value: string) => {
    setEditedData(prev => ({
      ...prev,
      personal_info: {
        ...prev.personal_info,
        [field]: value || null
      }
    }));
  };

  const updateSummary = (summary: string) => {
    setEditedData(prev => ({
      ...prev,
      professional_summary: summary || null
    }));
  };

  const updateExperienceYears = (years: number) => {
    setEditedData(prev => ({
      ...prev,
      experience_years: years
    }));
  };

  const addSkill = () => {
    try {
      const newSkill: CVSkill = {
        name: '',
        category: 'technique',
        level: 'intermédiaire'
      };
      setEditedData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill]
      }));
    } catch (error) {
      console.error('Erreur ajout compétence:', error);
    }
  };

  const updateSkill = (index: number, field: keyof CVSkill, value: string) => {
    setEditedData(prev => ({
      ...prev,
      skills: prev.skills.map((skill, i) =>
        i === index ? { ...skill, [field]: value } : skill
      )
    }));
  };

  const removeSkill = (index: number) => {
    setEditedData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const addExperience = () => {
    const newExperience: CVExperience = {
      company: '',
      position: '',
      start_date: null,
      end_date: null,
      description: ''
    };
    setEditedData(prev => ({
      ...prev,
      experiences: [...prev.experiences, newExperience]
    }));
  };

  const updateExperience = (index: number, field: keyof CVExperience, value: string | null) => {
    setEditedData(prev => ({
      ...prev,
      experiences: prev.experiences.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeExperience = (index: number) => {
    setEditedData(prev => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index)
    }));
  };

  const addEducation = () => {
    const newEducation: CVEducation = {
      school: '',
      degree: '',
      field: '',
      start_date: null,
      end_date: null,
      description: ''
    };
    setEditedData(prev => ({
      ...prev,
      educations: [...prev.educations, newEducation]
    }));
  };

  const updateEducation = (index: number, field: keyof CVEducation, value: string | null) => {
    setEditedData(prev => ({
      ...prev,
      educations: prev.educations.map((edu, i) =>
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (index: number) => {
    setEditedData(prev => ({
      ...prev,
      educations: prev.educations.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    onSave(editedData);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'expert': return 'bg-green-100 text-green-800';
      case 'avancé': return 'bg-blue-100 text-blue-800';
      case 'intermédiaire': return 'bg-yellow-100 text-yellow-800';
      case 'débutant': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technique': return 'bg-purple-100 text-purple-800';
      case 'métier': return 'bg-indigo-100 text-indigo-800';
      case 'soft_skill': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 rounded-full p-2">
              <UserCircleIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Prévisualisation de votre profil</h2>
              <p className="text-blue-100">Vérifiez et modifiez les informations extraites</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  <span>Sauvegarde...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="h-5 w-5" />
                  <span>Sauvegarder</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Informations personnelles */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <UserCircleIcon className="h-5 w-5 mr-2 text-blue-600" />
              Informations personnelles
            </h3>
            <button
              onClick={() => setEditingSection(editingSection === 'personal' ? null : 'personal')}
              className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <PencilIcon className="h-4 w-4" />
              <span>Modifier</span>
            </button>
          </div>

          {editingSection === 'personal' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                <input
                  type="text"
                  value={editedData.personal_info.name || ''}
                  onChange={(e) => updatePersonalInfo('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre/Poste</label>
                <input
                  type="text"
                  value={editedData.personal_info.title || ''}
                  onChange={(e) => updatePersonalInfo('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editedData.personal_info.email || ''}
                  onChange={(e) => updatePersonalInfo('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={editedData.personal_info.phone || ''}
                  onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Localisation</label>
                <input
                  type="text"
                  value={editedData.personal_info.location || ''}
                  onChange={(e) => updatePersonalInfo('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Années d'expérience</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={editedData.experience_years}
                  onChange={(e) => updateExperienceYears(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm text-gray-500">Nom :</span>
                <p className="font-medium">{editedData.personal_info.name || 'Non renseigné'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Titre :</span>
                <p className="font-medium">{editedData.personal_info.title || 'Non renseigné'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Email :</span>
                <p className="font-medium">{editedData.personal_info.email || 'Non renseigné'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Téléphone :</span>
                <p className="font-medium">{editedData.personal_info.phone || 'Non renseigné'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Localisation :</span>
                <p className="font-medium">{editedData.personal_info.location || 'Non renseigné'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Expérience :</span>
                <p className="font-medium">{editedData.experience_years} année{editedData.experience_years > 1 ? 's' : ''}</p>
              </div>
            </div>
          )}
        </section>

        {/* Résumé professionnel */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Résumé professionnel</h3>
            <button
              onClick={() => setEditingSection(editingSection === 'summary' ? null : 'summary')}
              className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <PencilIcon className="h-4 w-4" />
              <span>Modifier</span>
            </button>
          </div>

          {editingSection === 'summary' ? (
            <textarea
              value={editedData.professional_summary || ''}
              onChange={(e) => updateSummary(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Décrivez votre profil professionnel..."
            />
          ) : (
            <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
              {editedData.professional_summary || 'Aucun résumé professionnel renseigné'}
            </p>
          )}
        </section>

        {/* Compétences */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <StarIcon className="h-5 w-5 mr-2 text-blue-600" />
              Compétences ({editedData.skills.length})
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={addSkill}
                className="text-green-600 hover:text-green-700 flex items-center space-x-1"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Ajouter</span>
              </button>
              <button
                onClick={() => setEditingSection(editingSection === 'skills' ? null : 'skills')}
                className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <PencilIcon className="h-4 w-4" />
                <span>Modifier</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {editedData.skills.map((skill, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                {editingSection === 'skills' ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                    <input
                      type="text"
                      value={skill.name}
                      onChange={(e) => updateSkill(index, 'name', e.target.value)}
                      placeholder="Nom de la compétence"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <select
                      value={skill.category}
                      onChange={(e) => updateSkill(index, 'category', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="technique">Technique</option>
                      <option value="métier">Métier</option>
                      <option value="soft_skill">Soft Skill</option>
                    </select>
                    <select
                      value={skill.level}
                      onChange={(e) => updateSkill(index, 'level', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="débutant">Débutant</option>
                      <option value="intermédiaire">Intermédiaire</option>
                      <option value="avancé">Avancé</option>
                      <option value="expert">Expert</option>
                    </select>
                    <button
                      onClick={() => removeSkill(index)}
                      className="text-red-600 hover:text-red-700 flex items-center justify-center"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-gray-900">{skill.name}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(skill.category)}`}>
                        {skill.category}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getLevelColor(skill.level)}`}>
                        {skill.level}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {editedData.skills.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <StarIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Aucune compétence détectée</p>
                <button
                  onClick={addSkill}
                  className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Ajouter une compétence
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Expériences */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BriefcaseIcon className="h-5 w-5 mr-2 text-blue-600" />
              Expériences ({editedData.experiences.length})
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={addExperience}
                className="text-green-600 hover:text-green-700 flex items-center space-x-1"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Ajouter</span>
              </button>
              <button
                onClick={() => setEditingSection(editingSection === 'experiences' ? null : 'experiences')}
                className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <PencilIcon className="h-4 w-4" />
                <span>Modifier</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {editedData.experiences.map((experience, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                {editingSection === 'experiences' ? (
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => removeExperience(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={experience.company}
                        onChange={(e) => updateExperience(index, 'company', e.target.value)}
                        placeholder="Entreprise"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        value={experience.position}
                        onChange={(e) => updateExperience(index, 'position', e.target.value)}
                        placeholder="Poste"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        value={experience.start_date || ''}
                        onChange={(e) => updateExperience(index, 'start_date', e.target.value || null)}
                        placeholder="Date de début (YYYY-MM)"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        value={experience.end_date || ''}
                        onChange={(e) => updateExperience(index, 'end_date', e.target.value || null)}
                        placeholder="Date de fin (YYYY-MM ou 'En cours')"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <textarea
                      value={experience.description}
                      onChange={(e) => updateExperience(index, 'description', e.target.value)}
                      placeholder="Description des missions"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{experience.position}</h4>
                      <span className="text-sm text-gray-500">
                        {experience.start_date} - {experience.end_date || 'En cours'}
                      </span>
                    </div>
                    <p className="text-blue-600 font-medium mb-2">{experience.company}</p>
                    {experience.description && (
                      <p className="text-gray-700 text-sm">{experience.description}</p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {editedData.experiences.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <BriefcaseIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Aucune expérience détectée</p>
                <button
                  onClick={addExperience}
                  className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Ajouter une expérience
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Formations */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <AcademicCapIcon className="h-5 w-5 mr-2 text-blue-600" />
              Formations ({editedData.educations.length})
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={addEducation}
                className="text-green-600 hover:text-green-700 flex items-center space-x-1"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Ajouter</span>
              </button>
              <button
                onClick={() => setEditingSection(editingSection === 'educations' ? null : 'educations')}
                className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <PencilIcon className="h-4 w-4" />
                <span>Modifier</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {editedData.educations.map((education, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                {editingSection === 'educations' ? (
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => removeEducation(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={education.school}
                        onChange={(e) => updateEducation(index, 'school', e.target.value)}
                        placeholder="École/Université"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        value={education.degree}
                        onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                        placeholder="Diplôme"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="text"
                        value={education.field}
                        onChange={(e) => updateEducation(index, 'field', e.target.value)}
                        placeholder="Domaine d'études"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={education.start_date || ''}
                          onChange={(e) => updateEducation(index, 'start_date', e.target.value || null)}
                          placeholder="Début (YYYY)"
                          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          type="text"
                          value={education.end_date || ''}
                          onChange={(e) => updateEducation(index, 'end_date', e.target.value || null)}
                          placeholder="Fin (YYYY)"
                          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <textarea
                      value={education.description}
                      onChange={(e) => updateEducation(index, 'description', e.target.value)}
                      placeholder="Description (optionnel)"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{education.degree}</h4>
                      <span className="text-sm text-gray-500">
                        {education.start_date} - {education.end_date}
                      </span>
                    </div>
                    <p className="text-blue-600 font-medium mb-1">{education.school}</p>
                    {education.field && (
                      <p className="text-gray-600 text-sm mb-2">{education.field}</p>
                    )}
                    {education.description && (
                      <p className="text-gray-700 text-sm">{education.description}</p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {editedData.educations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <AcademicCapIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Aucune formation détectée</p>
                <button
                  onClick={addEducation}
                  className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Ajouter une formation
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CVPreview;
