import React, { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import './ProjectEditModal.css';

export default function ProjectEditModal({ project, isOpen, onClose, onSuccess, onTimelineEvent }) {
  const [form, setForm] = useState({
    name: project?.name || '',
    category: project?.category || '',
    expectedROI: project?.expectedROI || '',
    duration: project?.duration || '',
    drawdown: project?.drawdown || '',
    performance: project?.performance || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (project) {
      setForm({
        name: project.name || '',
        category: project.category || '',
        expectedROI: project.expectedROI || '',
        duration: project.duration || '',
        drawdown: project.drawdown || '',
        performance: project.performance || '',
      });
    }
  }, [project]);

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
      if (form.category !== project.category) changes.push(`Categoría: "${project.category || 'N/A'}" → "${form.category}"`);
      if (Number(form.expectedROI) !== Number(project.expectedROI)) changes.push(`ROI esperado: ${project.expectedROI}% → ${form.expectedROI}%`);
      if (Number(form.duration) !== Number(project.duration)) changes.push(`Duración: ${project.duration} → ${form.duration} meses`);
      if (project.type === 'variable') {
        if (Number(form.drawdown) !== Number(project.drawdown)) changes.push(`Drawdown: ${project.drawdown}% → ${form.drawdown}%`);
        if (Number(form.performance) !== Number(project.performance)) changes.push(`Performance: ${project.performance}% → ${form.performance}%`);
      }

      const payload = {
        name: form.name,
        category: form.category || null,
        expectedROI: form.expectedROI ? Number(form.expectedROI) : null,
        duration: form.duration ? Number(form.duration) : null,
        updatedAt: serverTimestamp(),
      };

      if (project.type === 'variable') {
        payload.drawdown = form.drawdown ? Number(form.drawdown) : null;
        payload.performance = form.performance ? Number(form.performance) : null;
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
