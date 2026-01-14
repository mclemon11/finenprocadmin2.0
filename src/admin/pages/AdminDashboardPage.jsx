import React from 'react';
import { useNavigate } from 'react-router-dom';
import useDashboardKPIs from '../hooks/useDashboardKPIs';
import './AdminDashboardPage.css';

export default function AdminDashboardPage() {
  const { kpis, loading } = useDashboardKPIs();
  const navigate = useNavigate();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div>Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Panel de Administración</h1>
          <p className="dashboard-subtitle">Resumen general del sistema</p>
        </div>
        <div className="dashboard-meta">
          <span className="last-updated">Actualizado: Hoy</span>
        </div>
      </div>

      {/* SECCIÓN 1: USUARIOS */}
      <div className="kpi-section">
        <h2 className="section-title">👥 Usuarios</h2>
        <div className="kpi-grid kpi-grid-2">
          <div className="kpi-card">
            <div className="kpi-label">Usuarios Totales</div>
            <div className="kpi-value">{kpis.totalUsers}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Usuarios Activos</div>
            <div className="kpi-value" style={{ color: '#22c55e' }}>{kpis.activeUsers}</div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: RECARGAS */}
      <div className="kpi-section">
        <h2 className="section-title">💰 Recargas</h2>
        <div className="kpi-grid kpi-grid-3">
          <div className="kpi-card alert">
            <div className="kpi-label">Pendientes</div>
            <div className="kpi-value" style={{ color: '#f59e0b' }}>{kpis.pendingTopups}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Aprobadas</div>
            <div className="kpi-value" style={{ color: '#22c55e' }}>{kpis.approvedTopups}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Total</div>
            <div className="kpi-value">{kpis.totalTopups}</div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: RETIROS */}
      <div className="kpi-section">
        <h2 className="section-title">🏦 Retiros</h2>
        <div className="kpi-grid kpi-grid-1">
          <div className="kpi-card alert">
            <div className="kpi-label">Retiros Pendientes</div>
            <div className="kpi-value" style={{ color: '#f59e0b' }}>{kpis.pendingWithdrawals}</div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 4: INVERSIONES */}
      <div className="kpi-section">
        <h2 className="section-title">📈 Inversiones</h2>
        <div className="kpi-grid kpi-grid-2">
          <div className="kpi-card">
            <div className="kpi-label">Inversiones Activas</div>
            <div className="kpi-value">{kpis.activeInvestments}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Capital Invertido</div>
            <div className="kpi-value-currency">{formatCurrency(kpis.totalInvested)}</div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 5: TRANSACCIONES RECIENTES */}
      <div className="kpi-section">
        <h2 className="section-title">📊 Transacciones Recientes</h2>
        <div className="transactions-card">
          {kpis.recentTransactions.length > 0 ? (
            <div className="table-wrapper">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Monto</th>
                    <th>Usuario</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {kpis.recentTransactions.map(tx => (
                    <tr key={tx.id}>
                      <td><span className="tx-type">{tx.type || 'transfer'}</span></td>
                      <td className="amount">{formatCurrency(tx.amount)}</td>
                      <td className="user-email">{tx.userEmail || 'Usuario no disponible'}</td>
                      <td className="date">{formatDate(tx.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">No hay transacciones recientes</div>
          )}
        </div>
      </div>

      {/* SECCIÓN 6: ALERTAS */}
      <div className="kpi-section">
        <h2 className="section-title">🔔 Alertas Operativas</h2>
        <div className="alerts-container">
          {kpis.pendingTopups > 0 && (
            <div className="alert-item alert-warning">
              <span className="alert-icon">⚠️</span>
              <span className="alert-text">{kpis.pendingTopups} recarga(s) pendiente(s) de aprobación</span>
            </div>
          )}
          {kpis.pendingWithdrawals > 0 && (
            <div className="alert-item alert-warning">
              <span className="alert-icon">⚠️</span>
              <span className="alert-text">{kpis.pendingWithdrawals} retiro(s) pendiente(s) de aprobación</span>
            </div>
          )}
          {kpis.activeInvestments > 0 && (
            <div className="alert-item alert-info">
              <span className="alert-icon">ℹ️</span>
              <span className="alert-text">{kpis.activeInvestments} inversión(es) activa(s) en el sistema</span>
            </div>
          )}
          {kpis.pendingTopups === 0 && kpis.pendingWithdrawals === 0 && (
            <div className="alert-item alert-success">
              <span className="alert-icon">✓</span>
              <span className="alert-text">Sistema operativo. No hay operaciones pendientes.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
