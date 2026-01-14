import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import './ProjectFormModal.css';

export default function ProjectFormModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '',
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

  const resetForm = () => {
    setForm({
      name: '',
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
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      setError('El nombre es obligatorio');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const isFixed = form.type === 'fixed';
      const payload = {
        name: form.name,
        type: form.type,
        category: form.category || null,
        riskLevel: form.riskLevel || 'medium',
        expectedROI: form.expectedROI ? Number(form.expectedROI) : null,
        duration: form.durationMonths ? Number(form.durationMonths) : null,
        status: 'draft',
        targetAmount: isFixed ? (form.targetAmount ? Number(form.targetAmount) : null) : null,
        totalInvested: 0,
        minInvestment: isFixed && form.minInvestment ? Number(form.minInvestment) : null,
        maxInvestment: isFixed && form.maxInvestment ? Number(form.maxInvestment) : null,
        autoLockOnTarget: isFixed ? true : null,
        drawdown: !isFixed && form.drawdown ? Number(form.drawdown) : null,
        performance: !isFixed && form.performance ? Number(form.performance) : null,
        manualControl: form.manualControl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'projects'), payload);
      resetForm();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error creando proyecto', err);
      setError('No se pudo crear el proyecto');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="project-modal-overlay" onClick={handleClose}>
      <div className="project-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Crear Proyecto Financiero</h2>
          <button className="close-btn" onClick={handleClose}>✕</button>
        </div>
        
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              Nombre del proyecto *
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Fondo Deuda MXN 12%"
                required
              />
            </label>
          </div>

          <div className="form-row form-row-2">
            <label>
              Tipo de proyecto *
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="fixed">Fijo (meta de capital)</option>
                <option value="variable">Variable (trading/crypto)</option>
              </select>
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
          </div>

          <div className="form-row form-row-3">
            <label>
              Nivel de riesgo *
              <select
                value={form.riskLevel}
                onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}
              >
                <option value="low">Bajo</option>
                <option value="medium">Medio</option>
                <option value="high">Alto</option>
              </select>
            </label>
            <label>
              ROI esperado (%)
              <input
                type="number"
                step="0.01"
                value={form.expectedROI}
                onChange={(e) => setForm({ ...form, expectedROI: e.target.value })}
                placeholder="12"
              />
            </label>
            <label>
              Duración (meses)
              <input
                type="number"
                value={form.durationMonths}
                onChange={(e) => setForm({ ...form, durationMonths: e.target.value })}
                placeholder="12"
              />
            </label>
          </div>

          {form.type === 'fixed' && (
            <div className="form-section">
              <h3>Configuración de Proyecto Fijo</h3>
              <div className="form-row form-row-3">
                <label>
                  Capital objetivo (MXN)
                  <input
                    type="number"
                    value={form.targetAmount}
                    onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                    placeholder="500000"
                  />
                </label>
                <label>
                  Inversión mínima (MXN)
                  <input
                    type="number"
                    value={form.minInvestment}
                    onChange={(e) => setForm({ ...form, minInvestment: e.target.value })}
                    placeholder="1000"
                  />
                </label>
                <label>
                  Inversión máxima (MXN)
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
            <div className="form-section">
              <h3>Métricas de Proyecto Variable</h3>
              <div className="form-row form-row-2">
                <label>
                  Drawdown (%)
                  <input
                    type="number"
                    step="0.01"
                    value={form.drawdown}
                    onChange={(e) => setForm({ ...form, drawdown: e.target.value })}
                    placeholder="-5"
                  />
                </label>
                <label>
                  Performance (%)
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
                Control manual del estado (permite pausar/reanudar)
              </label>
            </div>
          )}

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={handleClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="submit-btn" disabled={saving}>
              {saving ? 'Guardando...' : 'Crear proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
