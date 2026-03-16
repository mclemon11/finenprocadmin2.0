import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { MdClose, MdPerson, MdUpload } from 'react-icons/md';
import './AdvisorModal.css';

/**
 * Modal for creating / editing an advisor.
 * @param {{ isOpen, onClose, onSave, advisor?, saving? }} props
 */
export default function AdvisorModal({ isOpen, onClose, onSave, advisor = null, saving = false }) {
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    specialty: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [error, setError] = useState('');

  const isEditing = !!advisor;

  useEffect(() => {
    if (isOpen) {
      if (advisor) {
        setForm({
          name: advisor.name || '',
          phone: advisor.phone || '',
          email: advisor.email || '',
          specialty: advisor.specialty || '',
        });
        setPhotoPreview(advisor.photoUrl || '');
      } else {
        setForm({ name: '', phone: '', email: '', specialty: '' });
        setPhotoPreview('');
      }
      setPhotoFile(null);
      setError('');
    }
  }, [isOpen, advisor]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      setError(t('advisorManager.nameRequired'));
      return;
    }
    setError('');
    onSave({ ...form }, photoFile);
  };

  if (!isOpen) return null;

  return (
    <div className="advisor-modal-overlay" onClick={onClose}>
      <div className="advisor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="advisor-modal-header">
          <h2>{isEditing ? t('advisorManager.editAdvisor') : t('advisorManager.createAdvisor')}</h2>
          <button className="advisor-modal-close" onClick={onClose}><MdClose /></button>
        </div>

        {error && <div className="advisor-modal-error">{error}</div>}

        <div className="advisor-modal-body">
          {/* Photo */}
          <div className="advisor-modal-photo-section">
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="advisor-modal-photo" />
            ) : (
              <div className="advisor-modal-photo-placeholder"><MdPerson /></div>
            )}
            <button
              className="advisor-modal-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <MdUpload /> {t('advisorManager.changePhoto')}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoSelect}
            />
          </div>

          {/* Form Fields */}
          <div className="advisor-modal-form">
            <div className="advisor-modal-field">
              <label>{t('advisorManager.name')}</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder={t('advisorManager.namePlaceholder')}
              />
            </div>

            <div className="advisor-modal-field">
              <label>{t('advisorManager.email')}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder={t('advisorManager.emailPlaceholder')}
              />
            </div>

            <div className="advisor-modal-field">
              <label>{t('advisorManager.phone')}</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder={t('advisorManager.phonePlaceholder')}
              />
            </div>

            <div className="advisor-modal-field">
              <label>{t('advisorManager.specialty')}</label>
              <input
                type="text"
                value={form.specialty}
                onChange={(e) => handleChange('specialty', e.target.value)}
                placeholder={t('advisorManager.specialtyPlaceholder')}
              />
            </div>
          </div>
        </div>

        <div className="advisor-modal-footer">
          <button className="advisor-modal-cancel" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </button>
          <button className="advisor-modal-save" onClick={handleSubmit} disabled={saving}>
            {saving ? t('advisorManager.saving') : (isEditing ? t('advisorManager.save') : t('advisorManager.create'))}
          </button>
        </div>
      </div>
    </div>
  );
}
