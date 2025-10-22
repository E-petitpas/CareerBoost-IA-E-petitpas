import React, { useState } from 'react';
import {
  PencilIcon,
  PlusIcon,
  AcademicCapIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import apiService from '../../services/api';
import { CandidateProfile, Education, ContractType } from '../../types';

// Section des formations
export const EducationSection: React.FC<{ profile: CandidateProfile | null; onUpdate: () => void }> = ({ profile, onUpdate }) => {
  const [educations] = useState<Education[]>(profile?.educations || []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    school: '',
    degree: '',
    field: '',
    start_date: '',
    end_date: '',
    description: ''
  });

  const resetForm = () => {
    setFormData({
      school: '',
      degree: '',
      field: '',
      start_date: '',
      end_date: '',
      description: ''
    });
  };

  const handleAdd = async () => {
    // Validation côté client
    if (!formData.school || formData.school.trim().length === 0) {
      alert('Le nom de l\'école/université est requis');
      return;
    }

    // Nettoyer les données avant envoi
    const cleanedData = {
      school: formData.school.trim(),
      degree: formData.degree.trim() || undefined,
      field: formData.field.trim() || undefined,
      start_date: formData.start_date || undefined,
      end_date: formData.end_date || undefined,
      description: formData.description.trim() || undefined
    };

    try {
      setSaving(true);
      await apiService.createEducation(cleanedData);
      setShowAddForm(false);
      resetForm();
      onUpdate();
    } catch (err: any) {
      console.error('Erreur ajout formation:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Erreur lors de l\'ajout de la formation';

      // Afficher les détails de validation si disponibles
      if (err.response?.data?.details) {
        const details = err.response.data.details.map((d: any) => `${d.field}: ${d.message}`).join('\n');
        alert(`${errorMessage}\n\nDétails:\n${details}`);
      } else {
        alert(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    // Validation côté client
    if (!formData.school || formData.school.trim().length === 0) {
      alert('Le nom de l\'école/université est requis');
      return;
    }

    // Nettoyer les données avant envoi
    const cleanedData = {
      school: formData.school.trim(),
      degree: formData.degree.trim() || undefined,
      field: formData.field.trim() || undefined,
      start_date: formData.start_date || undefined,
      end_date: formData.end_date || undefined,
      description: formData.description.trim() || undefined
    };

    try {
      setSaving(true);
      await apiService.updateEducation(id, cleanedData);
      setEditingId(null);
      resetForm();
      onUpdate();
    } catch (err: any) {
      console.error('Erreur mise à jour formation:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Erreur lors de la mise à jour de la formation';

      // Afficher les détails de validation si disponibles
      if (err.response?.data?.details) {
        const details = err.response.data.details.map((d: any) => `${d.field}: ${d.message}`).join('\n');
        alert(`${errorMessage}\n\nDétails:\n${details}`);
      } else {
        alert(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette formation ?')) return;

    try {
      await apiService.deleteEducation(id);
      onUpdate();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  const startEdit = (education: Education) => {
    setFormData({
      school: education.school || '',
      degree: education.degree || '',
      field: education.field || '',
      start_date: education.start_date || '',
      end_date: education.end_date || '',
      description: education.description || ''
    });
    setEditingId(education.id);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Formations</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Ajouter une formation
        </button>
      </div>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-4">Nouvelle formation</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="form-label">École/Université *</label>
              <input
                type="text"
                className="form-input"
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="form-label">Diplôme</label>
              <input
                type="text"
                className="form-input"
                value={formData.degree}
                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                placeholder="Ex: Master, Licence, BTS..."
              />
            </div>
            <div>
              <label className="form-label">Domaine d'étude</label>
              <input
                type="text"
                className="form-input"
                value={formData.field}
                onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                placeholder="Ex: Informatique, Marketing..."
              />
            </div>
            <div>
              <label className="form-label">Année de début</label>
              <input
                type="date"
                className="form-input"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Année de fin</label>
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
              placeholder="Spécialisations, projets, mentions..."
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
              disabled={saving || !formData.school}
            >
              {saving ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      {/* Liste des formations */}
      {educations.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <AcademicCapIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Aucune formation renseignée.</p>
          <p className="text-sm">Ajoutez vos formations pour enrichir votre profil.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {educations.map((education) => (
            <div key={education.id} className="border border-gray-200 rounded-lg p-4">
              {editingId === education.id ? (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="form-label">École/Université *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.school}
                        onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label">Diplôme</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.degree}
                        onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label">Domaine</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.field}
                        onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label">Année de début</label>
                      <input
                        type="date"
                        className="form-input"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="form-label">Année de fin</label>
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
                      onClick={() => handleUpdate(education.id)}
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
                      <h4 className="font-semibold text-gray-900">
                        {education.degree ? `${education.degree} - ${education.field}` : education.field || 'Formation'}
                      </h4>
                      <p className="text-gray-600">{education.school}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEdit(education)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(education.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {(education.start_date || education.end_date) && (
                    <p className="text-sm text-gray-500 mb-2">
                      {formatDate(education.start_date)}
                      {education.start_date && education.end_date && ' - '}
                      {education.end_date ? formatDate(education.end_date) : (education.start_date && 'En cours')}
                    </p>
                  )}

                  {education.description && (
                    <p className="text-sm text-gray-700 leading-relaxed">{education.description}</p>
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

// Section des préférences de recherche
export const PreferencesSection: React.FC<{ profile: CandidateProfile | null; onUpdate: () => void }> = ({ profile, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    mobility_km: profile?.mobility_km || 25,
    preferred_contracts: profile?.preferred_contracts || []
  });

  const contractTypes = [
    { value: 'CDI', label: 'CDI' },
    { value: 'CDD', label: 'CDD' },
    { value: 'STAGE', label: 'Stage' },
    { value: 'ALTERNANCE', label: 'Alternance' },
    { value: 'INTERIM', label: 'Intérim' },
    { value: 'FREELANCE', label: 'Freelance' },
    { value: 'TEMPS_PARTIEL', label: 'Temps partiel' },
    { value: 'TEMPS_PLEIN', label: 'Temps plein' }
  ];

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
      mobility_km: profile?.mobility_km || 25,
      preferred_contracts: profile?.preferred_contracts || []
    });
    setEditing(false);
  };

  const toggleContract = (contractType: ContractType) => {
    const current = formData.preferred_contracts;
    const isSelected = current.includes(contractType);

    if (isSelected) {
      setFormData({
        ...formData,
        preferred_contracts: current.filter(c => c !== contractType)
      });
    } else {
      setFormData({
        ...formData,
        preferred_contracts: [...current, contractType]
      });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Préférences de recherche</h3>
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
            <label className="form-label">Mobilité géographique (km)</label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="0"
                max="200"
                step="5"
                className="flex-1"
                value={formData.mobility_km}
                onChange={(e) => setFormData({ ...formData, mobility_km: parseInt(e.target.value) })}
              />
              <span className="text-sm font-medium text-gray-700 w-16">
                {formData.mobility_km} km
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Distance maximale que vous êtes prêt(e) à parcourir pour un emploi
            </p>
          </div>

          <div>
            <label className="form-label">Types de contrats souhaités</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              {contractTypes.map((contract) => (
                <label key={contract.value} className="flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={formData.preferred_contracts.includes(contract.value as ContractType)}
                    onChange={() => toggleContract(contract.value as ContractType)}
                  />
                  <span className="ml-2 text-sm text-gray-700">{contract.label}</span>
                </label>
              ))}
            </div>
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
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Mobilité géographique</h4>
            <p className="text-sm text-gray-700">
              Jusqu'à <span className="font-medium">{profile?.mobility_km || 0} km</span> de votre domicile
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Types de contrats souhaités</h4>
            {profile?.preferred_contracts && profile.preferred_contracts.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.preferred_contracts.map((contract) => {
                  const contractLabel = contractTypes.find(c => c.value === contract)?.label || contract;
                  return (
                    <span key={contract} className="badge badge-secondary">
                      {contractLabel}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucune préférence définie</p>
            )}
          </div>

          {(!profile?.mobility_km && (!profile?.preferred_contracts || profile.preferred_contracts.length === 0)) && (
            <div className="text-center py-8 text-gray-500">
              <CogIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Définissez vos préférences pour améliorer la pertinence des offres proposées.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
