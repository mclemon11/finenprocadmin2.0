import React, { useState } from 'react';
import useAdminWithdrawals from '../hooks/useAdminWithdrawals';
import useApproveWithdrawal from '../hooks/mutations/useApproveWithdrawal';
import useRejectWithdrawal from '../hooks/mutations/useRejectWithdrawal';
import ActionModal from '../components/modals/ActionModal';
import './RetirosPage.css';

export default function RetirosPage({ adminData }) {
  const [filter, setFilter] = useState('all');
  const [pageSize, setPageSize] = useState(25);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [actionModal, setActionModal] = useState({ isOpen: false, type: null });
  const {
    withdrawals,
    loading,
    refetch,
    counts,
    page,
    hasNextPage,
    nextPage,
    prevPage,
    setPageSize: setHookPageSize,
  } = useAdminWithdrawals({ status: filter, pageSize });
  const { approve: approveWithdrawal, loading: approveLoading } = useApproveWithdrawal();
  const { reject: rejectWithdrawal, loading: rejectLoading } = useRejectWithdrawal();

  const filters = [
    { value: 'all', label: 'Todos' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'approved', label: 'Aprobados' },
    { value: 'rejected', label: 'Rechazados' },
  ];

  const handleApprove = async () => {
    if (!selectedWithdrawal) return;
    const success = await approveWithdrawal(
      selectedWithdrawal.id,
      selectedWithdrawal.userId,
      selectedWithdrawal.amount,
      adminData.uid,
      adminData.email
    );
    if (success) {
      setActionModal({ isOpen: false, type: null });
      setSelectedWithdrawal(null);
      refetch();
    }
  };

  const handleReject = async (reason) => {
    if (!selectedWithdrawal) return;
    const success = await rejectWithdrawal(
      selectedWithdrawal.id,
      selectedWithdrawal.userId,
      reason,
      adminData.uid,
      adminData.email
    );
    if (success) {
      setActionModal({ isOpen: false, type: null });
      setSelectedWithdrawal(null);
      refetch();
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = dateString?.toDate ? dateString.toDate() : new Date(dateString);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('es-MX');
  };

  return (
    <div className="retiros-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Retiros</h1>
          <p className="page-subtitle">Administra todas las solicitudes de retiro de usuarios</p>
        </div>
      </div>

      <div className="retiros-filters">
        {filters.map(f => (
          <button
            key={f.value}
            className={`filter-btn ${filter === f.value ? 'active' : ''}`}
            onClick={() => {
              setFilter(f.value);
            }}
          >
            {f.label}
            <span className="filter-count">
              {f.value === 'all' ? (counts?.all ?? 0) : (counts?.[f.value] ?? 0)}
            </span>
          </button>
        ))}
      </div>

      <div className="retiros-controls">
        <div className="retiros-control">
          <span className="retiros-control-label">Mostrar</span>
          <select
            className="retiros-page-size"
            value={pageSize}
            onChange={(e) => {
              const next = Number(e.target.value);
              setPageSize(next);
              setHookPageSize(next);
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="retiros-control-label">por página</span>
        </div>

        <div className="retiros-pagination">
          <button className="pagination-btn" onClick={prevPage} disabled={loading || page <= 1}>
            ← Anterior
          </button>
          <span className="pagination-status">Página {page}</span>
          <button className="pagination-btn" onClick={nextPage} disabled={loading || !hasNextPage}>
            Siguiente →
          </button>
        </div>
      </div>

      <div className="retiros-card">
        <div className="card-header">
          <h3>Total de retiros: {withdrawals.length}</h3>
        </div>

        {loading ? (
          <div className="loading-state">Cargando retiros...</div>
        ) : withdrawals.length === 0 ? (
          <div className="empty-state">No hay retiros en este estado</div>
        ) : (
          <div className="table-wrapper">
            <table className="retiros-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map(withdrawal => (
                  <tr key={withdrawal.id}>
                    <td className="email-cell">{withdrawal.userEmail || withdrawal.userId || 'Email no disponible'}</td>
                    <td className="amount-cell">{formatCurrency(withdrawal.amount)}</td>
                    <td>{withdrawal.method || '-'}</td>
                    <td>
                      <span className={`status-badge status-${withdrawal.status}`}>
                        {withdrawal.status === 'pending' && 'Pendiente'}
                        {withdrawal.status === 'approved' && 'Aprobado'}
                        {withdrawal.status === 'rejected' && 'Rechazado'}
                      </span>
                    </td>
                    <td>{formatDate(withdrawal.createdAt)}</td>
                    <td>
                      {withdrawal.status === 'pending' && (
                        <div className="action-buttons">
                          <button
                            className="btn-action btn-approve"
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setActionModal({ isOpen: true, type: 'approve' });
                            }}
                            title="Aprobar"
                          >
                            ✓
                          </button>
                          <button
                            className="btn-action btn-reject"
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setActionModal({ isOpen: true, type: 'reject' });
                            }}
                            title="Rechazar"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ActionModal
        isOpen={actionModal.isOpen}
        title={actionModal.type === 'approve' ? 'Aprobar Retiro' : 'Rechazar Retiro'}
        message={`¿${actionModal.type === 'approve' ? 'Aprobar' : 'Rechazar'} retiro de ${selectedWithdrawal ? formatCurrency(selectedWithdrawal.amount) : ''} del usuario ${selectedWithdrawal?.userEmail || selectedWithdrawal?.userId}?`}
        actionLabel={actionModal.type === 'approve' ? 'Aprobar' : 'Rechazar'}
        showReasonInput={actionModal.type === 'reject'}
        reasonPlaceholder="Razón del rechazo..."
        loading={approveLoading || rejectLoading}
        onConfirm={actionModal.type === 'approve' ? handleApprove : handleReject}
        onCancel={() => {
          setActionModal({ isOpen: false, type: null });
          setSelectedWithdrawal(null);
        }}
      />
    </div>
  );
}
