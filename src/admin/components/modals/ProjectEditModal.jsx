import React, { useEffect, useMemo, useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes, deleteObject } from 'firebase/storage';
import { db, storage } from '../../../firebase/firebaseConfig';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode } from 'swiper/modules';
import Swal from 'sweetalert2';
import { useLanguage } from '../../../context/LanguageContext';
import 'swiper/css';
import 'swiper/css/free-mode';
import './ProjectEditModal.css';

export default function ProjectEditModal({ project, isOpen, onClose, onSuccess, onTimelineEvent }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    body: project?.body || '',
    category: project?.category || '',
    expectedROI: project?.expectedROI || '',
    duration: project?.duration || '',
    drawdown: project?.drawdown || '',
    performance: project?.performance || '',
  });
  const [existingImages, setExistingImages] = useState([]);
  const [newImageItems, setNewImageItems] = useState([]);
  const [deletedImagePaths, setDeletedImagePaths] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name || '',
        description: project.description || '',
        body: project.body || '',
        category: project.category || '',
        expectedROI: project.expectedROI || '',
        duration: project.duration || '',
        drawdown: project.drawdown || '',
        performance: project.performance || '',
      });
      const urls = Array.isArray(project.images)
        ? project.images.filter((u) => typeof u === 'string' && u.trim())
        : (project.imageUrl ? [project.imageUrl] : []);

      const paths = Array.isArray(project.imagePaths)
        ? project.imagePaths.filter((p) => typeof p === 'string' && p.trim())
        : (project.imagePath ? [project.imagePath] : []);

      setExistingImages(urls.map((url, idx) => ({ url, path: paths[idx] || null })));
      setDeletedImagePaths([]);
      setNewImageItems((prev) => {
        for (const item of prev) {
          try {
            if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
          } catch {
            // ignore
          }
        }
        return [];
      });
    }
  }, [project]);

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
      setNewImageItems((prev) => [...prev, ...next]);
    }
  };

  const removeExistingAt = (index) => {
    setExistingImages((prev) => {
      const item = prev[index];
      if (item?.path) {
        setDeletedImagePaths((p) => [...p, item.path]);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeNewAt = (index) => {
    setNewImageItems((prev) => {
      const item = prev[index];
      try {
        if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      } catch {
        // ignore
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const previewUrl = useMemo(() => {
    const firstExisting = existingImages?.[0]?.url;
    const firstNew = newImageItems?.[0]?.previewUrl;
    return firstNew || firstExisting || project?.imageUrl || null;
  }, [existingImages, newImageItems, project?.imageUrl]);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!project?.id) return;

    try {
      setSaving(true);
      setError(null);

      const changes = [];
      if (form.name !== project.name) changes.push(`${t('projectEdit.timeline.nameChange')}: "${project.name}" → "${form.name}"`);
      if ((form.description || '') !== (project.description || '')) changes.push(t('projectEdit.timeline.subtitleUpdated'));
      if ((form.body || '') !== (project.body || '')) changes.push(t('projectEdit.timeline.descriptionUpdated'));
      if (form.category !== project.category) changes.push(`${t('projectEdit.timeline.categoryChange')}: "${project.category || 'N/A'}" → "${form.category}"`);
      if (Number(form.expectedROI) !== Number(project.expectedROI)) changes.push(`${t('projectEdit.timeline.roiChange')}: ${project.expectedROI}% → ${form.expectedROI}%`);
      if (Number(form.duration) !== Number(project.duration)) changes.push(`${t('projectEdit.timeline.durationChange')}: ${project.duration} → ${form.duration} ${t('projectEdit.months')}`);
      if (project.type === 'variable') {
        if (Number(form.drawdown) !== Number(project.drawdown)) changes.push(`${t('projectEdit.timeline.drawdownChange')}: ${project.drawdown}% → ${form.drawdown}%`);
        if (Number(form.performance) !== Number(project.performance)) changes.push(`${t('projectEdit.timeline.performanceChange')}: ${project.performance}% → ${form.performance}%`);
      }

      const payload = {
        name: form.name,
        // Subtitle (shown on cards)
        description: form.description?.trim() ? form.description.trim() : null,
        // Long description (shown only on detail)
        body: form.body?.trim() ? form.body.trim() : null,
        category: form.category || null,
        expectedROI: form.expectedROI ? Number(form.expectedROI) : null,
        duration: form.duration ? Number(form.duration) : null,
        updatedAt: serverTimestamp(),
      };

      if (project.type === 'variable') {
        payload.drawdown = form.drawdown ? Number(form.drawdown) : null;
        payload.performance = form.performance ? Number(form.performance) : null;
      }

      // Handle image deletions (best-effort)
      if (deletedImagePaths.length > 0) {
        for (const path of deletedImagePaths) {
          try {
            await deleteObject(ref(storage, path));
          } catch {
            // ignore
          }
        }
        changes.push(`${t('projectEdit.timeline.imagesDeleted')} (${deletedImagePaths.length})`);
      }

      // Upload new images
      const uploaded = [];
      if (newImageItems.length > 0) {
        for (const item of newImageItems) {
          const file = item?.file;
          if (!file) continue;

          const safeName = String(file.name || 'image')
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .slice(0, 80);
          const storagePath = `projects/${project.id}/images/${Date.now()}_${safeName}`;
          const storageRef = ref(storage, storagePath);

          await uploadBytes(storageRef, file, {
            contentType: file.type || 'image/*',
          });
          const url = await getDownloadURL(storageRef);
          uploaded.push({ url, path: storagePath });
        }

        if (uploaded.length > 0) {
          changes.push(`${t('projectEdit.timeline.imagesAdded')} (${uploaded.length})`);
        }
      }

      const finalImages = [
        ...existingImages.map((x) => x.url).filter(Boolean),
        ...uploaded.map((x) => x.url).filter(Boolean),
      ];
      const finalPaths = [
        ...existingImages.map((x) => x.path).filter(Boolean),
        ...uploaded.map((x) => x.path).filter(Boolean),
      ];

      // Keep both new and legacy fields for compatibility
      payload.images = finalImages;
      payload.imagePaths = finalPaths;
      payload.imageUrl = finalImages[0] || null;
      payload.imagePath = finalPaths[0] || null;
      payload.imageUpdatedAt = serverTimestamp();

      await updateDoc(doc(db, 'projects', project.id), payload);

      // Registrar en timeline si hay cambios relevantes
      if (changes.length > 0 && onTimelineEvent) {
        try {
          await onTimelineEvent({
            type: 'system',
            title: t('projectEdit.timeline.projectUpdated'),
            description: `${t('projectEdit.timeline.fieldsEdited')}\n${changes.join('\n')}`,
            visibility: 'admin',
            metadata: { changes },
          });
        } catch (timelineErr) {
          // No bloquear el guardado del proyecto si el timeline falla por reglas.
          console.warn('No se pudo registrar evento en timeline:', timelineErr);
        }
      }

      // Success alert
      await Swal.fire({
        title: t('projectEdit.alerts.successTitle'),
        text: t('projectEdit.alerts.successText'),
        icon: 'success',
        confirmButtonColor: '#10b981',
        background: '#1a1f2e',
        color: '#ffffff',
        timer: 2000,
        timerProgressBar: true,
        customClass: {
          popup: 'swal-dark-popup',
          container: 'swal-above-modal',
        }
      });

      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error('Error actualizando proyecto:', err);
      
      await Swal.fire({
        title: t('projectEdit.alerts.errorTitle'),
        text: err?.code === 'permission-denied' 
          ? t('projectEdit.alerts.permissionDenied')
          : t('projectEdit.alerts.updateFailed'),
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

  if (!isOpen || !project) return null;

  return (
    <div className="edit-modal-overlay" onClick={handleClose}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <h2>✏️ {t('projectEdit.title')}</h2>
            <p className="modal-subtitle">{t('projectEdit.subtitle')}</p>
          </div>
          <button className="close-btn" onClick={handleClose} aria-label={t('common.close')}>✕</button>
        </div>

        {/* Form */}
        <form className="modal-form" onSubmit={handleSubmit}>
          {/* Imágenes */}
          <div className="form-section">
            <h3 className="section-title">🖼️ {t('projectEdit.images')}</h3>

            <div className="form-field">
              <label htmlFor="project-images">{t('projectEdit.addImages')}</label>
              <input
                id="project-images"
                type="file"
                className="form-input"
                accept="image/*"
                multiple
                onChange={(e) => {
                  addImagesFromFiles(e.target.files);
                  e.target.value = '';
                }}
              />
              <div className="edit-modal-hint">{t('projectEdit.imageHint')}</div>
            </div>

            {(existingImages.length > 0 || newImageItems.length > 0) && (
              <div className="edit-modal-images" aria-label="Carrusel de imágenes">
                <Swiper
                  modules={[FreeMode]}
                  freeMode
                  slidesPerView="auto"
                  spaceBetween={12}
                  className="edit-modal-images-swiper"
                >
                  {existingImages.map((img, idx) => (
                    <SwiperSlide key={`existing-${idx}`} className="edit-modal-images-slide">
                      <div className="edit-modal-thumb">
                        <img src={img.url} alt={`Imagen existente ${idx + 1}`} loading="lazy" />
                        <button
                          type="button"
                          className="edit-modal-thumb-remove"
                          onClick={() => removeExistingAt(idx)}
                          aria-label="Eliminar imagen"
                        >
                          ✕
                        </button>
                      </div>
                    </SwiperSlide>
                  ))}

                  {newImageItems.map((item, idx) => (
                    <SwiperSlide key={`new-${idx}`} className="edit-modal-images-slide">
                      <div className="edit-modal-thumb">
                        <img src={item.previewUrl} alt={`Nueva imagen ${idx + 1}`} loading="lazy" />
                        <button
                          type="button"
                          className="edit-modal-thumb-remove"
                          onClick={() => removeNewAt(idx)}
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

          {/* Información General */}
          <div className="form-section">
            <h3 className="section-title">📋 {t('projectEdit.generalInfo')}</h3>
            
            <div className="form-field">
              <label htmlFor="project-name">
                {t('projectEdit.projectName')} <span className="required">*</span>
              </label>
              <input
                id="project-name"
                type="text"
                className="form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t('projectEdit.projectNamePlaceholder')}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="project-subtitle">{t('projectEdit.subtitleLabel')}</label>
              <input
                id="project-subtitle"
                type="text"
                className="form-input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t('projectEdit.subtitlePlaceholder')}
              />
            </div>

            <div className="form-field">
              <label htmlFor="project-body">{t('projectEdit.longDescription')}</label>
              <textarea
                id="project-body"
                className="form-input"
                rows={6}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder={t('projectEdit.longDescriptionPlaceholder')}
              />
            </div>

            <div className="form-field">
              <label htmlFor="project-category">{t('projectEdit.category')}</label>
              <input
                id="project-category"
                type="text"
                className="form-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder={t('projectEdit.categoryPlaceholder')}
              />
            </div>
          </div>

          {/* Métricas Financieras */}
          <div className="form-section">
            <h3 className="section-title">💰 {t('projectEdit.financialMetrics')}</h3>
            
            <div className="form-row-2">
              <div className="form-field">
                <label htmlFor="project-roi">{t('projectEdit.expectedROI')}</label>
                <div className="input-with-icon">
                  <input
                    id="project-roi"
                    type="number"
                    className="form-input"
                    step="0.01"
                    value={form.expectedROI}
                    onChange={(e) => setForm({ ...form, expectedROI: e.target.value })}
                    placeholder="0.00"
                  />
                  <span className="input-icon">%</span>
                </div>
              </div>
              
              <div className="form-field">
                <label htmlFor="project-duration">{t('projectEdit.duration')}</label>
                <div className="input-with-icon">
                  <input
                    id="project-duration"
                    type="number"
                    className="form-input"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="12"
                  />
                  <span className="input-icon">{t('projectEdit.months')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Métricas Variables (solo para tipo variable) */}
          {project.type === 'variable' && (
            <div className="form-section variable-section">
              <h3 className="section-title">📊 {t('projectEdit.variableMetrics')}</h3>
              
              <div className="form-row-2">
                <div className="form-field">
                  <label htmlFor="project-drawdown">{t('projectEdit.drawdown')}</label>
                  <div className="input-with-icon">
                    <input
                      id="project-drawdown"
                      type="number"
                      className="form-input"
                      step="0.01"
                      value={form.drawdown}
                      onChange={(e) => setForm({ ...form, drawdown: e.target.value })}
                      placeholder="0.00"
                    />
                    <span className="input-icon negative">%</span>
                  </div>
                </div>
                
                <div className="form-field">
                  <label htmlFor="project-performance">{t('projectEdit.performance')}</label>
                  <div className="input-with-icon">
                    <input
                      id="project-performance"
                      type="number"
                      className="form-input"
                      step="0.01"
                      value={form.performance}
                      onChange={(e) => setForm({ ...form, performance: e.target.value })}
                      placeholder="0.00"
                    />
                    <span className="input-icon positive">%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="info-box">
            <div className="info-icon">ℹ️</div>
            <div className="info-content">
              <strong>{t('projectEdit.nonEditableFields')}</strong>
              <p>{t('projectEdit.nonEditableDesc')}</p>
              <p className="info-note">{t('projectEdit.nonEditableNote')}</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="form-error">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="modal-actions">
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={handleClose} 
              disabled={saving}
            >
              {t('common.cancel')}
            </button>
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner"></span>
                  {t('projectForm.saving')}
                </>
              ) : (
                <>
                  <span>💾</span>
                  {t('projectEdit.saveChanges')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
