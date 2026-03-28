import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useDashboardKPIs from '../hooks/useDashboardKPIs';
import { useLanguage } from '../../context/LanguageContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './AdminDashboardPage.css';

export default function AdminDashboardPage() {
  const { kpis, loading, getChartData } = useDashboardKPIs();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [chartPeriod, setChartPeriod] = useState('30D');

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);

  const formatCurrencyFull = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);

  const formatDate = (dateVal) => {
    if (!dateVal) return '-';
    const d = dateVal?.toDate ? dateVal.toDate() : new Date(dateVal);
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const formatShortDate = (dateVal) => {
    if (!dateVal) return '-';
    const d = dateVal?.toDate ? dateVal.toDate() : new Date(dateVal);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  };

  // Build chart data from real transactions filtered by the selected period
  const liquidityChartData = useMemo(() => {
    if (!getChartData) return [];
    return getChartData(chartPeriod);
  }, [chartPeriod, kpis._topups, kpis._withdrawals, kpis._investments]);

  if (loading) {
    return <div className="dashboard-loading"><div>{t('adminDash.fetchingData') || t('common.loading')}</div></div>;
  }

  const accentClasses = ['accent-blue', 'accent-green', 'accent-cyan', 'accent-amber', 'accent-purple', 'accent-blue'];

  const metrics = [
    { label: t('adminDash.totalCapital'), value: formatCurrency(kpis.totalCapital), icon: '', trend: null },
    { label: t('adminDash.capitalInvested'), value: formatCurrency(kpis.capitalInvested), icon: '', trend: null },
    { label: t('adminDash.availableLiquidity'), value: formatCurrency(kpis.availableLiquidity), icon: '', trend: null },
    { label: t('adminDash.pendingIn'), value: formatCurrency(kpis.pendingDepositAmount), icon: '', count: kpis.pendingDeposits },
    { label: t('adminDash.pendingOut'), value: formatCurrency(kpis.pendingWithdrawalAmount), icon: '', count: kpis.pendingWithdrawals },
    { label: t('adminDash.activeInvestors'), value: kpis.activeInvestors.toLocaleString(), icon: '', trend: null },
  ];

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'deposit': case 'topup': return 'tx-badge deposit';
      case 'withdrawal': return 'tx-badge withdrawal';
      case 'investment': return 'tx-badge investment';
      case 'payout': case 'dividend': return 'tx-badge payout';
      default: return 'tx-badge';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': case 'completed': return { icon: '', cls: 'status-success' };
      case 'pending': return { icon: '', cls: 'status-pending' };
      case 'rejected': return { icon: '', cls: 'status-danger' };
      default: return { icon: '•', cls: 'status-default' };
    }
  };

  return (
    <div className="admin-dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">{t('adminDash.title')}</h1>
          <p className="dashboard-subtitle">{t('adminDash.subtitle')}</p>
        </div>
        <div className="dashboard-actions">
          <button className="btn-outline-sm" onClick={() => navigate('/admin/operaciones/recargas')}>
             {t('adminDash.pendingOps')}
          </button>
        </div>
      </div>

      {/* 6 Metric Cards */}
      <div className="metrics-grid">
        {metrics.map((m, i) => (
          <div className={`metric-card ${accentClasses[i] || ''}`} key={i}>
            <p className="metric-label">{m.label}</p>
            <h3 className="metric-value">{m.value}</h3>
            {m.count != null && m.count > 0 && (
              <span className="metric-count">{m.count} {t('adminDash.requests')}</span>
            )}
          </div>
        ))}
      </div>

      {/* Chart + Upcoming Payments */}
      <div className="dashboard-main-row">
        {/* Liquidity Chart */}
        <div className="chart-panel">
          <div className="chart-header">
            <div>
              <h3 className="panel-title">{t('adminDash.liquidity')}</h3>
            </div>
            <div className="chart-period-btns">
              {['7D', '30D', '90D'].map(p => (
                <button key={p} className={`period-btn ${chartPeriod === p ? 'active' : ''}`} onClick={() => setChartPeriod(p)}>{p}</button>
              ))}
            </div>
          </div>
          <div className="chart-summary-row">
            <div>
              <span className="chart-summary-label">{t('adminDash.availableLiquidity')}</span>
              <span className="chart-summary-value">{formatCurrency(kpis.availableLiquidity)}</span>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={liquidityChartData}>
                <defs>
                  <linearGradient id="liqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#5a6270', fontSize: 12 }} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: '#0a0e14', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, color: '#e6eef8' }} formatter={(v) => formatCurrency(v)} />
                <Area type="monotone" dataKey="liquidity" stroke="#10b981" fill="url(#liqGrad)" strokeWidth={2} dot={false} name={t('adminDash.liquidity')} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Payments */}
        <div className="payments-panel">
          <div className="payments-header">
            <h3 className="panel-title">{t('adminDash.upcomingPayments')}</h3>
          </div>
          <div className="payments-list">
            {kpis.upcomingPayments.length > 0 ? (
              kpis.upcomingPayments.map((p, i) => (
                <div className="payment-item" key={p.id || i}>
                  <div className="payment-icon"></div>
                  <div className="payment-info">
                    <p className="payment-project">{p.projectName}</p>
                    <p className="payment-user">{p.userName}</p>
                  </div>
                  <div className="payment-amount">
                    <p className="payment-value">{formatCurrencyFull(p.amount)}</p>
                    <p className="payment-date">{formatShortDate(p.dueDate || p.createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-payments">{t('adminDash.noUpcomingPayments')}</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent System Activity Table */}
      <div className="activity-panel">
        <div className="activity-header">
          <h3 className="panel-title">{t('adminDash.recentActivity')}</h3>
        </div>
        <div className="table-wrapper">
          {kpis.recentTransactions.length > 0 ? (
            <table className="activity-table">
              <thead>
                <tr>
                  <th>{t('adminDash.txId')}</th>
                  <th>{t('adminDash.type')}</th>
                  <th>{t('adminDash.user')}</th>
                  <th>{t('adminDash.amount')}</th>
                  <th>{t('adminDash.status')}</th>
                  <th style={{ textAlign: 'right' }}>{t('adminDash.date')}</th>
                </tr>
              </thead>
              <tbody>
                {kpis.recentTransactions.map(tx => {
                  const st = getStatusIcon(tx.status);
                  return (
                    <tr key={tx.id}>
                      <td className="tx-id">#{tx.id?.slice(0, 8)}</td>
                      <td><span className={getTypeBadgeClass(tx.type)}>{tx.type || 'transfer'}</span></td>
                      <td className="tx-user">{tx.userName || tx.userEmail}</td>
                      <td className="tx-amount">{formatCurrencyFull(tx.amount)}</td>
                      <td><span className={`tx-status ${st.cls}`}>{st.icon} {tx.status || 'N/A'}</span></td>
                      <td className="tx-date">{formatShortDate(tx.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">{t('adminDash.noActivity')}</div>
          )}
        </div>
      </div>

      {/* Operational Alerts */}
      <div className="alerts-section">
        <h3 className="panel-title">{t('adminDash.operationalAlerts')}</h3>
        <div className="alerts-container">
          {kpis.pendingTopups > 0 && (
            <div className="alert-item alert-warning" onClick={() => navigate('/admin/operaciones/recargas')}>
              <span className="alert-icon"></span>
              <span className="alert-text">{kpis.pendingTopups} {t('adminDash.pendingDeposits')}</span>
              <span className="alert-action">→</span>
            </div>
          )}
          {kpis.pendingWithdrawals > 0 && (
            <div className="alert-item alert-warning" onClick={() => navigate('/admin/operaciones/retiros')}>
              <span className="alert-icon"></span>
              <span className="alert-text">{kpis.pendingWithdrawals} {t('adminDash.pendingWithdrawals')}</span>
              <span className="alert-action">→</span>
            </div>
          )}
          {kpis.pendingTopups === 0 && kpis.pendingWithdrawals === 0 && (
            <div className="alert-item alert-success">
              <span className="alert-icon"></span>
              <span className="alert-text">{t('adminDash.noAlerts')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
