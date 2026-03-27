import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { useLanguage } from '../../../context/LanguageContext';
import { createProjectUpdate } from '../../services/projectUpdates.service';
import './RegisterUpdateModal.css';

export default function RegisterUpdateModal({ projectId, isOpen, onClose, onSuccess }) {
  const { t } = useLanguage();
  const [step, setStep] = useState('choose'); // 'choose' | 'form'
  const [updateType, setUpdateType] = useState(null); // 'status_update' | 'profit' | 'loss'
  const [form, setForm] = useState({
    title: '',
    description: '',
    amount: '',
  });
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  const resetModal = () => {
    setStep('choose');
    setUpdateType(null);
    setForm({ title: '', description: '', amount: '' });
    setFiles([]);
    setSaving(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleChooseType = (type) => {
    setUpdateType(type);
    setStep('form');
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      Swal.fire({
        title: t('projectUpdates.titleRequired'),
        icon: 'warning',
        background: '#1a1f2e',
        color: '#ffffff',
        confirmButtonColor: '#f59e0b',
        customClass: { popup: 'swal-dark-popup', container: 'swal-above-modal' },
      });
      return;
    }

    if ((updateType === 'profit' || updateType === 'loss') && (!form.amount || Number(form.amount) <= 0)) {
      Swal.fire({
        title: t('projectUpdates.amountRequired'),
        icon: 'warning',
        background: '#1a1f2e',
        color: '#ffffff',
        confirmButtonColor: '#f59e0b',
        customClass: { popup: 'swal-dark-popup', container: 'swal-above-modal' },
      });
      return;
    }

    try {
      setSaving(true);
      const result = await createProjectUpdate({
        projectId,
        type: updateType,
        title: form.title,
        description: form.description,
        amount: form.amount,
        files,
      });

      if (result.success) {
        await Swal.fire({
          title: t('projectUpdates.successTitle'),
          text: t('projectUpdates.successText'),
          icon: 'success',
          confirmButtonColor: '#10b981',
          background: '#1a1f2e',
          color: '#ffffff',
          timer: 2000,
          timerProgressBar: true,
          customClass: { popup: 'swal-dark-popup', container: 'swal-above-modal' },
        });
        onSuccess?.();
        handleClose();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error creating update:', err);
      Swal.fire({
        title: t('projectUpdates.errorTitle'),
        text: err.message,
        icon: 'error',
        confirmButtonColor: '#ef4444',
        background: '#1a1f2e',
        color: '#ffffff',
        customClass: { popup: 'swal-dark-popup', container: 'swal-above-modal' },
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="register-update-overlay" onClick={handleClose}>
      <div className="register-update-modal" onClick={(e) => e.stopPropagation()}>
        <div className="register-update-header">
          <h2>
            {step === 'choose'
              ? t('projectUpdates.registerUpdate')
              : updateType === 'status_update'
              ? t('projectUpdates.statusUpdate')
              : updateType === 'profit'
              ? t('projectUpdates.registerProfit')
              : t('projectUpdates.registerLoss')}
          </h2>
          <button className="register-update-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        {step === 'choose' && (
          <div className="register-update-choices">
            <p className="choices-description">{t('projectUpdates.chooseType')}</p>
            <div className="update-type-cards">
              <button className="update-type-card type-status" onClick={() => handleChooseType('status_update')}>
                <span className="type-icon">📋</span>
                <span className="type-label">{t('projectUpdates.statusUpdate')}</span>
                <span className="type-desc">{t('projectUpdates.statusUpdateDesc')}</span>
              </button>
              <button className="update-type-card type-profit" onClick={() => handleChooseType('profit')}>
                <span className="type-icon">📈</span>
                <span className="type-label">{t('projectUpdates.registerProfit')}</span>
                <span className="type-desc">{t('projectUpdates.profitDesc')}</span>
              </button>
              <button className="update-type-card type-loss" onClick={() => handleChooseType('loss')}>
                <span className="type-icon">📉</span>
                <span className="type-label">{t('projectUpdates.registerLoss')}</span>
                <span className="type-desc">{t('projectUpdates.lossDesc')}</span>
              </button>
            </div>
          </div>
        )}

        {step === 'form' && (
          <div className="register-update-form">
            <button className="back-to-choices" onClick={() => { setStep('choose'); setUpdateType(null); }}>
              ← {t('projectUpdates.backToOptions')}
            </button>

            <div className="form-field">
              <label>{t('projectUpdates.titleLabel')} <span className="required">*</span></label>
              <input
                type="text"
                className="form-input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={t('projectUpdates.titlePlaceholder')}
              />
            </div>

            <div className="form-field">
              <label>{t('projectUpdates.descriptionLabel')}</label>
              <textarea
                className="form-input"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t('projectUpdates.descriptionPlaceholder')}
              />
            </div>

            {(updateType === 'profit' || updateType === 'loss') && (
              <div className="form-field">
                <label>
                  {updateType === 'profit'
                    ? t('projectUpdates.profitAmount')
                    : t('projectUpdates.lossAmount')}
                  <span className="required">*</span>
                </label>
                <div className="input-with-icon">
                  <span className="input-prefix">$</span>
                  <input
                    type="number"
                    className="form-input with-prefix"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}

            <div className="form-field">
              <label>{t('projectUpdates.mediaLabel')}</label>
              <input
                type="file"
                className="form-input"
                multiple
                onChange={handleFileChange}
              />
              <span className="form-hint">{t('projectUpdates.mediaHint')}</span>
            </div>

            {files.length > 0 && (
              <div className="file-list">
                {files.map((file, idx) => (
                  <div key={idx} className="file-item">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                    <button className="file-remove" onClick={() => removeFile(idx)}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="register-update-actions">
              <button className="cancel-btn" onClick={handleClose} disabled={saving}>
                {t('common.cancel')}
              </button>
              <button
                className={`submit-btn ${updateType === 'loss' ? 'btn-loss' : updateType === 'profit' ? 'btn-profit' : ''}`}
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner"></span> {t('projectUpdates.saving')}
                  </>
                ) : (
                  t('projectUpdates.save')
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
