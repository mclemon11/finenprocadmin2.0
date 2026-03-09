import React from 'react';

export default function RisksTab({ form, updateField }) {
  return (
    <div className="tab-content-section">
      <h3 className="section-title"> Riesgos & Garantías</h3>

      <div className="form-row-2">
        <div className="form-field">
          <label>Nivel de Riesgo</label>
          <select
            className="form-input"
            value={form.risk.riskLevel}
            onChange={(e) => updateField('risk', 'riskLevel', e.target.value)}
          >
            <option value="low">Bajo</option>
            <option value="medium">🟡 Medio</option>
            <option value="high"> Alto</option>
          </select>
        </div>

        <div className="form-field">
          <label>Puntuación de Riesgo (1-5)</label>
          <input
            type="number"
            className="form-input"
            min="1"
            max="5"
            value={form.risk.riskScore}
            onChange={(e) => updateField('risk', 'riskScore', Number(e.target.value))}
            placeholder="3"
          />
        </div>
      </div>

      <div className="checkbox-group">
        <div className="form-field checkbox-field">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.risk.countryRisk}
              onChange={(e) => updateField('risk', 'countryRisk', e.target.checked)}
            />
            <span className="checkbox-text">Riesgo país</span>
          </label>
        </div>

        <div className="form-field checkbox-field">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.risk.regulatoryRisk}
              onChange={(e) => updateField('risk', 'regulatoryRisk', e.target.checked)}
            />
            <span className="checkbox-text">Riesgo regulatorio</span>
          </label>
        </div>

        <div className="form-field checkbox-field">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.risk.hasGuarantee}
              onChange={(e) => updateField('risk', 'hasGuarantee', e.target.checked)}
            />
            <span className="checkbox-text">Tiene garantía</span>
          </label>
        </div>
      </div>

      {form.risk.hasGuarantee && (
        <div className="guarantee-fields">
          <div className="form-field">
            <label>Tipo de Garantía</label>
            <input
              type="text"
              className="form-input"
              value={form.risk.guaranteeType}
              onChange={(e) => updateField('risk', 'guaranteeType', e.target.value)}
              placeholder="Ej: Hipoteca, Prenda, Fianza"
            />
          </div>

          <div className="form-field">
            <label>Valor Estimado de la Garantía (USD)</label>
            <div className="input-with-icon">
              <span className="input-prefix">$</span>
              <input
                type="number"
                className="form-input with-prefix"
                value={form.risk.guaranteeValue}
                onChange={(e) => updateField('risk', 'guaranteeValue', e.target.value)}
                placeholder="500,000"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
