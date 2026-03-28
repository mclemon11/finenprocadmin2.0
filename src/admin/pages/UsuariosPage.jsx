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
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
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

  // Reset to page 1 when filters or users change
  useMemo(() => {
    setCurrentPage(1);
  }, [filters.status, filters.search, filters.chip, users.length]);

  const totalPages = Math.max(1, Math.ceil(users.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return users.slice(start, start + pageSize);
  }, [users, currentPage, pageSize]);

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
        <div className="kpi-card accent-blue">
          <div className="kpi-content">
            <div className="kpi-label">{t('users.totalUsers')}</div>
            <div className="kpi-value">{kpis.totalUsers}</div>
          </div>
        </div>
        <div className="kpi-card accent-green">
          <div className="kpi-content">
            <div className="kpi-label">{t('users.activeCount')}</div>
            <div className="kpi-value">{kpis.activeUsers}</div>
          </div>
        </div>
        <div className="kpi-card accent-cyan">
          <div className="kpi-content">
            <div className="kpi-label">{t('users.totalCapital')}</div>
            <div className="kpi-value">{formatCurrency(kpis.totalCapital)}</div>
          </div>
        </div>
        <div className="kpi-card accent-amber">
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

      {/* Pagination Controls */}
      <div className="usuarios-controls">
        <div className="usuarios-control">
          <span className="usuarios-control-label">{t('common.show')}</span>
          <select
            className="usuarios-page-size"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="usuarios-control-label">{t('common.perPage')}</span>
        </div>

        <div className="usuarios-pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={loading || currentPage <= 1}
          >
            ← {t('common.previous')}
          </button>
          <span className="pagination-status">{t('common.page')} {currentPage} {t('common.of')} {totalPages}</span>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={loading || currentPage >= totalPages}
          >
            {t('common.next')} →
          </button>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="usuarios-card">
        <div className="card-header">
          <h3>{t('nav.users')} ({users.length})</h3>
        </div>
        <UsuariosTable
          users={paginatedUsers}
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
