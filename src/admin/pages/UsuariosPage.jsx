import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import useAdminUsers from '../hooks/useAdminUsers';
import useUserDetail from '../hooks/useUserDetail';
import UsuariosTable from '../components/tables/UsuariosTable';
import UsuarioDetailDrawer from '../components/modals/UsuarioDetailDrawer';
import './UsuariosPage.css';

export default function UsuariosPage({ adminData }) {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({ status: 'all', search: '' });
  const [selectedUserId, setSelectedUserId] = useState(null);
  const { users, loading, refetch: refetchUsers } = useAdminUsers(filters);
  const { user, wallet, investments, topups, withdrawals, transactions, loading: detailLoading, refetch: refetchDetail } = useUserDetail(selectedUserId);

  const handleActionComplete = () => {
    refetchUsers();
    refetchDetail();
  };

  useEffect(() => {
    const uid = searchParams.get('uid');
    if (uid) {
      setSelectedUserId(uid);
    }
  }, [searchParams]);

  return (
    <div className="usuarios-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Usuarios</h1>
          <p className="page-subtitle">Administra todos los usuarios del sistema</p>
        </div>
      </div>

      <div className="usuarios-filters-section">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Buscar por email o nombre..."
            className="filter-input"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <div className="filter-group">
          <select
            className="filter-select"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </div>

      <div className="usuarios-card">
        <div className="card-header">
          <h3>Total de usuarios: {users.length}</h3>
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
