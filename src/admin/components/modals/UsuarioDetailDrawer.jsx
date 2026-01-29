import React, { useState } from 'react';
import useApproveTopup from '../../hooks/mutations/useApproveTopup';
import useRejectTopup from '../../hooks/mutations/useRejectTopup';
import ActionModal from './ActionModal';
import { useLanguage } from '../../../context/LanguageContext';
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
  const { t } = useLanguage();

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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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
          <div className="header-content">
            <h2 className="drawer-title">{user?.displayName || user?.email || t('users.user')}</h2>
            <p className="drawer-email">{user?.email}</p>
            <div className="header-badges">
              <span className={`status-badge status-${user?.status}`}>
                {user?.status === 'active' ? `● ${t('status.active')}` : `○ ${t('status.inactive')}`}
              </span>
              <span className="role-badge">{user?.role || 'Investor'}</span>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label={t('common.close')}>✕</button>
        </div>

        {loading ? (
          <div className="drawer-loading">{t('users.loadingDetail')}</div>
        ) : (
          <>
            <div className="drawer-tabs">
              <button
                className={`tab-btn ${activeTab === 'perfil' ? 'active' : ''}`}
                onClick={() => setActiveTab('perfil')}
              >
                📊 {t('users.tabs.summary')}
              </button>
              <button
                className={`tab-btn ${activeTab === 'wallet' ? 'active' : ''}`}
                onClick={() => setActiveTab('wallet')}
              >
                💰 {t('users.tabs.wallet')}
              </button>
              <button
                className={`tab-btn ${activeTab === 'inversiones' ? 'active' : ''}`}
                onClick={() => setActiveTab('inversiones')}
              >
                📈 {t('users.tabs.investments')}
              </button>
              <button
                className={`tab-btn ${activeTab === 'recargas' ? 'active' : ''}`}
                onClick={() => setActiveTab('recargas')}
              >
                🔄 {t('users.tabs.topups')}
              </button>
              <button
                className={`tab-btn ${activeTab === 'retiros' ? 'active' : ''}`}
                onClick={() => setActiveTab('retiros')}
              >
                💸 {t('users.tabs.withdrawals')}
              </button>
              <button
                className={`tab-btn ${activeTab === 'transacciones' ? 'active' : ''}`}
                onClick={() => setActiveTab('transacciones')}
              >
                📋 {t('users.tabs.transactions')}
              </button>
            </div>

            <div className="drawer-content">
              {/* PERFIL / RESUMEN */}
              {activeTab === 'perfil' && user && (
                <div className="tab-pane">
                  {/* Summary Cards - 2x2 Grid */}
                  <div className="summary-cards">
                    <div className="summary-card">
                      <div className="card-label">{t('users.email')}</div>
                      <div className="card-value accent">{user.email}</div>
                    </div>
                    <div className="summary-card">
                      <div className="card-label">{t('users.name')}</div>
                      <div className="card-value">{user.displayName || '—'}</div>
                    </div>
                    <div className="summary-card">
                      <div className="card-label">{t('users.status')}</div>
                      <div>
                        <span className={`status-badge status-${user.status}`}>
                          {user.status === 'active' ? t('status.active') : t('status.inactive')}
                        </span>
                      </div>
                    </div>
                    <div className="summary-card">
                      <div className="card-label">{t('users.registrationDate')}</div>
                      <div className="card-value">{formatDate(user.createdAt)}</div>
                    </div>
                  </div>

                  {/* Technical Info Section */}
                  <div className="technical-section">
                    <div className="section-title">{t('users.technicalInfo')}</div>
                    <div className="tech-info-row">
                      <span className="tech-label">{t('users.userId')}</span>
                      <span className="tech-value">{user.uid}</span>
                    </div>
                    <div className="tech-info-row">
                      <span className="tech-label">{t('users.role')}</span>
                      <span className="tech-value">{user.role || 'investor'}</span>
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
                        <div className="wallet-label">{t('users.currentBalance')}</div>
                        <div className="wallet-amount">{formatCurrency(wallet.balance)}</div>
                        <div className="wallet-meta">
                          <div className="wallet-meta-item">
                            <div className="wallet-meta-label">{t('users.updated')}</div>
                            <div className="wallet-meta-value">{formatDate(wallet.updatedAt)}</div>
                          </div>
                          <div className="wallet-meta-item">
                            <div className="wallet-meta-label">{t('users.currency')}</div>
                            <div className="wallet-meta-value">USD</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-state-icon">💰</div>
                      <div className="empty-state-message">{t('users.noWalletInfo')}</div>
                    </div>
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
                            <th>{t('users.amount')}</th>
                            <th>{t('users.status')}</th>
                            <th>{t('users.date')}</th>
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
                    <div className="empty-state">
                      <div className="empty-state-icon">📈</div>
                      <div className="empty-state-message">{t('users.noInvestments')}</div>
                    </div>
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
                            <th>{t('users.amount')}</th>
                            <th>{t('users.status')}</th>
                            <th>{t('users.date')}</th>
                            <th>{t('users.action')}</th>
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
                    <div className="empty-state">
                      <div className="empty-state-icon">🔄</div>
                      <div className="empty-state-message">{t('users.noTopups')}</div>
                    </div>
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
                            <th>{t('users.amount')}</th>
                            <th>{t('users.status')}</th>
                            <th>{t('users.date')}</th>
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
                    <div className="empty-state">
                      <div className="empty-state-icon">💸</div>
                      <div className="empty-state-message">{t('users.noWithdrawals')}</div>
                    </div>
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
                            <th>{t('users.type')}</th>
                            <th>{t('users.amount')}</th>
                            <th>{t('users.date')}</th>
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
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <div className="empty-state-message">{t('users.noTransactions')}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <ActionModal
        isOpen={actionModal.isOpen}
        title={actionModal.type === 'approve' ? t('topups.approveTitle') : t('topups.rejectTitle')}
        message={`${actionModal.type === 'approve' ? t('topups.approveMessage') : t('topups.rejectMessage')} ${selectedTopup ? formatCurrency(selectedTopup.amount) : ''}?`}
        actionLabel={actionModal.type === 'approve' ? t('common.approve') : t('common.reject')}
        showReasonInput={actionModal.type === 'reject'}
        reasonPlaceholder={t('common.rejectReason')}
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
