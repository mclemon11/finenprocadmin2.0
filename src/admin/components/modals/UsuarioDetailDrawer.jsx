import React, { useState, useEffect } from 'react';
import useApproveTopup from '../../hooks/mutations/useApproveTopup';
import useRejectTopup from '../../hooks/mutations/useRejectTopup';
import ActionModal from './ActionModal';
import { useLanguage } from '../../../context/LanguageContext';
import { getFullKycProfile, approveKyc, rejectKyc } from '../../../services/kyc.service';
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

  // KYC state
  const [kycProfile, setKycProfile] = useState(null);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycActionLoading, setKycActionLoading] = useState(false);
  const [kycRejectReason, setKycRejectReason] = useState('');
  const [showKycRejectInput, setShowKycRejectInput] = useState(false);

  useEffect(() => {
    if (isOpen && user?.uid && activeTab === 'kyc') {
      loadKycProfile();
    }
  }, [isOpen, user?.uid, activeTab]);

  const loadKycProfile = async () => {
    if (!user?.uid) return;
    setKycLoading(true);
    const result = await getFullKycProfile(user.uid);
    if (result.success) {
      setKycProfile(result.data);
    }
    setKycLoading(false);
  };

  const handleApproveKyc = async () => {
    if (!user?.uid) return;
    setKycActionLoading(true);
    const result = await approveKyc(user.uid);
    if (result.success) {
      await loadKycProfile();
      onActionComplete?.();
    }
    setKycActionLoading(false);
  };

  const handleRejectKyc = async () => {
    if (!user?.uid || !kycRejectReason.trim()) return;
    setKycActionLoading(true);
    const result = await rejectKyc(user.uid, kycRejectReason.trim());
    if (result.success) {
      setKycRejectReason('');
      setShowKycRejectInput(false);
      await loadKycProfile();
      onActionComplete?.();
    }
    setKycActionLoading(false);
  };

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
            <div className="header-avatar-section">
              {user?.photoURL || user?.photoUrl ? (
                <img 
                  src={user.photoURL || user.photoUrl} 
                  alt={user?.displayName || user?.email}
                  className="drawer-avatar"
                />
              ) : (
                <div className="drawer-avatar-placeholder">
                  {(user?.displayName || user?.email || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="header-info">
                <h2 className="drawer-title">{user?.displayName || user?.email || t('users.user')}</h2>
                <p className="drawer-email">{user?.email}</p>
              </div>
            </div>
            <div className="header-badges">
              <span className={`status-badge status-${user?.status}`}>
                {user?.status === 'active' ? `● ${t('status.active')}` : `○ ${t('status.inactive')}`}
              </span>
              <span className="role-badge">{user?.role || 'Investor'}</span>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label={t('common.close')}></button>
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
                 {t('users.tabs.summary')}
              </button>
              <button
                className={`tab-btn ${activeTab === 'wallet' ? 'active' : ''}`}
                onClick={() => setActiveTab('wallet')}
              >
                 {t('users.tabs.wallet')}
              </button>
              <button
                className={`tab-btn ${activeTab === 'inversiones' ? 'active' : ''}`}
                onClick={() => setActiveTab('inversiones')}
              >
                 {t('users.tabs.investments')}
              </button>
              <button
                className={`tab-btn ${activeTab === 'recargas' ? 'active' : ''}`}
                onClick={() => setActiveTab('recargas')}
              >
                 {t('users.tabs.topups')}
              </button>
              <button
                className={`tab-btn ${activeTab === 'retiros' ? 'active' : ''}`}
                onClick={() => setActiveTab('retiros')}
              >
                 {t('users.tabs.withdrawals')}
              </button>
              <button
                className={`tab-btn ${activeTab === 'transacciones' ? 'active' : ''}`}
                onClick={() => setActiveTab('transacciones')}
              >
                 {t('users.tabs.transactions')}
              </button>
              <button
                className={`tab-btn ${activeTab === 'kyc' ? 'active' : ''}`}
                onClick={() => setActiveTab('kyc')}
              >
                 {t('users.tabs.kyc') || 'KYC'}
                {user?.kycStatus === 'pending' && <span className="kyc-pending-dot" />}
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
                      <div className="empty-state-icon"></div>
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
                      <div className="empty-state-icon"></div>
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
                                      
                                    </button>
                                    <button
                                      className="btn-action btn-reject"
                                      onClick={() => {
                                        setSelectedTopup(topup);
                                        setActionModal({ isOpen: true, type: 'reject' });
                                      }}
                                    >
                                      
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
                      <div className="empty-state-icon"></div>
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
                      <div className="empty-state-icon"></div>
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
                      <div className="empty-state-icon"></div>
                      <div className="empty-state-message">{t('users.noTransactions')}</div>
                    </div>
                  )}
                </div>
              )}

              {/* KYC */}
              {activeTab === 'kyc' && (
                <div className="tab-pane">
                  {kycLoading ? (
                    <div className="drawer-loading">{t('common.loading') || 'Loading...'}...</div>
                  ) : kycProfile ? (
                    <div className="kyc-review-section">
                      {/* KYC Status Badge */}
                      <div className="kyc-status-header">
                        <span className="tech-label">{t('users.kyc.status') || 'KYC Status'}</span>
                        <span className={`status-badge status-${kycProfile.kycStatus}`}>
                          {kycProfile.kycStatus === 'approved' ? (t('users.kyc.approved') || 'Approved') :
                           kycProfile.kycStatus === 'rejected' ? (t('users.kyc.rejected') || 'Rejected') :
                           kycProfile.kycStatus === 'pending' ? (t('users.kyc.pending') || 'Pending') :
                           (t('users.kyc.notSubmitted') || 'Not Submitted')}
                        </span>
                      </div>

                      {kycProfile.kycRejectionReason && (
                        <div className="kyc-rejection-reason">
                          <strong>{t('users.kyc.rejectionReason') || 'Rejection Reason'}:</strong> {kycProfile.kycRejectionReason}
                        </div>
                      )}

                      {/* Account Type */}
                      <div className="section-title">{t('users.kyc.profileInfo') || 'Profile Info'}</div>
                      <div className="summary-cards">
                        <div className="summary-card">
                          <div className="card-label">{t('users.kyc.accountType') || 'Account Type'}</div>
                          <div className="card-value">{kycProfile.type === 'company' ? (t('kyc.company') || 'Company') : (t('kyc.individual') || 'Individual')}</div>
                        </div>
                        <div className="summary-card">
                          <div className="card-label">{t('users.kyc.fullName') || 'Full Name'}</div>
                          <div className="card-value">{kycProfile.fullName || '—'}</div>
                        </div>
                        <div className="summary-card">
                          <div className="card-label">{t('users.kyc.documentType') || 'Document Type'}</div>
                          <div className="card-value">{kycProfile.documentType || '—'}</div>
                        </div>
                        <div className="summary-card">
                          <div className="card-label">{t('users.kyc.documentNumber') || 'Document Number'}</div>
                          <div className="card-value">{kycProfile.documentNumber || '—'}</div>
                        </div>
                        <div className="summary-card">
                          <div className="card-label">{t('users.kyc.country') || 'Country'}</div>
                          <div className="card-value">{kycProfile.country || '—'}</div>
                        </div>
                        <div className="summary-card">
                          <div className="card-label">{t('users.kyc.address') || 'Address'}</div>
                          <div className="card-value">{kycProfile.address || '—'}</div>
                        </div>
                        {kycProfile.type === 'company' && (
                          <>
                            <div className="summary-card">
                              <div className="card-label">{t('users.kyc.companyName') || 'Company Name'}</div>
                              <div className="card-value">{kycProfile.companyName || '—'}</div>
                            </div>
                            <div className="summary-card">
                              <div className="card-label">{t('users.kyc.taxId') || 'Tax ID'}</div>
                              <div className="card-value">{kycProfile.taxId || '—'}</div>
                            </div>
                            <div className="summary-card">
                              <div className="card-label">{t('users.kyc.legalRep') || 'Legal Rep.'}</div>
                              <div className="card-value">{kycProfile.legalRepresentative || '—'}</div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* KYC Documents */}
                      <div className="section-title">{t('users.kyc.documents') || 'Documents'}</div>
                      <div className="kyc-documents-grid">
                        {kycProfile.documents?.personalIdentification && (
                          <div className="kyc-doc-item">
                            <div className="card-label">{t('users.kyc.personalId') || 'Personal ID'}</div>
                            <a href={kycProfile.documents.personalIdentification} target="_blank" rel="noopener noreferrer" className="kyc-doc-link">
                              📄 {t('users.kyc.viewDocument') || 'View Document'}
                            </a>
                          </div>
                        )}
                        {kycProfile.documents?.passport && (
                          <div className="kyc-doc-item">
                            <div className="card-label">{t('users.kyc.passport') || 'Passport'}</div>
                            <a href={kycProfile.documents.passport} target="_blank" rel="noopener noreferrer" className="kyc-doc-link">
                              📄 {t('users.kyc.viewDocument') || 'View Document'}
                            </a>
                          </div>
                        )}
                        {kycProfile.documents?.proofOfAddress && (
                          <div className="kyc-doc-item">
                            <div className="card-label">{t('users.kyc.proofOfAddress') || 'Proof of Address'}</div>
                            <a href={kycProfile.documents.proofOfAddress} target="_blank" rel="noopener noreferrer" className="kyc-doc-link">
                              📄 {t('users.kyc.viewDocument') || 'View Document'}
                            </a>
                          </div>
                        )}
                        {!kycProfile.documents?.personalIdentification && !kycProfile.documents?.passport && !kycProfile.documents?.proofOfAddress && (
                          <div className="empty-state">
                            <div className="empty-state-message">{t('users.kyc.noDocuments') || 'No documents uploaded'}</div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {kycProfile.kycStatus === 'pending' && (
                        <div className="kyc-actions">
                          <button
                            className="btn-action btn-approve kyc-action-btn"
                            onClick={handleApproveKyc}
                            disabled={kycActionLoading}
                          >
                            ✅ {t('users.kyc.approve') || 'Approve KYC'}
                          </button>

                          {!showKycRejectInput ? (
                            <button
                              className="btn-action btn-reject kyc-action-btn"
                              onClick={() => setShowKycRejectInput(true)}
                              disabled={kycActionLoading}
                            >
                              ❌ {t('users.kyc.reject') || 'Reject KYC'}
                            </button>
                          ) : (
                            <div className="kyc-reject-form">
                              <textarea
                                className="kyc-reject-textarea"
                                placeholder={t('users.kyc.rejectReasonPlaceholder') || 'Enter rejection reason...'}
                                value={kycRejectReason}
                                onChange={(e) => setKycRejectReason(e.target.value)}
                                rows={3}
                              />
                              <div className="kyc-reject-buttons">
                                <button
                                  className="btn-action btn-reject kyc-action-btn"
                                  onClick={handleRejectKyc}
                                  disabled={kycActionLoading || !kycRejectReason.trim()}
                                >
                                  {t('users.kyc.confirmReject') || 'Confirm Reject'}
                                </button>
                                <button
                                  className="btn-action kyc-action-btn"
                                  onClick={() => { setShowKycRejectInput(false); setKycRejectReason(''); }}
                                >
                                  {t('common.cancel') || 'Cancel'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Timestamps */}
                      {(kycProfile.kycSubmittedAt || kycProfile.kycReviewedAt) && (
                        <div className="technical-section" style={{ marginTop: '1rem' }}>
                          {kycProfile.kycSubmittedAt && (
                            <div className="tech-info-row">
                              <span className="tech-label">{t('users.kyc.submittedAt') || 'Submitted'}</span>
                              <span className="tech-value">{formatDate(kycProfile.kycSubmittedAt?.toDate ? kycProfile.kycSubmittedAt.toDate() : kycProfile.kycSubmittedAt)}</span>
                            </div>
                          )}
                          {kycProfile.kycReviewedAt && (
                            <div className="tech-info-row">
                              <span className="tech-label">{t('users.kyc.reviewedAt') || 'Reviewed'}</span>
                              <span className="tech-value">{formatDate(kycProfile.kycReviewedAt?.toDate ? kycProfile.kycReviewedAt.toDate() : kycProfile.kycReviewedAt)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <div className="empty-state-message">{t('users.kyc.noKycData') || 'No KYC data available'}</div>
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
