import React, { useEffect, useMemo, useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes, deleteObject } from 'firebase/storage';
import { db, storage } from '../../../firebase/firebaseConfig';
import './ProjectEditModal.css';

export default function ProjectEditModal({ project, isOpen, onClose, onSuccess, onTimelineEvent }) {
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
  const [imageFile, setImageFile] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState(null);
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
      setImageFile(null);
      setLocalPreviewUrl(null);
    }
  }, [project]);

  useEffect(() => {
    if (!imageFile) {
      setLocalPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setLocalPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  const previewUrl = useMemo(() => {
    return localPreviewUrl || project?.imageUrl || null;
  }, [localPreviewUrl, project?.imageUrl]);

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
      if (form.name !== project.name) changes.push(`Nombre: "${project.name}" → "${form.name}"`);
      if ((form.description || '') !== (project.description || '')) changes.push('Subtítulo: actualizado');
      if ((form.body || '') !== (project.body || '')) changes.push('Descripción extensa: actualizada');
      if (form.category !== project.category) changes.push(`Categoría: "${project.category || 'N/A'}" → "${form.category}"`);
      if (Number(form.expectedROI) !== Number(project.expectedROI)) changes.push(`ROI esperado: ${project.expectedROI}% → ${form.expectedROI}%`);
      if (Number(form.duration) !== Number(project.duration)) changes.push(`Duración: ${project.duration} → ${form.duration} meses`);
      if (project.type === 'variable') {
        if (Number(form.drawdown) !== Number(project.drawdown)) changes.push(`Drawdown: ${project.drawdown}% → ${form.drawdown}%`);
        if (Number(form.performance) !== Number(project.performance)) changes.push(`Performance: ${project.performance}% → ${form.performance}%`);
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

      // Optional: upload a new project image and store it in Firestore
      if (imageFile) {
        const maxBytes = 5 * 1024 * 1024;
        if (!String(imageFile.type || '').startsWith('image/')) {
          throw new Error('La imagen debe ser un archivo de tipo imagen (image/*)');
        }
        if (imageFile.size > maxBytes) {
          throw new Error('La imagen excede el tamaño máximo permitido (5MB)');
        }

        const safeName = String(imageFile.name || 'image')
          .replace(/[^a-zA-Z0-9._-]/g, '_')
          .slice(0, 80);
        const storagePath = `projects/${project.id}/images/${Date.now()}_${safeName}`;
        const storageRef = ref(storage, storagePath);

        await uploadBytes(storageRef, imageFile, {
          contentType: imageFile.type || 'image/*',
        });
        const imageUrl = await getDownloadURL(storageRef);

        payload.imageUrl = imageUrl;
        payload.imagePath = storagePath;
        payload.imageUpdatedAt = serverTimestamp();

        if (!project.imageUrl) {
          changes.push('Imagen: agregada');
        } else {
          changes.push('Imagen: actualizada');
        }

        // Best-effort cleanup of previous image
        if (project.imagePath && project.imagePath !== storagePath) {
          try {
            await deleteObject(ref(storage, project.imagePath));
          } catch (cleanupErr) {
            // ignore
          }
        }
      }

      await updateDoc(doc(db, 'projects', project.id), payload);

      // Registrar en timeline si hay cambios relevantes
      if (changes.length > 0 && onTimelineEvent) {
        try {
          await onTimelineEvent({
            type: 'system',
            title: 'Proyecto actualizado',
            description: `Se editaron los siguientes campos:\n${changes.join('\n')}`,
            visibility: 'admin',
            metadata: { changes },
          });
        } catch (timelineErr) {
          // No bloquear el guardado del proyecto si el timeline falla por reglas.
          console.warn('No se pudo registrar evento en timeline:', timelineErr);
        }
      }

      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error('Error actualizando proyecto:', err);
      if (err?.code === 'permission-denied') {
        setError('Permisos insuficientes para actualizar el proyecto');
      } else {
        setError('No se pudo actualizar el proyecto');
      }
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
            <h2>✏️ Editar Proyecto</h2>
            <p className="modal-subtitle">Actualiza la información del proyecto</p>
          </div>
          <button className="close-btn" onClick={handleClose} aria-label="Cerrar">✕</button>
        </div>

        {/* Form */}
        <form className="modal-form" onSubmit={handleSubmit}>
          {/* Información General */}
          <div className="form-section">
            <h3 className="section-title">📋 Información General</h3>
            
            <div className="form-field">
              <label htmlFor="project-name">
                Nombre del proyecto <span className="required">*</span>
              </label>
              <input
                id="project-name"
                type="text"
                className="form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Proyecto Solar Valle Verde"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="project-subtitle">Subtítulo (descripción breve)</label>
              <input
                id="project-subtitle"
                type="text"
                className="form-input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ej: Inversión a 12 meses con retorno estimado"
              />
            </div>

            <div className="form-field">
              <label htmlFor="project-body">Descripción extensa (se muestra solo en detalles)</label>
              <textarea
                id="project-body"
                className="form-input"
                rows={6}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Describe el proyecto con más detalle..."
              />
            </div>

            <div className="form-field">
              <label htmlFor="project-category">Categoría</label>
              <input
                id="project-category"
                type="text"
                className="form-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Ej: Energía Renovable, Trading, Crypto"
              />
            </div>
          </div>

          {/* Métricas Financieras */}
          <div className="form-section">
            <h3 className="section-title">💰 Métricas Financieras</h3>
            
            <div className="form-row-2">
              <div className="form-field">
                <label htmlFor="project-roi">ROI esperado (%)</label>
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
                <label htmlFor="project-duration">Duración (meses)</label>
                <div className="input-with-icon">
                  <input
                    id="project-duration"
                    type="number"
                    className="form-input"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="12"
                  />
                  <span className="input-icon">meses</span>
                </div>
              </div>
            </div>
          </div>

          {/* Métricas Variables (solo para tipo variable) */}
          {project.type === 'variable' && (
            <div className="form-section variable-section">
              <h3 className="section-title">📊 Métricas Variables</h3>
              
              <div className="form-row-2">
                <div className="form-field">
                  <label htmlFor="project-drawdown">Drawdown (%)</label>
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
                  <label htmlFor="project-performance">Performance (%)</label>
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
              <strong>Campos no editables:</strong>
              <p>Tipo de proyecto, Nivel de riesgo, Capital objetivo y Estado computado.</p>
              <p className="info-note">Para cambios críticos en estos campos, contacta al administrador del sistema.</p>
            </div>
          </div>

          {/* Imagen del proyecto */}
          <div className="form-section">
            <h3 className="section-title">🖼️ Imagen del Proyecto</h3>
            {previewUrl && (
              <div style={{ marginBottom: '0.75rem' }}>
                <img
                  src={previewUrl}
                  alt="Imagen del proyecto"
                  style={{
                    width: '100%',
                    maxHeight: '240px',
                    objectFit: 'cover',
                    borderRadius: '0.7rem',
                    border: '1px solid var(--border-color)'
                  }}
                />
              </div>
            )}
            <div className="form-field">
              <label htmlFor="project-image">Seleccionar imagen</label>
              <input
                id="project-image"
                type="file"
                className="form-input"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setImageFile(file);
                }}
              />
              <p className="info-note">Recomendado: imagen horizontal. Máximo 5MB.</p>
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
              Cancelar
            </button>
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner"></span>
                  Guardando...
                </>
              ) : (
                <>
                  <span>💾</span>
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
