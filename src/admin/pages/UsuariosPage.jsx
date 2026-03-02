import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import useAdminUsers from '../hooks/useAdminUsers';
import useUserDetail from '../hooks/useUserDetail';
import UsuariosTable from '../components/tables/UsuariosTable';
import UsuarioDetailDrawer from '../components/modals/UsuarioDetailDrawer';
import { useLanguage } from '../../context/LanguageContext';
import './UsuariosPage.css';

export default function UsuariosPage({ adminData }) {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({ status: 'all', search: '', chip: '' });
  const [selectedUserId, setSelectedUserId] = useState(null);
  const { users, loading, refetch: refetchUsers } = useAdminUsers(filters);
  const { user, wallet, investments, topups, withdrawals, transactions, loading: detailLoading, refetch: refetchDetail } = useUserDetail(selectedUserId);
  const { t } = useLanguage();

  const handleActionComplete = () => {
    refetchUsers();
    refetchDetail();
  };

  const formatCurrency = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v || 0);

  // Summary KPIs
  const kpis = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const totalCapital = users.reduce((s, u) => s + (u.totalInvested || 0), 0);
    const totalBalance = users.reduce((s, u) => s + (u.walletBalance || 0), 0);
    return { totalUsers, activeUsers, totalCapital, totalBalance };
  }, [users]);

  const chipOptions = [
    { value: '', label: t('common.all') },
    { value: 'hasBalance', label: t('users.hasBalance') },
    { value: 'hasActive', label: t('users.hasActiveInv') },
    { value: 'highCapital', label: t('users.highCapital') },
  ];

  useEffect(() => {
    const uid = searchParams.get('uid');
    if (uid) setSelectedUserId(uid);
  }, [searchParams]);

  return (
    <div className="usuarios-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('users.title')}</h1>
          <p className="page-subtitle">{t('users.subtitle')}</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-icon blue">👥</div>
          <div className="kpi-content">
            <div className="kpi-label">{t('users.totalUsers')}</div>
            <div className="kpi-value">{kpis.totalUsers}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon green">✓</div>
          <div className="kpi-content">
            <div className="kpi-label">{t('users.activeCount')}</div>
            <div className="kpi-value">{kpis.activeUsers}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon purple">💰</div>
          <div className="kpi-content">
            <div className="kpi-label">{t('users.totalCapital')}</div>
            <div className="kpi-value">{formatCurrency(kpis.totalCapital)}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon teal">🏦</div>
          <div className="kpi-content">
            <div className="kpi-label">{t('users.totalBalance')}</div>
            <div className="kpi-value">{formatCurrency(kpis.totalBalance)}</div>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="filters-toolbar">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder={t('users.searchPlaceholder')}
            className="search-input"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <select
          className="filter-select"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="all">{t('users.allStatuses')}</option>
          <option value="active">{t('users.active')}</option>
          <option value="inactive">{t('users.inactive')}</option>
        </select>
      </div>

      {/* Filter Chips */}
      <div className="filter-chips">
        {chipOptions.map(c => (
          <button
            key={c.value}
            className={`chip ${filters.chip === c.value ? 'active' : ''}`}
            onClick={() => setFilters({ ...filters, chip: c.value })}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Users Table Card */}
      <div className="usuarios-card">
        <div className="card-header">
          <h3>{t('nav.users')} ({users.length})</h3>
        </div>
        <UsuariosTable
          users={users}
          loading={loading}
          onSelectUser={setSelectedUserId}
        />
      </div>

      <UsuarioDetailDrawer
        isOpen={!!selectedUserId}
        user={user}
        wallet={wallet}
        investments={investments}
        topups={topups}
        withdrawals={withdrawals}
        transactions={transactions}
        loading={detailLoading}
        onClose={() => setSelectedUserId(null)}
        adminData={adminData}
        onActionComplete={handleActionComplete}
      />
    </div>
  );
}
