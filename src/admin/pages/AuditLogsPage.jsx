import React, { useState } from 'react';
import useAuditLogs from '../hooks/useAuditLogs';
import { useLanguage } from '../../context/LanguageContext';
import './AuditLogsPage.css';

export default function AuditLogsPage() {
  const { t } = useLanguage();
  const [filters, setFilters] = useState({ search: '', type: 'all', period: '7d' });
  const { logs, loading, stats } = useAuditLogs(filters);

  const formatCurrency = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v || 0);

  const formatTimestamp = (ts) => {
    if (!ts) return '-';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getActionBadge = (action) => {
    if (!action) return { cls: 'badge-default', label: 'Unknown' };
    if (action.includes('approve_topup') || action.includes('approve_deposit')) return { cls: 'badge-approve', label: t('audit.depositApproved') };
    if (action.includes('approve_investment')) return { cls: 'badge-investment', label: t('audit.investmentApproved') };
    if (action.includes('approve_withdrawal')) return { cls: 'badge-payout', label: t('audit.withdrawalApproved') };
    if (action.includes('reject')) return { cls: 'badge-reject', label: t('audit.rejected') };
    if (action.includes('distribute')) return { cls: 'badge-payout', label: t('audit.payoutDistributed') };
    if (action.includes('project_create') || action.includes('create_project')) return { cls: 'badge-create', label: t('audit.projectCreated') };
    if (action.includes('project_update') || action.includes('update_project')) return { cls: 'badge-create', label: t('audit.projectUpdated') };
    if (action.includes('verification') || action.includes('kyc')) return { cls: 'badge-verify', label: t('audit.userVerification') };
    if (action.includes('failed_login') || action.includes('security')) return { cls: 'badge-security', label: t('audit.failedLogin') };
    if (action.includes('document') || action.includes('upload')) return { cls: 'badge-upload', label: t('audit.documentUpload') };
    return { cls: 'badge-default', label: action.replace(/_/g, ' ') };
  };

  return (
    <div className="audit-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('audit.title')}</h1>
          <p className="page-subtitle">{t('audit.subtitle')}</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="audit-toolbar">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder={t('audit.searchPlaceholder')}
            className="search-input"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <select
          className="filter-select"
          value={filters.period}
          onChange={(e) => setFilters({ ...filters, period: e.target.value })}
        >
          <option value="7d">{t('audit.last7Days')}</option>
          <option value="30d">{t('audit.last30Days')}</option>
          <option value="all">{t('audit.allTime')}</option>
        </select>
        <select
          className="filter-select"
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        >
          <option value="all">{t('audit.allTypes')}</option>
          <option value="approve">{t('audit.approvals')}</option>
          <option value="reject">{t('audit.rejections')}</option>
          <option value="distribute">{t('audit.distributions')}</option>
          <option value="project">{t('audit.projectChanges')}</option>
          <option value="security">{t('audit.security')}</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="audit-stats">
        <div className="audit-stat-card blue">
          <div className="audit-stat-label">{t('audit.adminActionsToday')}</div>
          <div className="audit-stat-value">{stats.adminActions}</div>
        </div>
        <div className="audit-stat-card orange">
          <div className="audit-stat-label">{t('audit.securityAlerts')}</div>
          <div className="audit-stat-value">{stats.securityAlerts}</div>
        </div>
        <div className="audit-stat-card green">
          <div className="audit-stat-label">{t('audit.financialEvents')}</div>
          <div className="audit-stat-value">{formatCurrency(stats.financialTotal)}</div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="audit-table-card">
        <div className="table-wrapper">
          {loading ? (
            <div className="audit-loading">{t('common.loading')}</div>
          ) : logs.length === 0 ? (
            <div className="audit-empty">{t('audit.noLogs')}</div>
          ) : (
            <table className="audit-table">
              <thead>
                <tr>
                  <th>{t('audit.timestamp')}</th>
                  <th>{t('audit.adminUser')}</th>
                  <th>{t('audit.actionType')}</th>
                  <th>{t('audit.subject')}</th>
                  <th>{t('audit.details')}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const badge = getActionBadge(log.action);
                  return (
                    <tr key={log.id}>
                      <td className="ts-cell">{formatTimestamp(log.timestamp)}</td>
                      <td>
                        <div className="admin-cell">
                          <div className="admin-avatar-sm">{(log.adminEmail || 'S').charAt(0).toUpperCase()}</div>
                          <span className="admin-name-sm">{log.adminEmail?.split('@')[0] || 'System'}</span>
                        </div>
                      </td>
                      <td><span className={`action-badge ${badge.cls}`}>{badge.label}</span></td>
                      <td className="subject-cell">{log.targetId?.slice(0, 12) || log.targetUserId?.slice(0, 12) || '-'}</td>
                      <td className="details-cell" title={log.details}>{log.details || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="table-footer">
          {t('audit.showing')} {logs.length} {t('audit.results')}
        </div>
      </div>
    </div>
  );
}
