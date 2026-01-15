import React, { useState } from 'react';
import useApproveTopup from '../../hooks/mutations/useApproveTopup';
import useRejectTopup from '../../hooks/mutations/useRejectTopup';
import ActionModal from './ActionModal';
import './UsuarioDetailDrawer.css';

export default function UsuarioDetailDrawer({
  isOpen,
  user,
  wallet,
  investments,
  topups,
  withdrawals,
  transactions,
  loading,
  onClose,
  adminData,
  onActionComplete
}) {
  const [activeTab, setActiveTab] = useState('perfil');
  const [selectedTopup, setSelectedTopup] = useState(null);
  const [actionModal, setActionModal] = useState({ isOpen: false, type: null });
  const { approve: approveTopup, loading: approveLoading } = useApproveTopup();
  const { reject: rejectTopup, loading: rejectLoading } = useRejectTopup();

  if (!isOpen) return null;

  const handleApproveTopup = async (reason) => {
    if (!selectedTopup) return;
    const success = await approveTopup(
      selectedTopup.id,
      adminData.uid,
      adminData.email
    );
    if (success) {
      setActionModal({ isOpen: false, type: null });
      setSelectedTopup(null);
      onActionComplete?.();
    }
  };

  const handleRejectTopup = async (reason) => {
    if (!selectedTopup) return;
    const success = await rejectTopup(
      selectedTopup.id,
      user.uid,
      reason,
      adminData.uid,
      adminData.email
    );
    if (success) {
      setActionModal({ isOpen: false, type: null });
      setSelectedTopup(null);
      onActionComplete?.();
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
    return new Date(dateString).toLocaleDateString('es-MX');
  };

  return (
    <>
      <div className="usuario-detail-overlay" onClick={onClose} />
      <div className="usuario-detail-drawer">
        <div className="drawer-header">
          <h2>Detalle de Usuario</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="drawer-loading">Cargando detalle...</div>
        ) : (
          <>
            <div className="drawer-tabs">
              {['perfil', 'wallet', 'inversiones', 'recargas', 'retiros', 'transacciones'].map(tab => (
                <button
                  key={tab}
                  className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="drawer-content">
              {/* PERFIL */}
              {activeTab === 'perfil' && user && (
                <div className="tab-pane">
                  <div className="info-group">
                    <div className="info-row">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{user.email}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Nombre:</span>
                      <span className="info-value">{user.displayName || '-'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Estado:</span>
                      <span className={`status-badge status-${user.status}`}>
                        {user.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Rol:</span>
                      <span className="info-value">{user.role || 'investor'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Fecha de Registro:</span>
                      <span className="info-value">{formatDate(user.createdAt)}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">UID:</span>
                      <span className="info-value uid-value">{user.uid}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* WALLET */}
              {activeTab === 'wallet' && (
                <div className="tab-pane">
                  {wallet ? (
                    <div className="info-group">
                      <div className="wallet-card">
                        <div className="wallet-label">Balance Actual</div>
                        <div className="wallet-amount">{formatCurrency(wallet.balance)}</div>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Última Actualización:</span>
                        <span className="info-value">{formatDate(wallet.updatedAt)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-state">Sin información de wallet</div>
                  )}
                </div>
              )}

              {/* INVERSIONES */}
              {activeTab === 'inversiones' && (
                <div className="tab-pane">
                  {investments.length > 0 ? (
                    <div className="table-responsive">
                      <table className="mini-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Monto</th>
                            <th>Estado</th>
                            <th>Fecha</th>
                          </tr>
                        </thead>
                        <tbody>
                          {investments.map(inv => (
                            <tr key={inv.id}>
                              <td className="id-cell">{inv.id.substring(0, 8)}...</td>
                              <td>{formatCurrency(inv.amount)}</td>
                              <td><span className={`status-badge status-${inv.status}`}>{inv.status}</span></td>
                              <td>{formatDate(inv.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-state">Sin inversiones</div>
                  )}
                </div>
              )}

              {/* RECARGAS */}
              {activeTab === 'recargas' && (
                <div className="tab-pane">
                  {topups.length > 0 ? (
                    <div className="table-responsive">
                      <table className="mini-table">
                        <thead>
                          <tr>
                            <th>Monto</th>
                            <th>Estado</th>
                            <th>Fecha</th>
                            <th>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topups.map(topup => (
                            <tr key={topup.id}>
                              <td>{formatCurrency(topup.amount)}</td>
                              <td><span className={`status-badge status-${topup.status}`}>{topup.status}</span></td>
                              <td>{formatDate(topup.createdAt)}</td>
                              <td>
                                {topup.status === 'pending' && (
                                  <>
                                    <button
                                      className="btn-action btn-approve"
                                      onClick={() => {
                                        setSelectedTopup(topup);
                                        setActionModal({ isOpen: true, type: 'approve' });
                                      }}
                                    >
                                      ✓
                                    </button>
                                    <button
                                      className="btn-action btn-reject"
                                      onClick={() => {
                                        setSelectedTopup(topup);
                                        setActionModal({ isOpen: true, type: 'reject' });
                                      }}
                                    >
                                      ✕
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-state">Sin recargas</div>
                  )}
                </div>
              )}

              {/* RETIROS */}
              {activeTab === 'retiros' && (
                <div className="tab-pane">
                  {withdrawals.length > 0 ? (
                    <div className="table-responsive">
                      <table className="mini-table">
                        <thead>
                          <tr>
                            <th>Monto</th>
                            <th>Estado</th>
                            <th>Fecha</th>
                          </tr>
                        </thead>
                        <tbody>
                          {withdrawals.map(wd => (
                            <tr key={wd.id}>
                              <td>{formatCurrency(wd.amount)}</td>
                              <td><span className={`status-badge status-${wd.status}`}>{wd.status}</span></td>
                              <td>{formatDate(wd.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-state">Sin retiros</div>
                  )}
                </div>
              )}

              {/* TRANSACCIONES */}
              {activeTab === 'transacciones' && (
                <div className="tab-pane">
                  {transactions.length > 0 ? (
                    <div className="table-responsive">
                      <table className="mini-table">
                        <thead>
                          <tr>
                            <th>Tipo</th>
                            <th>Monto</th>
                            <th>Fecha</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map(tx => (
                            <tr key={tx.id}>
                              <td>{tx.type || 'transfer'}</td>
                              <td>{formatCurrency(tx.amount)}</td>
                              <td>{formatDate(tx.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty-state">Sin transacciones</div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <ActionModal
        isOpen={actionModal.isOpen}
        title={actionModal.type === 'approve' ? 'Aprobar Recarga' : 'Rechazar Recarga'}
        message={`¿${actionModal.type === 'approve' ? 'Aprobar' : 'Rechazar'} recarga de ${selectedTopup ? formatCurrency(selectedTopup.amount) : ''}?`}
        actionLabel={actionModal.type === 'approve' ? 'Aprobar' : 'Rechazar'}
        showReasonInput={actionModal.type === 'reject'}
        reasonPlaceholder="Razón del rechazo..."
        loading={approveLoading || rejectLoading}
        onConfirm={actionModal.type === 'approve' ? handleApproveTopup : handleRejectTopup}
        onCancel={() => {
          setActionModal({ isOpen: false, type: null });
          setSelectedTopup(null);
        }}
      />
    </>
  );
}
