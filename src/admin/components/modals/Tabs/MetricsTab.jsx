import React from 'react';

export default function MetricsTab({ form, updateField }) {
  return (
    <div className="tab-content-section">
      <h3 className="section-title">📈 Retorno & Métricas</h3>

      <div className="form-row-2">
        <div className="form-field">
          <label>ROI Anual Esperado (%)</label>
          <div className="input-with-icon">
            <input
              type="number"
              className="form-input"
              step="0.01"
              value={form.metrics.expectedROI}
              onChange={(e) => updateField('metrics', 'expectedROI', e.target.value)}
              placeholder="12.5"
            />
            <span className="input-suffix">%</span>
          </div>
        </div>

        <div className="form-field">
          <label>ROI Total Estimado (%)</label>
          <div className="input-with-icon">
            <input
              type="number"
              className="form-input"
              step="0.01"
              value={form.metrics.totalROI}
              onChange={(e) => updateField('metrics', 'totalROI', e.target.value)}
              placeholder="25"
            />
            <span className="input-suffix">%</span>
          </div>
        </div>
      </div>

      <div className="form-row-2">
        <div className="form-field">
          <label>Duración (meses)</label>
          <div className="input-with-icon">
            <input
              type="number"
              className="form-input"
              value={form.metrics.duration}
              onChange={(e) => updateField('metrics', 'duration', e.target.value)}
              placeholder="24"
            />
            <span className="input-suffix">meses</span>
          </div>
        </div>

        <div className="form-field">
          <label>Periodicidad de Pagos</label>
          <select
            className="form-input"
            value={form.metrics.paymentFrequency}
            onChange={(e) => updateField('metrics', 'paymentFrequency', e.target.value)}
          >
            <option value="monthly">Mensual</option>
            <option value="quarterly">Trimestral</option>
            <option value="end">Al final</option>
          </select>
        </div>
      </div>

      <div className="form-row-2">
        <div className="form-field">
          <label>IRR Estimada (%)</label>
          <div className="input-with-icon">
            <input
              type="number"
              className="form-input"
              step="0.01"
              value={form.metrics.estimatedIRR}
              onChange={(e) => updateField('metrics', 'estimatedIRR', e.target.value)}
              placeholder="15"
            />
            <span className="input-suffix">%</span>
          </div>
        </div>

        <div className="form-field">
          <label>Payback (meses)</label>
          <div className="input-with-icon">
            <input
              type="number"
              className="form-input"
              value={form.metrics.paybackPeriod}
              onChange={(e) => updateField('metrics', 'paybackPeriod', e.target.value)}
              placeholder="18"
            />
            <span className="input-suffix">meses</span>
          </div>
        </div>
      </div>
    </div>
  );
}
