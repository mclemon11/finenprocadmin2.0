import React, { useEffect, useState } from 'react';
import { addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../../../firebase/firebaseConfig';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import Swal from 'sweetalert2';
import { useLanguage } from '../../../context/LanguageContext';
import 'swiper/css';
import 'swiper/css/free-mode';
import './ProjectFormModal.css';

export default function ProjectFormModal({ isOpen, onClose, onSuccess }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: '',
    description: '',
    body: '',
    type: 'fixed',
    category: '',
    riskLevel: 'medium',
    expectedROI: '',
    durationMonths: '',
    targetAmount: '',
    minInvestment: '',
    maxInvestment: '',
    drawdown: '',
    performance: '',
    manualControl: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [showCreateInline, setShowCreateInline] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [imageItems, setImageItems] = useState([]);

  const sampleCategories = ['Energía', 'Trading', 'Crypto', 'Inmobiliario'];

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      body: '',
      type: 'fixed',
      category: '',
      riskLevel: 'medium',
      expectedROI: '',
      durationMonths: '',
      targetAmount: '',
      minInvestment: '',
      maxInvestment: '',
      drawdown: '',
      performance: '',
      manualControl: true,
    });
    setError(null);
    setImageItems((prev) => {
      for (const item of prev) {
        try {
          if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
        } catch {
          // ignore
        }
      }
      return [];
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    return () => {
      setImageItems((prev) => {
        for (const item of prev) {
          try {
            if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
          } catch {
            // ignore
          }
        }
        return prev;
      });
    };
  }, [isOpen]);

  const addImagesFromFiles = (files) => {
    const maxBytes = 5 * 1024 * 1024;
    const next = [];

    for (const file of Array.from(files || [])) {
      if (!String(file?.type || '').startsWith('image/')) continue;
      if (file.size > maxBytes) continue;
      const previewUrl = URL.createObjectURL(file);
      next.push({ file, previewUrl });
    }

    if (next.length > 0) {
      setImageItems((prev) => [...prev, ...next]);
    }
  };

  const removeImageAt = (index) => {
    setImageItems((prev) => {
      const item = prev[index];
      try {
        if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      } catch {
        // ignore
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e, statusToSet = 'draft') => {
    e.preventDefault();
    if (!form.name) {
      setError(t('projectForm.errors.nameRequired'));
      return;
    }

    const isFixed = form.type === 'fixed';
    const targetAmountNum = isFixed ? Number(form.targetAmount) : null;
    const minInvestmentNum = isFixed && form.minInvestment !== '' ? Number(form.minInvestment) : null;
    const maxInvestmentNum = isFixed && form.maxInvestment !== '' ? Number(form.maxInvestment) : null;

    if (isFixed) {
      if (!Number.isFinite(targetAmountNum) || targetAmountNum <= 0) {
        setError(t('projectForm.errors.targetRequired'));
        return;
      }

      if (minInvestmentNum !== null) {
        if (!Number.isFinite(minInvestmentNum) || minInvestmentNum <= 0) {
          setError(t('projectForm.errors.minInvestmentPositive'));
          return;
        }
        if (minInvestmentNum > targetAmountNum) {
          setError(t('projectForm.errors.minGreaterThanTarget'));
          return;
        }
      }

      if (maxInvestmentNum !== null) {
        if (!Number.isFinite(maxInvestmentNum) || maxInvestmentNum <= 0) {
          setError(t('projectForm.errors.maxInvestmentPositive'));
          return;
        }
        if (maxInvestmentNum > targetAmountNum) {
          setError(t('projectForm.errors.maxGreaterThanTarget'));
          return;
        }
      }

      if (minInvestmentNum !== null && maxInvestmentNum !== null && minInvestmentNum > maxInvestmentNum) {
        setError(t('projectForm.errors.minGreaterThanMax'));
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);
      const payload = {
        name: form.name,
        // Subtitle (short description shown on cards)
        description: form.description?.trim() ? form.description.trim() : null,
        // Long description (shown only on project detail)
        body: form.body?.trim() ? form.body.trim() : null,
        type: form.type,
        category: form.category || null,
        riskLevel: form.riskLevel || 'medium',
        expectedROI: form.expectedROI ? Number(form.expectedROI) : null,
        duration: form.durationMonths ? Number(form.durationMonths) : null,
        status: 'draft',
        targetAmount: isFixed ? targetAmountNum : null,
        // Support both field names used in different parts of the app.
        totalInvested: 0,
        totalInvestment: 0,
        minInvestment: isFixed ? minInvestmentNum : null,
        maxInvestment: isFixed ? maxInvestmentNum : null,
        autoLockOnTarget: isFixed ? true : null,
        drawdown: !isFixed && form.drawdown ? Number(form.drawdown) : null,
        performance: !isFixed && form.performance ? Number(form.performance) : null,
        manualControl: form.manualControl,
        investable: statusToSet === 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'projects'), payload);

      if (imageItems.length > 0) {
        const uploads = [];
        for (const item of imageItems) {
          const file = item?.file;
          if (!file) continue;

          const safeName = String(file.name || 'image')
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .slice(0, 80);
          const storagePath = `projects/${docRef.id}/images/${Date.now()}_${safeName}`;
          const storageRef = ref(storage, storagePath);

          await uploadBytes(storageRef, file, {
            contentType: file.type || 'image/*',
          });
          const url = await getDownloadURL(storageRef);
          uploads.push({ url, path: storagePath });
        }

        const urls = uploads.map((u) => u.url).filter(Boolean);
        const paths = uploads.map((u) => u.path).filter(Boolean);

        await updateDoc(docRef, {
          images: urls,
          imagePaths: paths,
          imageUrl: urls[0] || null,
          imagePath: paths[0] || null,
          imageUpdatedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // Success alert
      await Swal.fire({
        title: t('projectForm.alerts.successTitle'),
        text: t('projectForm.alerts.successText').replace('{name}', form.name),
        icon: 'success',
        confirmButtonColor: '#10b981',
        background: '#1a1f2e',
        color: '#ffffff',
        timer: 2500,
        timerProgressBar: true,
        customClass: {
          popup: 'swal-dark-popup',
          container: 'swal-above-modal',
        }
      });

      resetForm();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error creando proyecto', err);
      
      await Swal.fire({
        title: t('projectForm.alerts.errorTitle'),
        text: t('projectForm.errors.createFailed'),
        icon: 'error',
        confirmButtonColor: '#ef4444',
        background: '#1a1f2e',
        color: '#ffffff',
        customClass: {
          popup: 'swal-dark-popup',
          container: 'swal-above-modal',
        }
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="project-modal-overlay" onClick={handleClose}>
      <div className="project-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('projectForm.title')}</h2>
          <button className="close-btn" onClick={handleClose}>✕</button>
        </div>
        
        <form className="modal-form" onSubmit={(e) => handleSubmit(e, 'draft')}>
          <div className="modal-body">
            <div className="form-section-header">
              <h3>{t('projectForm.generalInfo')}</h3>
              <p>{t('projectForm.generalInfoDesc')}</p>
            </div>

            <div className="form-section">
              <div className="form-section-header">
                <h3>🖼️ {t('projectForm.images')}</h3>
                <p>{t('projectForm.imagesDesc')}</p>
              </div>

              <div className="form-row">
                <label>
                  {t('projectForm.addImages')}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      addImagesFromFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                  <span className="field-hint">{t('projectForm.imageHint')}</span>
                </label>
              </div>

              {imageItems.length > 0 && (
                <div className="project-images-carousel" aria-label="Previsualización de imágenes">
                  <Swiper
                    modules={[FreeMode]}
                    freeMode
                    slidesPerView="auto"
                    spaceBetween={12}
                    className="project-images-swiper"
                  >
                    {imageItems.map((item, idx) => (
                      <SwiperSlide key={`new-img-${idx}`} className="project-images-slide">
                        <div className="project-images-thumb">
                          <img src={item.previewUrl} alt={`Imagen ${idx + 1}`} loading="lazy" />
                          <button
                            type="button"
                            className="project-images-remove"
                            onClick={() => removeImageAt(idx)}
                            aria-label="Eliminar imagen"
                          >
                            ✕
                          </button>
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              )}
            </div>

            <div className="form-row">
              <label>
                {t('projectForm.projectName')} *
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t('projectForm.projectNamePlaceholder')}
                  required
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                {t('projectForm.subtitle')}
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={t('projectForm.subtitlePlaceholder')}
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                {t('projectForm.longDescription')}
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder={t('projectForm.longDescriptionPlaceholder')}
                  rows={5}
                />
              </label>
            </div>

            <div className="form-row form-row-2">
              <label>
                {t('projectForm.projectType')} *
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="fixed">{t('projectForm.typeFixed')}</option>
                  <option value="variable">{t('projectForm.typeVariable')}</option>
                </select>
              </label>
              <label>
                <span className="label-with-badge">
                  {t('projectForm.category')}
                  <span className="label-badge">{t('projectForm.categoryBadge')}</span>
                </span>
                <div className="category-select" onClick={() => setIsCategoryOpen((prev) => !prev)}>
                  <div className="category-control" role="button" tabIndex={0}>
                    <div className="category-value">{form.category || t('projectForm.categoryPlaceholder')}</div>
                    <div className="category-caret">▾</div>
                  </div>
                  {isCategoryOpen && (
                    <div className="category-dropdown" onClick={(e) => e.stopPropagation()}>
                      <div className="dropdown-search">
                        <input
                          type="text"
                          placeholder={t('projectForm.searchCategories')}
                          value={form.category}
                          onChange={(e) => setForm({ ...form, category: e.target.value })}
                        />
                      </div>
                      <div className="dropdown-section">
                        {sampleCategories.map((cat) => (
                          <button
                            type="button"
                            key={cat}
                            className={`dropdown-item ${form.category === cat ? 'selected' : ''}`}
                            onClick={() => {
                              setForm({ ...form, category: cat });
                              setShowCreateInline(false);
                              setIsCategoryOpen(false);
                            }}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                      <div className="dropdown-section create-section">
                        <button
                          type="button"
                          className="dropdown-item create-item"
                          onClick={() => {
                            setShowCreateInline(true);
                          }}
                        >
                          ➕ {t('projectForm.createCategory')}
                        </button>

                        {showCreateInline && (
                          <div className="inline-create">
                            <label>
                              {t('projectForm.categoryNameLabel')}
                              <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder={t('projectForm.categoryNamePlaceholder')}
                              />
                            </label>
                            <div className="inline-actions">
                              <button
                                type="button"
                                className="draft-btn ghost"
                                onClick={() => {
                                  setShowCreateInline(false);
                                  setNewCategoryName('');
                                }}
                              >
                                {t('common.cancel')}
                              </button>
                              <button
                                type="button"
                                className="submit-btn compact"
                                onClick={() => {
                                  if (!newCategoryName.trim()) return;
                                  setForm({ ...form, category: newCategoryName.trim() });
                                  setShowCreateInline(false);
                                  setIsCategoryOpen(false);
                                  setNewCategoryName('');
                                }}
                              >
                                {t('projectForm.createAndSelect')}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <span className="field-hint">{t('projectForm.categoryHint')}</span>
              </label>
            </div>

            <div className="form-row form-row-3">
              <label>
                {t('projectForm.riskLevel')} *
                <select
                  value={form.riskLevel}
                  onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}
                >
                  <option value="low">{t('projectForm.riskLow')}</option>
                  <option value="medium">{t('projectForm.riskMedium')}</option>
                  <option value="high">{t('projectForm.riskHigh')}</option>
                </select>
              </label>
              <label>
                {t('projectForm.expectedROI')}
                <input
                  type="number"
                  step="0.01"
                  value={form.expectedROI}
                  onChange={(e) => setForm({ ...form, expectedROI: e.target.value })}
                  placeholder="12"
                />
              </label>
              <label>
                {t('projectForm.duration')}
                <input
                  type="number"
                  value={form.durationMonths}
                  onChange={(e) => setForm({ ...form, durationMonths: e.target.value })}
                  placeholder="12"
                />
              </label>
            </div>

            {form.type === 'fixed' && (
              <div className="form-section form-section-financial">
                <div className="form-section-header">
                  <h3>⚙️ {t('projectForm.fixedConfig')}</h3>
                  <p>{t('projectForm.fixedConfigDesc')}</p>
                </div>
                <div className="form-row form-row-3">
                  <label>
                    {t('projectForm.targetAmount')}
                    <input
                      type="number"
                      value={form.targetAmount}
                      onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                      placeholder="500000"
                    />
                  </label>
                  <label>
                    {t('projectForm.minInvestment')}
                    <input
                      type="number"
                      value={form.minInvestment}
                      onChange={(e) => setForm({ ...form, minInvestment: e.target.value })}
                      placeholder="1000"
                    />
                  </label>
                  <label>
                    {t('projectForm.maxInvestment')}
                    <input
                      type="number"
                      value={form.maxInvestment}
                      onChange={(e) => setForm({ ...form, maxInvestment: e.target.value })}
                      placeholder="50000"
                    />
                  </label>
                </div>
              </div>
            )}

            {form.type === 'variable' && (
              <div className="form-section form-section-financial">
                <div className="form-section-header">
                  <h3>📊 {t('projectForm.variableConfig')}</h3>
                  <p>{t('projectForm.variableConfigDesc')}</p>
                </div>
                <div className="form-row form-row-2">
                  <label>
                    {t('projectForm.drawdown')}
                    <input
                      type="number"
                      step="0.01"
                      value={form.drawdown}
                      onChange={(e) => setForm({ ...form, drawdown: e.target.value })}
                      placeholder="-5"
                    />
                  </label>
                  <label>
                    {t('projectForm.performance')}
                    <input
                      type="number"
                      step="0.01"
                      value={form.performance}
                      onChange={(e) => setForm({ ...form, performance: e.target.value })}
                      placeholder="8"
                    />
                  </label>
                </div>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.manualControl}
                    onChange={(e) => setForm({ ...form, manualControl: e.target.checked })}
                  />
                  {t('projectForm.manualControl')}
                </label>
              </div>
            )}

            <div className="form-section form-section-advanced">
              <div className="form-section-header">
                <h3>🛰️ {t('projectForm.advancedConfig')}</h3>
                <p>{t('projectForm.advancedConfigDesc')}</p>
              </div>
              <div className="placeholder-box">
                <p>{t('projectForm.advancedPlaceholder')}</p>
              </div>
            </div>

            {error && <div className="form-error">{error}</div>}
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={handleClose} disabled={saving}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="draft-btn" disabled={saving}>
              {saving ? t('projectForm.saving') : t('projectForm.createDraft')}
            </button>
            <button 
              type="button" 
              className="submit-btn" 
              onClick={(e) => handleSubmit(e, 'active')}
              disabled={saving}
            >
              {saving ? t('projectForm.publishing') : t('projectForm.createAndPublish')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
