import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import useAdminUsers from '../hooks/useAdminUsers';
import useUserDetail from '../hooks/useUserDetail';
import UsuariosTable from '../components/tables/UsuariosTable';
import UsuarioDetailDrawer from '../components/modals/UsuarioDetailDrawer';
import { useLanguage } from '../../context/LanguageContext';
import './UsuariosPage.css';

export default function UsuariosPage({ adminData }) {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({ status: 'all', search: '' });
  const [selectedUserId, setSelectedUserId] = useState(null);
  const { users, loading, refetch: refetchUsers } = useAdminUsers(filters);
  const { user, wallet, investments, topups, withdrawals, transactions, loading: detailLoading, refetch: refetchDetail } = useUserDetail(selectedUserId);
  const { t } = useLanguage();

  const handleActionComplete = () => {
    refetchUsers();
    refetchDetail();
  };

  // Calculate KPI metrics
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const inactiveUsers = users.filter(u => u.status === 'inactive').length;
  const investorUsers = users.filter(u => u.role === 'investor' || !u.role).length;

  useEffect(() => {
    const uid = searchParams.get('uid');
    if (uid) {
      setSelectedUserId(uid);
    }
  }, [searchParams]);

  return (
    <div className="usuarios-page">
      <div className="page-header">
        <h1 className="page-title">{t('users.title')}</h1>
        <p className="page-subtitle">{t('users.subtitle')}</p>
        <div className="page-divider"></div>
      </div>

      {/* KPI Row */}
      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-icon">👥</div>
          <div className="kpi-content">
            <div className="kpi-label">{t('users.totalUsers')}</div>
            <div className="kpi-value">{totalUsers}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">✓</div>
          <div className="kpi-content">
            <div className="kpi-label">{t('users.activeCount')}</div>
            <div className="kpi-value">{activeUsers}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">○</div>
          <div className="kpi-content">
            <div className="kpi-label">{t('users.inactiveCount')}</div>
            <div className="kpi-value">{inactiveUsers}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">💰</div>
          <div className="kpi-content">
            <div className="kpi-label">{t('users.investors')}</div>
            <div className="kpi-value">{investorUsers}</div>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="filters-toolbar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
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
