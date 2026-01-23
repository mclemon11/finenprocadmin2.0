import React from 'react';

export default function RestrictionsTab({ form, updateField }) {
  return (
    <div className="tab-content-section">
      <h3 className="section-title">🚫 Restricciones</h3>

      <div className="form-row-2">
        <div className="form-field">
          <label>Inversión Mínima por Usuario (USD)</label>
          <div className="input-with-icon">
            <span className="input-prefix">$</span>
            <input
              type="number"
              className="form-input with-prefix"
              value={form.restrictions.minInvestment}
              onChange={(e) => updateField('restrictions', 'minInvestment', e.target.value)}
              placeholder="100"
            />
          </div>
        </div>

        <div className="form-field">
          <label>Inversión Máxima por Usuario (USD)</label>
          <div className="input-with-icon">
            <span className="input-prefix">$</span>
            <input
              type="number"
              className="form-input with-prefix"
              value={form.restrictions.maxInvestment}
              onChange={(e) => updateField('restrictions', 'maxInvestment', e.target.value)}
              placeholder="50,000"
            />
          </div>
        </div>
      </div>

      <div className="form-row-2">
        <div className="form-field">
          <label>Máximo % por Inversor</label>
          <div className="input-with-icon">
            <input
              type="number"
              className="form-input"
              step="0.01"
              max="100"
              value={form.restrictions.maxPercentPerInvestor}
              onChange={(e) => updateField('restrictions', 'maxPercentPerInvestor', e.target.value)}
              placeholder="10"
            />
            <span className="input-suffix">%</span>
          </div>
        </div>

        <div className="form-field">
          <label>Número Máximo de Inversores</label>
          <input
            type="number"
            className="form-input"
            value={form.restrictions.maxInvestors}
            onChange={(e) => updateField('restrictions', 'maxInvestors', e.target.value)}
            placeholder="100"
          />
        </div>
      </div>

      <div className="form-field checkbox-field">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={form.restrictions.kycRequired}
            onChange={(e) => updateField('restrictions', 'kycRequired', e.target.checked)}
          />
          <span className="checkbox-text">KYC requerido</span>
        </label>
      </div>
    </div>
  );
}
