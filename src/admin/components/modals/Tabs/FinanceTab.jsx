import React from 'react';

export default function FinanceTab({ form, updateField }) {
  return (
    <div className="tab-content-section">
      <h3 className="section-title">💰 Finanzas</h3>

      <div className="form-row-2">
        <div className="form-field">
          <label>Capital Objetivo (USD)</label>
          <div className="input-with-icon">
            <span className="input-prefix">$</span>
            <input
              type="number"
              className="form-input with-prefix"
              value={form.finance.targetAmount}
              onChange={(e) => updateField('finance', 'targetAmount', e.target.value)}
              placeholder="1,000,000"
            />
          </div>
        </div>

        <div className="form-field">
          <label>Capital Mínimo Viable (USD)</label>
          <div className="input-with-icon">
            <span className="input-prefix">$</span>
            <input
              type="number"
              className="form-input with-prefix"
              value={form.finance.minViableCapital}
              onChange={(e) => updateField('finance', 'minViableCapital', e.target.value)}
              placeholder="500,000"
            />
          </div>
        </div>
      </div>

      <div className="form-row-2">
        <div className="form-field">
          <label>CapEx Inicial (USD)</label>
          <div className="input-with-icon">
            <span className="input-prefix">$</span>
            <input
              type="number"
              className="form-input with-prefix"
              value={form.finance.initialCapex}
              onChange={(e) => updateField('finance', 'initialCapex', e.target.value)}
              placeholder="200,000"
            />
          </div>
        </div>

        <div className="form-field">
          <label>Coste Operativo Mensual (USD)</label>
          <div className="input-with-icon">
            <span className="input-prefix">$</span>
            <input
              type="number"
              className="form-input with-prefix"
              value={form.finance.monthlyOperatingCost}
              onChange={(e) => updateField('finance', 'monthlyOperatingCost', e.target.value)}
              placeholder="15,000"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
