import React, { useState, useMemo } from 'react';
import useAdminTopups from '../hooks/useAdminTopups';
import useApproveTopup from '../hooks/mutations/useApproveTopup';
import useRejectTopup from '../hooks/mutations/useRejectTopup';
import ActionModal from '../components/modals/ActionModal';
import RechargeMethodsModal from '../components/modals/RechargeMethodsModal';
import { useLanguage } from '../../context/LanguageContext';
import './RecargasPage.css';

export default function RecargasPage({ adminData }) {
  const [filter, setFilter] = useState('all');
  const [selectedTopup, setSelectedTopup] = useState(null);
  const [actionModal, setActionModal] = useState({ isOpen: false, type: null });
  const [methodsModalOpen, setMethodsModalOpen] = useState(false);
  const { topups, loading, refetch } = useAdminTopups({ status: filter });
  const { approve: approveTopup, loading: approveLoading } = useApproveTopup();
  const { reject: rejectTopup, loading: rejectLoading } = useRejectTopup();
  const { t } = useLanguage();

  const filters = [
    { value: 'all', label: t('topups.allStatuses') },
    { value: 'pending', label: t('topups.pendingPlural') },
    { value: 'approved', label: t('topups.approvedPlural') },
    { value: 'rejected', label: t('topups.rejectedPlural') },
  ];

  // Stats
  const stats = useMemo(() => {
    const pending = topups.filter(t => t.status === 'pending');
    const approved = topups.filter(t => t.status === 'approved');
    return {
      pendingCount: pending.length,
      pendingTotal: pending.reduce((s, t) => s + Number(t.amount || 0), 0),
      approvedToday: approved.filter(t => {
        const d = t.approvedAt?.toDate ? t.approvedAt.toDate() : new Date(t.approvedAt);
        const today = new Date();
        return d && d.toDateString() === today.toDateString();
      }).length,
    };
  }, [topups]);

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
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  const getProofUrl = (topup) => topup?.proofUrl || topup?.receiptUrl || null;

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return t('topups.pending');
      case 'approved': return t('topups.approved');
      case 'rejected': return t('topups.rejected');
      default: return status;
    }
  };

  return (
    <div className="recargas-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('topups.title')}</h1>
          <p className="page-subtitle">{t('topups.subtitle')}</p>
        </div>
        <button
          className="btn-methods"
          onClick={() => setMethodsModalOpen(true)}
          type="button"
        >
          {t('topups.rechargeMethods')}
        </button>
      </div>

      {/* Stats Row */}
      <div className="recargas-stats">
        <div className="rec-stat pending-bg">
          <div className="rec-stat-label">{t('topups.pendingPlural')}</div>
          <div className="rec-stat-value">{stats.pendingCount}</div>
          <div className="rec-stat-sub">{formatCurrency(stats.pendingTotal)} {t('common.total')}</div>
        </div>
        <div className="rec-stat approved-bg">
          <div className="rec-stat-label">{t('topups.approvedToday')}</div>
          <div className="rec-stat-value">{stats.approvedToday}</div>
        </div>
        <div className="rec-stat total-bg">
          <div className="rec-stat-label">{t('topups.totalTopups')}</div>
          <div className="rec-stat-value">{topups.length}</div>
        </div>
      </div>

      <div className="recargas-filters">
        {filters.map(f => (
          <button
            key={f.value}
            className={`filter-btn ${filter === f.value ? 'active' : ''}`}
            onClick={() => { setFilter(f.value); setSelectedTopup(null); }}
          >
            {f.label}
            <span className="filter-count">
              {f.value === 'all' ? topups.length : topups.filter(t => t.status === f.value).length}
            </span>
          </button>
        ))}
      </div>

      {/* Split Panel: Table + Detail */}
      <div className="recargas-split">
        <div className="recargas-card">
          {loading ? (
            <div className="loading-state">{t('topups.loadingTopups')}</div>
          ) : topups.length === 0 ? (
            <div className="empty-state">{t('topups.noTopups')}</div>
          ) : (
            <div className="table-wrapper">
              <table className="recargas-table">
                <thead>
                  <tr>
                    <th>{t('topups.user')}</th>
                    <th>{t('topups.amount')}</th>
                    <th>{t('topups.method')}</th>
                    <th>{t('topups.status')}</th>
                    <th>{t('topups.date')}</th>
                    <th>{t('topups.action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {topups.map(topup => (
                    <tr
                      key={topup.id}
                      className={selectedTopup?.id === topup.id ? 'row-selected' : ''}
                      onClick={() => setSelectedTopup(topup)}
                    >
                      <td className="email-cell">{topup.userEmail || topup.userId || t('common.emailNotAvailable')}</td>
                      <td className="amount-cell">{formatCurrency(topup.amount)}</td>
                      <td>{topup.method || '-'}</td>
                      <td>
                        <span className={`status-badge status-${topup.status}`}>
                          {getStatusLabel(topup.status)}
                        </span>
                      </td>
                      <td>{formatDate(topup.createdAt)}</td>
                      <td>
                        <div className="action-buttons">
                          {topup.status === 'pending' && (
                            <>
                              <button
                                className="btn-action btn-approve"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTopup(topup);
                                  setActionModal({ isOpen: true, type: 'approve' });
                                }}
                                title={t('common.approve')}
                              >
                                ✓
                              </button>
                              <button
                                className="btn-action btn-reject"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTopup(topup);
                                  setActionModal({ isOpen: true, type: 'reject' });
                                }}
                                title={t('common.reject')}
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

        {/* Detail Sidebar */}
        <div className={`recargas-detail ${selectedTopup ? 'has-selection' : ''}`}>
          {selectedTopup ? (
            <>
              <div className="detail-header">
                <h3>{t('topups.depositDetail')}</h3>
                <button className="detail-close" onClick={() => setSelectedTopup(null)}>✕</button>
              </div>
              <div className="detail-body">
                <div className="detail-row">
                  <span className="detail-label">{t('topups.user')}</span>
                  <span className="detail-value">{selectedTopup.userEmail || selectedTopup.userId}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t('topups.amount')}</span>
                  <span className="detail-value accent">{formatCurrency(selectedTopup.amount)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t('topups.method')}</span>
                  <span className="detail-value">{selectedTopup.method || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t('topups.status')}</span>
                  <span className={`status-badge status-${selectedTopup.status}`}>{getStatusLabel(selectedTopup.status)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t('topups.date')}</span>
                  <span className="detail-value">{formatDate(selectedTopup.createdAt)}</span>
                </div>
                {selectedTopup.reference && (
                  <div className="detail-row">
                    <span className="detail-label">{t('topups.reference')}</span>
                    <span className="detail-value mono">{selectedTopup.reference}</span>
                  </div>
                )}
                {getProofUrl(selectedTopup) && (
                  <div className="detail-proof">
                    <span className="detail-label">{t('topups.receipt')}</span>
                    <div className="proof-preview">
                      <img src={getProofUrl(selectedTopup)} alt={t('topups.viewProof')} />
                    </div>
                  </div>
                )}
                {selectedTopup.status === 'pending' && (
                  <div className="detail-actions">
                    <button
                      className="btn-detail-approve"
                      onClick={() => setActionModal({ isOpen: true, type: 'approve' })}
                    >
                      ✓ {t('common.approve')}
                    </button>
                    <button
                      className="btn-detail-reject"
                      onClick={() => setActionModal({ isOpen: true, type: 'reject' })}
                    >
                      ✕ {t('common.reject')}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="detail-empty">
              <span className="detail-empty-icon">📋</span>
              <p>{t('topups.selectToView')}</p>
            </div>
          )}
        </div>
      </div>

      <ActionModal
        isOpen={actionModal.isOpen}
        title={actionModal.type === 'approve' ? t('topups.approveTitle') : t('topups.rejectTitle')}
        message={`${actionModal.type === 'approve' ? t('topups.approveMessage') : t('topups.rejectMessage')} ${selectedTopup ? formatCurrency(selectedTopup.amount) : ''} ${t('topups.ofUser')} ${selectedTopup?.userEmail || selectedTopup?.userId}?`}
        actionLabel={actionModal.type === 'approve' ? t('common.approve') : t('common.reject')}
        showReasonInput={actionModal.type === 'reject'}
        reasonPlaceholder={t('common.rejectReason')}
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
