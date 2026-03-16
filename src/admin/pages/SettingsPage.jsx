import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { getAdvisor, saveAdvisor, uploadAdvisorPhoto } from '../services/advisor.service';
import { getPlatformSettings, savePlatformSettings } from '../services/platform.service';
import { MdPerson, MdSave, MdUpload } from 'react-icons/md';
import './SettingsPage.css';

export default function SettingsPage() {
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Platform T&C
  const [platformTerms, setPlatformTerms] = useState('');
  const [savingTerms, setSavingTerms] = useState(false);

  useEffect(() => {
    (async () => {
      const [advisorRes, platformRes] = await Promise.all([
        getAdvisor(),
        getPlatformSettings(),
      ]);
      if (advisorRes.success && advisorRes.data) {
        setName(advisorRes.data.name || '');
        setPhone(advisorRes.data.phone || '');
        setPhotoUrl(advisorRes.data.photoUrl || '');
      }
      if (platformRes.success && platformRes.data) {
        setPlatformTerms(platformRes.data.termsAndConditions || '');
      }
      setLoading(false);
    })();
  }, []);

  const clearMessages = () => {
    setSuccess('');
    setError('');
  };

  const handleSave = async () => {
    clearMessages();
    if (!name.trim()) {
      setError(t('settings.nameRequired'));
      return;
    }
    setSaving(true);
    const res = await saveAdvisor({ name: name.trim(), phone: phone.trim() });
    setSaving(false);
    if (res.success) {
      setSuccess(t('settings.savedSuccess'));
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(res.error);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    clearMessages();
    setUploading(true);
    const res = await uploadAdvisorPhoto(file);
    setUploading(false);
    if (res.success) {
      setPhotoUrl(res.photoUrl);
      setSuccess(t('settings.photoUpdated'));
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(res.error);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const handleSaveTerms = async () => {
    clearMessages();
    setSavingTerms(true);
    const res = await savePlatformSettings({ termsAndConditions: platformTerms.trim() });
    setSavingTerms(false);
    if (res.success) {
      setSuccess(t('settings.termsSaved'));
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(res.error);
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="advisor-loading">{t('common.loading')}...</div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">{t('nav.settings')}</h1>
        <p className="page-subtitle">{t('settings.subtitle')}</p>
      </div>

      <div className="advisor-card">
        <h2 className="advisor-card-title">{t('settings.advisorTitle')}</h2>

        {success && <div className="advisor-success">{success}</div>}
        {error && <div className="advisor-error">{error}</div>}

        {/* Photo */}
        <div className="advisor-photo-section">
          {photoUrl ? (
            <img src={photoUrl} alt="Advisor" className="advisor-photo-preview" />
          ) : (
            <div className="advisor-photo-placeholder">
              <MdPerson />
            </div>
          )}
          <div className="advisor-photo-actions">
            <span className="photo-label">{t('settings.advisorPhoto')}</span>
            <button
              className="btn-upload"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <MdUpload />
              {uploading ? t('settings.uploading') : t('settings.changePhoto')}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />
          </div>
        </div>

        {/* Form */}
        <div className="advisor-form">
          <div className="form-group">
            <label>{t('settings.advisorName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('settings.advisorNamePlaceholder')}
            />
          </div>

          <div className="form-group">
            <label>{t('settings.advisorPhone')}</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('settings.advisorPhonePlaceholder')}
            />
          </div>

          <div className="advisor-actions">
            <button
              className="btn-save"
              onClick={handleSave}
              disabled={saving}
            >
              <MdSave />
              {saving ? t('settings.saving') : t('settings.save')}
            </button>
          </div>
        </div>
      </div>

      {/* Platform Terms & Conditions */}
      <div className="advisor-card">
        <h2 className="advisor-card-title">📄 {t('settings.platformTerms')}</h2>
        <p className="terms-description">{t('settings.platformTermsDesc')}</p>

        {success && <div className="advisor-success">{success}</div>}

        <div className="advisor-form">
          <div className="form-group">
            <textarea
              className="terms-textarea"
              value={platformTerms}
              onChange={(e) => setPlatformTerms(e.target.value)}
              placeholder={t('settings.platformTermsPlaceholder')}
              rows={8}
            />
          </div>

          <div className="advisor-actions">
            <button
              className="btn-save"
              onClick={handleSaveTerms}
              disabled={savingTerms}
            >
              <MdSave />
              {savingTerms ? t('settings.saving') : t('settings.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
