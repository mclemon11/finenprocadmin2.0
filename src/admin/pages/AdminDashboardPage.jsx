import React from 'react';
import { useNavigate } from 'react-router-dom';
import useDashboardKPIs from '../hooks/useDashboardKPIs';
import { useLanguage } from '../../context/LanguageContext';
import './AdminDashboardPage.css';

export default function AdminDashboardPage() {
  const { kpis, loading } = useDashboardKPIs();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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
        <div>{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">{t('dashboard.title')}</h1>
          <p className="dashboard-subtitle">{t('dashboard.subtitle')}</p>
        </div>
        <div className="dashboard-meta">
          <span className="last-updated">{t('common.updated')}: {t('common.today')}</span>
        </div>
      </div>

      {/* SECCIÓN 1: USUARIOS */}
      <div className="kpi-section">
        <h2 className="section-title">👥 {t('dashboard.users')}</h2>
        <div className="kpi-grid kpi-grid-2">
          <div className="kpi-card">
            <div className="kpi-label">{t('dashboard.totalUsers')}</div>
            <div className="kpi-value">{kpis.totalUsers}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">{t('dashboard.activeUsers')}</div>
            <div className="kpi-value" style={{ color: '#22c55e' }}>{kpis.activeUsers}</div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: RECARGAS */}
      <div className="kpi-section">
        <h2 className="section-title">💰 {t('dashboard.topups')}</h2>
        <div className="kpi-grid kpi-grid-3">
          <div className="kpi-card alert">
            <div className="kpi-label">{t('dashboard.pending')}</div>
            <div className="kpi-value" style={{ color: '#f59e0b' }}>{kpis.pendingTopups}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">{t('dashboard.approved')}</div>
            <div className="kpi-value" style={{ color: '#22c55e' }}>{kpis.approvedTopups}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">{t('dashboard.total')}</div>
            <div className="kpi-value">{kpis.totalTopups}</div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: RETIROS */}
      <div className="kpi-section">
        <h2 className="section-title">🏦 {t('dashboard.withdrawals')}</h2>
        <div className="kpi-grid kpi-grid-1">
          <div className="kpi-card alert">
            <div className="kpi-label">{t('dashboard.pendingWithdrawals')}</div>
            <div className="kpi-value" style={{ color: '#f59e0b' }}>{kpis.pendingWithdrawals}</div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 4: INVERSIONES */}
      <div className="kpi-section">
        <h2 className="section-title">📈 {t('dashboard.investments')}</h2>
        <div className="kpi-grid kpi-grid-2">
          <div className="kpi-card">
            <div className="kpi-label">{t('dashboard.activeInvestments')}</div>
            <div className="kpi-value">{kpis.activeInvestments}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">{t('dashboard.investedCapital')}</div>
            <div className="kpi-value-currency">{formatCurrency(kpis.totalInvested)}</div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 5: TRANSACCIONES RECIENTES */}
      <div className="kpi-section">
        <h2 className="section-title">📊 {t('dashboard.recentTransactions')}</h2>
        <div className="transactions-card">
          {kpis.recentTransactions.length > 0 ? (
            <div className="table-wrapper">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>{t('dashboard.type')}</th>
                    <th>{t('dashboard.amount')}</th>
                    <th>{t('dashboard.user')}</th>
                    <th>{t('dashboard.date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {kpis.recentTransactions.map(tx => (
                    <tr key={tx.id}>
                      <td><span className="tx-type">{tx.type || 'transfer'}</span></td>
                      <td className="amount">{formatCurrency(tx.amount)}</td>
                      <td className="user-email">{tx.userEmail || t('dashboard.userNotAvailable')}</td>
                      <td className="date">{formatDate(tx.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">{t('dashboard.noRecentTransactions')}</div>
          )}
        </div>
      </div>

      {/* SECCIÓN 6: ALERTAS */}
      <div className="kpi-section">
        <h2 className="section-title">🔔 {t('dashboard.operationalAlerts')}</h2>
        <div className="alerts-container">
          {kpis.pendingTopups > 0 && (
            <div className="alert-item alert-warning">
              <span className="alert-icon">⚠️</span>
              <span className="alert-text">{kpis.pendingTopups} {t('dashboard.pendingTopupsAlert')}</span>
            </div>
          )}
          {kpis.pendingWithdrawals > 0 && (
            <div className="alert-item alert-warning">
              <span className="alert-icon">⚠️</span>
              <span className="alert-text">{kpis.pendingWithdrawals} {t('dashboard.pendingWithdrawalsAlert')}</span>
            </div>
          )}
          {kpis.activeInvestments > 0 && (
            <div className="alert-item alert-info">
              <span className="alert-icon">ℹ️</span>
              <span className="alert-text">{kpis.activeInvestments} {t('dashboard.activeInvestmentsAlert')}</span>
            </div>
          )}
          {kpis.pendingTopups === 0 && kpis.pendingWithdrawals === 0 && (
            <div className="alert-item alert-success">
              <span className="alert-icon">✓</span>
              <span className="alert-text">{t('dashboard.systemOperational')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
