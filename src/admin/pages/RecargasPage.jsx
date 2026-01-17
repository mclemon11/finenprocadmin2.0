import React, { useState } from 'react';
import useAdminTopups from '../hooks/useAdminTopups';
import useApproveTopup from '../hooks/mutations/useApproveTopup';
import useRejectTopup from '../hooks/mutations/useRejectTopup';
import ActionModal from '../components/modals/ActionModal';
import RechargeMethodsModal from '../components/modals/RechargeMethodsModal';
import './RecargasPage.css';

export default function RecargasPage({ adminData }) {
  const [filter, setFilter] = useState('all');
  const [selectedTopup, setSelectedTopup] = useState(null);
  const [actionModal, setActionModal] = useState({ isOpen: false, type: null });
  const [proofViewer, setProofViewer] = useState({ isOpen: false, url: null });
  const [methodsModalOpen, setMethodsModalOpen] = useState(false);
  const { topups, loading, refetch } = useAdminTopups({ status: filter });
  const { approve: approveTopup, loading: approveLoading } = useApproveTopup();
  const { reject: rejectTopup, loading: rejectLoading } = useRejectTopup();

  const filters = [
    { value: 'all', label: 'Todas' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'approved', label: 'Aprobadas' },
    { value: 'rejected', label: 'Rechazadas' },
  ];

  const handleApprove = async () => {
    if (!selectedTopup) return;
    const success = await approveTopup(
      selectedTopup.id,
      adminData.uid,
      adminData.email
    );
    if (success) {
      setActionModal({ isOpen: false, type: null });
      setSelectedTopup(null);
      refetch();
    }
  };

  const handleReject = async (reason) => {
    if (!selectedTopup) return;
    const success = await rejectTopup(
      selectedTopup.id,
      selectedTopup.userId,
      reason,
      adminData.uid,
      adminData.email
    );
    if (success) {
      setActionModal({ isOpen: false, type: null });
      setSelectedTopup(null);
      refetch();
    }
  };

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
    const date = dateString?.toDate ? dateString.toDate() : new Date(dateString);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('es-MX');
  };

  const getProofUrl = (topup) => topup?.proofUrl || topup?.receiptUrl || null;

  return (
    <div className="recargas-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Recargas</h1>
          <p className="page-subtitle">Administra todas las solicitudes de recarga de usuarios</p>
        </div>
      </div>

      <div className="recargas-filters">
        {filters.map(f => (
          <button
            key={f.value}
            className={`filter-btn ${filter === f.value ? 'active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
            <span className="filter-count">
              {f.value === 'all' ? topups.length : topups.filter(t => t.status === f.value).length}
            </span>
          </button>
        ))}
      </div>

      <div className="recargas-card">
        <div className="card-header">
          <div className="card-header-row">
            <h3>Total de recargas: {topups.length}</h3>
            <button
              className="btn-methods"
              onClick={() => setMethodsModalOpen(true)}
              type="button"
            >
              Metodos de Recargas
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Cargando recargas...</div>
        ) : topups.length === 0 ? (
          <div className="empty-state">No hay recargas en este estado</div>
        ) : (
          <div className="table-wrapper">
            <table className="recargas-table">
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
                {topups.map(topup => (
                  <tr key={topup.id}>
                    <td className="email-cell">{topup.userEmail || topup.userId || 'Email no disponible'}</td>
                    <td className="amount-cell">{formatCurrency(topup.amount)}</td>
                    <td>{topup.method || '-'}</td>
                    <td>
                      <span className={`status-badge status-${topup.status}`}>
                        {topup.status === 'pending' && 'Pendiente'}
                        {topup.status === 'approved' && 'Aprobada'}
                        {topup.status === 'rejected' && 'Rechazada'}
                      </span>
                    </td>
                    <td>{formatDate(topup.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        {getProofUrl(topup) && (
                          <button
                            className="btn-action btn-proof"
                            onClick={() => {
                              setProofViewer({ isOpen: true, url: getProofUrl(topup) });
                            }}
                            title="Ver comprobante"
                          >
                            <svg
                              className="btn-icon"
                              viewBox="0 0 24 24"
                              width="16"
                              height="16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              aria-hidden="true"
                            >
                              <path
                                d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        )}

                        {topup.status === 'pending' && (
                          <>
                            <button
                              className="btn-action btn-approve"
                              onClick={() => {
                                setSelectedTopup(topup);
                                setActionModal({ isOpen: true, type: 'approve' });
                              }}
                              title="Aprobar"
                            >
                              ✓
                            </button>
                            <button
                              className="btn-action btn-reject"
                              onClick={() => {
                                setSelectedTopup(topup);
                                setActionModal({ isOpen: true, type: 'reject' });
                              }}
                              title="Rechazar"
                            >
                              ✕
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {proofViewer.isOpen && (
        <div
          className="proof-viewer-overlay"
          onClick={() => setProofViewer({ isOpen: false, url: null })}
          role="button"
          tabIndex={0}
          aria-label="Cerrar comprobante"
        >
          <img
            className="proof-viewer-image"
            src={proofViewer.url}
            alt="Comprobante"
          />
        </div>
      )}

      <ActionModal
        isOpen={actionModal.isOpen}
        title={actionModal.type === 'approve' ? 'Aprobar Recarga' : 'Rechazar Recarga'}
        message={`¿${actionModal.type === 'approve' ? 'Aprobar' : 'Rechazar'} recarga de ${selectedTopup ? formatCurrency(selectedTopup.amount) : ''} del usuario ${selectedTopup?.userEmail || selectedTopup?.userId}?`}
        actionLabel={actionModal.type === 'approve' ? 'Aprobar' : 'Rechazar'}
        showReasonInput={actionModal.type === 'reject'}
        reasonPlaceholder="Razón del rechazo..."
        loading={approveLoading || rejectLoading}
        onConfirm={actionModal.type === 'approve' ? handleApprove : handleReject}
        onCancel={() => {
          setActionModal({ isOpen: false, type: null });
          setSelectedTopup(null);
        }}
      />

      <RechargeMethodsModal
        isOpen={methodsModalOpen}
        onClose={() => setMethodsModalOpen(false)}
      />
    </div>
  );
}
