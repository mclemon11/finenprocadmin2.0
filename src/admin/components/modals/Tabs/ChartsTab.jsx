import React from 'react';

export default function ChartsTab({ form, setForm, updateField }) {
  // Handle capital distribution
  const handleDistributionChange = (key, value) => {
    const numValue = Number(value) || 0;
    setForm((prev) => ({
      ...prev,
      charts: {
        ...prev.charts,
        capitalDistribution: {
          ...prev.charts.capitalDistribution,
          [key]: numValue,
        },
      },
    }));
  };

  // Calculate distribution total
  const distributionTotal = Object.values(form.charts.capitalDistribution || {}).reduce(
    (a, b) => a + (Number(b) || 0),
    0
  );

  // Handle payment calendar
  const addPayment = () => {
    const newPayment = {
      id: Date.now(),
      month: '',
      year: new Date().getFullYear(),
      percent: '',
      status: 'estimated',
    };
    setForm((prev) => ({
      ...prev,
      charts: {
        ...prev.charts,
        paymentCalendar: [...(prev.charts.paymentCalendar || []), newPayment],
      },
    }));
  };

  const updatePayment = (id, field, value) => {
    setForm((prev) => ({
      ...prev,
      charts: {
        ...prev.charts,
        paymentCalendar: (prev.charts.paymentCalendar || []).map((p) =>
          p.id === id ? { ...p, [field]: value } : p
        ),
      },
    }));
  };

  const removePayment = (id) => {
    setForm((prev) => ({
      ...prev,
      charts: {
        ...prev.charts,
        paymentCalendar: (prev.charts.paymentCalendar || []).filter((p) => p.id !== id),
      },
    }));
  };

  return (
    <div className="tab-content-section charts-section">
      <h3 className="section-title">📉 Datos para Gráficas (Usuario)</h3>
      <p className="section-hint">Estos datos serán visibles para los usuarios en las gráficas del proyecto.</p>

      {/* Chart 1: Progress */}
      <div className="chart-config-card">
        <h4>📊 Gráfica 1 – Progreso del Proyecto</h4>
        <div className="form-row-3">
          <div className="form-field">
            <label>Capital Objetivo</label>
            <div className="input-with-icon">
              <span className="input-prefix">$</span>
              <input
                type="number"
                className="form-input with-prefix"
                value={form.charts.capitalObjetivo}
                onChange={(e) => updateField('charts', 'capitalObjetivo', e.target.value)}
              />
            </div>
          </div>
          <div className="form-field">
            <label>Capital Recaudado</label>
            <div className="input-with-icon">
              <span className="input-prefix">$</span>
              <input
                type="number"
                className="form-input with-prefix"
                value={form.charts.capitalRecaudado}
                onChange={(e) => updateField('charts', 'capitalRecaudado', e.target.value)}
              />
            </div>
          </div>
          <div className="form-field">
            <label>% Completado</label>
            <div className="input-with-icon">
              <input
                type="number"
                className="form-input"
                value={form.charts.porcentajeCompletado}
                onChange={(e) => updateField('charts', 'porcentajeCompletado', e.target.value)}
              />
              <span className="input-suffix">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart 2: ROI */}
      <div className="chart-config-card">
        <h4>📈 Gráfica 2 – Retorno Esperado</h4>
        <div className="form-row-3">
          <div className="form-field">
            <label>ROI Anual (%)</label>
            <div className="input-with-icon">
              <input
                type="number"
                className="form-input"
                step="0.01"
                value={form.charts.roiAnual}
                onChange={(e) => updateField('charts', 'roiAnual', e.target.value)}
              />
              <span className="input-suffix">%</span>
            </div>
          </div>
          <div className="form-field">
            <label>ROI Acumulado (%)</label>
            <div className="input-with-icon">
              <input
                type="number"
                className="form-input"
                step="0.01"
                value={form.charts.roiAcumulado}
                onChange={(e) => updateField('charts', 'roiAcumulado', e.target.value)}
              />
              <span className="input-suffix">%</span>
            </div>
          </div>
          <div className="form-field">
            <label>Duración (meses)</label>
            <input
              type="number"
              className="form-input"
              value={form.charts.duracionMeses}
              onChange={(e) => updateField('charts', 'duracionMeses', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Chart 3: Capital Distribution */}
      <div className="chart-config-card">
        <h4>🥧 Gráfica 3 – Distribución del Capital</h4>
        <p className="chart-hint">
          La suma debe ser 100%. Actual:{' '}
          <span className={distributionTotal === 100 ? 'valid' : 'invalid'}>{distributionTotal}%</span>
        </p>
        <div className="form-row-4">
          <div className="form-field">
            <label>Operación</label>
            <div className="input-with-icon">
              <input
                type="number"
                className="form-input"
                value={form.charts.capitalDistribution?.operacion || ''}
                onChange={(e) => handleDistributionChange('operacion', e.target.value)}
              />
              <span className="input-suffix">%</span>
            </div>
          </div>
          <div className="form-field">
            <label>Infraestructura</label>
            <div className="input-with-icon">
              <input
                type="number"
                className="form-input"
                value={form.charts.capitalDistribution?.infraestructura || ''}
                onChange={(e) => handleDistributionChange('infraestructura', e.target.value)}
              />
              <span className="input-suffix">%</span>
            </div>
          </div>
          <div className="form-field">
            <label>Reserva</label>
            <div className="input-with-icon">
              <input
                type="number"
                className="form-input"
                value={form.charts.capitalDistribution?.reserva || ''}
                onChange={(e) => handleDistributionChange('reserva', e.target.value)}
              />
              <span className="input-suffix">%</span>
            </div>
          </div>
          <div className="form-field">
            <label>Beneficio</label>
            <div className="input-with-icon">
              <input
                type="number"
                className="form-input"
                value={form.charts.capitalDistribution?.beneficio || ''}
                onChange={(e) => handleDistributionChange('beneficio', e.target.value)}
              />
              <span className="input-suffix">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart 4: Payment Calendar */}
      <div className="chart-config-card">
        <h4>📅 Gráfica 4 – Calendario de Pagos</h4>
        <div className="payment-calendar-list">
          {(form.charts.paymentCalendar || []).map((payment, idx) => (
            <div key={payment.id} className="payment-item">
              <span className="payment-index">#{idx + 1}</span>
              <select
                className="form-input payment-month"
                value={payment.month}
                onChange={(e) => updatePayment(payment.id, 'month', e.target.value)}
              >
                <option value="">Mes</option>
                {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((m, i) => (
                  <option key={i} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="form-input payment-year"
                value={payment.year}
                onChange={(e) => updatePayment(payment.id, 'year', e.target.value)}
                placeholder="Año"
              />
              <div className="input-with-icon payment-percent">
                <input
                  type="number"
                  className="form-input"
                  step="0.01"
                  value={payment.percent}
                  onChange={(e) => updatePayment(payment.id, 'percent', e.target.value)}
                  placeholder="% Retorno"
                />
                <span className="input-suffix">%</span>
              </div>
              <select
                className="form-input payment-status"
                value={payment.status}
                onChange={(e) => updatePayment(payment.id, 'status', e.target.value)}
              >
                <option value="estimated">📋 Estimado</option>
                <option value="paid">✅ Pagado</option>
              </select>
              <button
                type="button"
                className="remove-payment-btn"
                onClick={() => removePayment(payment.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="add-payment-btn" onClick={addPayment}>
          + Agregar pago
        </button>
      </div>

      {/* Chart 5: Risk vs Return */}
      <div className="chart-config-card">
        <h4>⚡ Gráfica 5 – Riesgo vs Retorno</h4>
        <div className="form-row-2">
          <div className="form-field">
            <label>Nivel de Riesgo (1-5)</label>
            <input
              type="range"
              min="1"
              max="5"
              value={form.charts.riskLevel || 3}
              onChange={(e) => updateField('charts', 'riskLevel', Number(e.target.value))}
              className="risk-slider"
            />
            <div className="risk-labels">
              <span>1 - Muy bajo</span>
              <span className="current-risk">Actual: {form.charts.riskLevel || 3}</span>
              <span>5 - Muy alto</span>
            </div>
          </div>
          <div className="form-field">
            <label>Retorno Esperado (%)</label>
            <div className="input-with-icon">
              <input
                type="number"
                className="form-input"
                step="0.01"
                value={form.charts.returnExpected}
                onChange={(e) => updateField('charts', 'returnExpected', e.target.value)}
              />
              <span className="input-suffix">%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
