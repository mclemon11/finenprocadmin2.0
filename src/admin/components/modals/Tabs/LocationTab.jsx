import React from 'react';

export default function LocationTab({ form, updateField }) {
  const assetTypes = [
    { value: '', label: 'Seleccionar...' },
    { value: 'oil_gas', label: 'Petróleo / Gas' },
    { value: 'energy', label: 'Energía' },
    { value: 'mining', label: 'Minería' },
    { value: 'real_estate', label: 'Inmobiliario' },
    { value: 'infrastructure', label: 'Infraestructura' },
  ];

  return (
    <div className="tab-content-section">
      <h3 className="section-title"> Ubicación & Activo</h3>

      <div className="form-row-2">
        <div className="form-field">
          <label>País</label>
          <input
            type="text"
            className="form-input"
            value={form.location.country}
            onChange={(e) => updateField('location', 'country', e.target.value)}
            placeholder="Ej: México"
          />
        </div>

        <div className="form-field">
          <label>Región / Estado</label>
          <input
            type="text"
            className="form-input"
            value={form.location.region}
            onChange={(e) => updateField('location', 'region', e.target.value)}
            placeholder="Ej: Nuevo León"
          />
        </div>
      </div>

      <div className="form-field">
        <label>Ciudad / Zona</label>
        <input
          type="text"
          className="form-input"
          value={form.location.city}
          onChange={(e) => updateField('location', 'city', e.target.value)}
          placeholder="Ej: Monterrey"
        />
      </div>

      <div className="form-field">
        <label>Tipo de Activo</label>
        <select
          className="form-input"
          value={form.location.assetType}
          onChange={(e) => updateField('location', 'assetType', e.target.value)}
        >
          {assetTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label>Operador del Proyecto</label>
        <input
          type="text"
          className="form-input"
          value={form.location.operator}
          onChange={(e) => updateField('location', 'operator', e.target.value)}
          placeholder="Nombre de la empresa operadora"
        />
      </div>
    </div>
  );
}
