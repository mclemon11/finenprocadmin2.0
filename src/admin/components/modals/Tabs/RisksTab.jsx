import React from 'react';

export default function RisksTab({ form, updateField }) {
  return (
    <div className="tab-content-section">
      <h3 className="section-title">⚠️ Riesgos & Garantías</h3>

      <div className="form-field">
        <label>Nivel de Riesgo</label>
        <select
          className="form-input"
          value={form.risks.riskLevel}
          onChange={(e) => updateField('risks', 'riskLevel', e.target.value)}
        >
          <option value="low">🟢 Bajo</option>
          <option value="medium">🟡 Medio</option>
          <option value="high">🔴 Alto</option>
        </select>
      </div>

      <div className="checkbox-group">
        <div className="form-field checkbox-field">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.risks.countryRisk}
              onChange={(e) => updateField('risks', 'countryRisk', e.target.checked)}
            />
            <span className="checkbox-text">Riesgo país</span>
          </label>
        </div>

        <div className="form-field checkbox-field">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.risks.regulatoryRisk}
              onChange={(e) => updateField('risks', 'regulatoryRisk', e.target.checked)}
            />
            <span className="checkbox-text">Riesgo regulatorio</span>
          </label>
        </div>

        <div className="form-field checkbox-field">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.risks.hasGuarantee}
              onChange={(e) => updateField('risks', 'hasGuarantee', e.target.checked)}
            />
            <span className="checkbox-text">Tiene garantía</span>
          </label>
        </div>
      </div>

      {form.risks.hasGuarantee && (
        <div className="guarantee-fields">
          <div className="form-field">
            <label>Tipo de Garantía</label>
            <input
              type="text"
              className="form-input"
              value={form.risks.guaranteeType}
              onChange={(e) => updateField('risks', 'guaranteeType', e.target.value)}
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
                value={form.risks.guaranteeValue}
                onChange={(e) => updateField('risks', 'guaranteeValue', e.target.value)}
                placeholder="500,000"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
