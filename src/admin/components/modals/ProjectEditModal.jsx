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
        await onTimelineEvent({
          type: 'system',
          title: 'Proyecto actualizado',
          description: `Se editaron los siguientes campos:\n${changes.join('\n')}`,
          visibility: 'admin',
          metadata: { changes },
        });
      }

      onSuccess?.();
      handleClose();
    } catch (err) {
      console.error('Error actualizando proyecto:', err);
      setError('No se pudo actualizar el proyecto');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !project) return null;

  return (
    <div className="edit-modal-overlay" onClick={handleClose}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar Proyecto</h2>
          <button className="close-btn" onClick={handleClose}>✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label>
            Nombre del proyecto
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>

          <label>
            Categoría
            <input
              type="text"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Energía, Trading, Crypto"
            />
          </label>

          <div className="form-row-2">
            <label>
              ROI esperado (%)
              <input
                type="number"
                step="0.01"
                value={form.expectedROI}
                onChange={(e) => setForm({ ...form, expectedROI: e.target.value })}
              />
            </label>
            <label>
              Duración (meses)
              <input
                type="number"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
              />
            </label>
          </div>

          {project.type === 'variable' && (
            <div className="form-section">
              <h3>Métricas Variables</h3>
              <div className="form-row-2">
                <label>
                  Drawdown (%)
                  <input
                    type="number"
                    step="0.01"
                    value={form.drawdown}
                    onChange={(e) => setForm({ ...form, drawdown: e.target.value })}
                  />
                </label>
                <label>
                  Performance (%)
                  <input
                    type="number"
                    step="0.01"
                    value={form.performance}
                    onChange={(e) => setForm({ ...form, performance: e.target.value })}
                  />
                </label>
              </div>
            </div>
          )}

          <div className="info-box">
            <strong>Campos no editables:</strong> Tipo, Riesgo, Target, Estado.
            Para cambios críticos, contacta al administrador del sistema.
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={handleClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="submit-btn" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
