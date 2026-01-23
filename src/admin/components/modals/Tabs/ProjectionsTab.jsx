import React from 'react';

export default function ProjectionsTab({ form, updateField }) {
  return (
    <div className="tab-content-section">
      <h3 className="section-title">📊 Proyección Financiera (Interno)</h3>
      <p className="section-hint">Esta información es solo para referencia interna del administrador.</p>

      <div className="form-row-2">
        <div className="form-field">
          <label>Ingresos Mensuales Estimados (USD)</label>
          <div className="input-with-icon">
            <span className="input-prefix">$</span>
            <input
              type="number"
              className="form-input with-prefix"
              value={form.projections.monthlyRevenue}
              onChange={(e) => updateField('projections', 'monthlyRevenue', e.target.value)}
              placeholder="50,000"
            />
          </div>
        </div>

        <div className="form-field">
          <label>Costes Mensuales Estimados (USD)</label>
          <div className="input-with-icon">
            <span className="input-prefix">$</span>
            <input
              type="number"
              className="form-input with-prefix"
              value={form.projections.monthlyCosts}
              onChange={(e) => updateField('projections', 'monthlyCosts', e.target.value)}
              placeholder="30,000"
            />
          </div>
        </div>
      </div>

      <div className="form-row-2">
        <div className="form-field">
          <label>Margen Operativo Esperado (%)</label>
          <div className="input-with-icon">
            <input
              type="number"
              className="form-input"
              step="0.01"
              value={form.projections.operatingMargin}
              onChange={(e) => updateField('projections', 'operatingMargin', e.target.value)}
              placeholder="40"
            />
            <span className="input-suffix">%</span>
          </div>
        </div>

        <div className="form-field">
          <label>Fondo de Contingencia (%)</label>
          <div className="input-with-icon">
            <input
              type="number"
              className="form-input"
              step="0.01"
              value={form.projections.contingencyFund}
              onChange={(e) => updateField('projections', 'contingencyFund', e.target.value)}
              placeholder="10"
            />
            <span className="input-suffix">%</span>
          </div>
        </div>
      </div>

      <div className="form-field">
        <label>Escenario</label>
        <select
          className="form-input"
          value={form.projections.scenario}
          onChange={(e) => updateField('projections', 'scenario', e.target.value)}
        >
          <option value="conservative">🔵 Conservador</option>
          <option value="base">🟢 Base</option>
          <option value="optimistic">🟡 Optimista</option>
        </select>
      </div>
    </div>
  );
}
