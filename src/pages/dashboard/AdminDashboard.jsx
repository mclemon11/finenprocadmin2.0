import React from 'react';
import Card from '../../components/Card';
import useDashboardKPIs from '../../admin/hooks/useDashboardKPIs';
import { useLanguage } from '../../context/LanguageContext';
import './AdminDashboard.css';

export default function AdminDashboard(){
  const { kpis, loading } = useDashboardKPIs();
  const { t } = useLanguage();

  const stats = [
    {
      id: 'pending_topups',
      label: t('dashboard.pendingTopups') || 'Recargas pendientes',
      value: String(kpis.pendingTopups ?? 0),
      icon: '⏳',
      change: null,
      changeType: 'positive'
    },
    {
      id: 'approved_topups',
      label: t('dashboard.approvedTopups') || 'Recargas aprobadas',
      value: String(kpis.approvedTopups ?? 0),
      icon: '✓',
      change: null,
      changeType: 'positive'
    },
    {
      id: 'rejected_topups',
      label: t('dashboard.rejectedTopups') || 'Recargas rechazadas',
      value: String(kpis.rejectedTopups ?? 0),
      icon: '✕',
      change: null,
      changeType: 'negative'
    },
    {
      id: 'total_users',
      label: t('dashboard.totalUsers'),
      value: String(kpis.totalUsers ?? 0),
      icon: '👥',
      change: null,
      changeType: 'positive'
    },
  ];

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">{t('common.loading')}</h1>
            <p className="dashboard-subtitle">{t('dashboard.fetchingMetrics') || 'Obteniendo métricas'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">{t('dashboard.welcomeAdmin') || '¡Bienvenido, Admin!'}</h1>
          <p className="dashboard-subtitle">{t('dashboard.subtitle')}</p>
        </div>
        <div className="dashboard-meta">
          <span className="last-updated">{t('dashboard.lastUpdate') || 'Última actualización'}: {t('common.today')}, {new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}</span>
        </div>
      </div>

      <div className="grid grid-4">
        {stats.map(s=> (
          <Card key={s.id} className="stat-card">
            <div className={`stat-icon stat-icon-${s.changeType}`}>
              {s.icon}
            </div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            {s.change && (
              <div className={`stat-change ${s.changeType}`}>
                {s.changeType === 'positive' ? '↑' : '↓'} {s.change}
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="dashboard-section">
        <h3 className="section-title">{t('dashboard.recentActivity') || 'Actividad reciente'}</h3>
        <Card>
          {kpis.recentTransactions?.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('dashboard.type')}</th>
                    <th>{t('dashboard.amount')}</th>
                    <th>{t('dashboard.user')}</th>
                    <th>{t('dashboard.date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {kpis.recentTransactions.slice(0, 10).map((tx) => (
                    <tr key={tx.id}>
                      <td>{tx.type || 'transfer'}</td>
                      <td className="amount-cell">{formatCurrency(tx.amount)}</td>
                      <td>{tx.userEmail || tx.userId || '—'}</td>
                      <td className="date-cell">{formatDateTime(tx.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-title">{t('dashboard.noRecentActivity') || 'Sin actividad reciente'}</div>
              <div className="empty-state-text">{t('dashboard.noTransactions') || 'No hay transacciones recientes'}</div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
