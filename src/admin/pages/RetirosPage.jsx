import React, { useState, useMemo } from 'react';
import useAdminWithdrawals from '../hooks/useAdminWithdrawals';
import useApproveWithdrawal from '../hooks/mutations/useApproveWithdrawal';
import useRejectWithdrawal from '../hooks/mutations/useRejectWithdrawal';
import ActionModal from '../components/modals/ActionModal';
import { useLanguage } from '../../context/LanguageContext';
import './RetirosPage.css';

export default function RetirosPage({ adminData }) {
  const [filter, setFilter] = useState('all');
  const [pageSize, setPageSize] = useState(25);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [actionModal, setActionModal] = useState({ isOpen: false, type: null });
  const { t } = useLanguage();
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
    { value: 'all', label: t('withdrawals.allStatuses') },
    { value: 'pending', label: t('withdrawals.pendingPlural') },
    { value: 'approved', label: t('withdrawals.approvedPlural') },
    { value: 'rejected', label: t('withdrawals.rejectedPlural') },
  ];

  // Stats
  const stats = useMemo(() => {
    const pending = withdrawals.filter(w => w.status === 'pending');
    const rejected = withdrawals.filter(w => w.status === 'rejected');
    const pendingTotal = pending.reduce((s, w) => s + Number(w.amount || 0), 0);
    const approvedToday = withdrawals.filter(w => {
      if (w.status !== 'approved') return false;
      const d = w.approvedAt?.toDate ? w.approvedAt.toDate() : new Date(w.approvedAt || w.updatedAt);
      const today = new Date();
      return d && d.toDateString() === today.toDateString();
    }).length;
    return { pendingCount: pending.length, pendingTotal, approvedToday, rejectedCount: rejected.length };
  }, [withdrawals]);

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

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return t('withdrawals.pending');
      case 'approved': return t('withdrawals.approved');
      case 'rejected': return t('withdrawals.rejected');
      default: return status;
    }
  };

  return (
    <div className="retiros-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('withdrawals.title')}</h1>
          <p className="page-subtitle">{t('withdrawals.subtitle')}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="retiros-stats">
        <div className="ret-stat amber">
          <div className="ret-stat-label">{t('withdrawals.totalPending')}</div>
          <div className="ret-stat-value">{formatCurrency(stats.pendingTotal)}</div>
          <div className="ret-stat-sub">{stats.pendingCount} {t('withdrawals.requests')}</div>
        </div>
        <div className="ret-stat green">
          <div className="ret-stat-label">{t('withdrawals.todayApprovals')}</div>
          <div className="ret-stat-value">{stats.approvedToday}</div>
        </div>
        <div className="ret-stat red">
          <div className="ret-stat-label">{t('withdrawals.rejectedCount')}</div>
          <div className="ret-stat-value">{stats.rejectedCount}</div>
        </div>
      </div>

      <div className="retiros-filters">
        {filters.map(f => (
          <button
            key={f.value}
            className={`filter-btn ${filter === f.value ? 'active' : ''}`}
            onClick={() => setFilter(f.value)}
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
          <span className="retiros-control-label">{t('common.show')}</span>
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
          <span className="retiros-control-label">{t('common.perPage')}</span>
        </div>

        <div className="retiros-pagination">
          <button className="pagination-btn" onClick={prevPage} disabled={loading || page <= 1}>
            ← {t('common.previous')}
          </button>
          <span className="pagination-status">{t('common.page')} {page}</span>
          <button className="pagination-btn" onClick={nextPage} disabled={loading || !hasNextPage}>
            {t('common.next')} →
          </button>
        </div>
      </div>

      <div className="retiros-card">
        <div className="card-header">
          <h3>{t('withdrawals.totalWithdrawals')}: {withdrawals.length}</h3>
        </div>

        {loading ? (
          <div className="loading-state">{t('withdrawals.loadingWithdrawals')}</div>
        ) : withdrawals.length === 0 ? (
          <div className="empty-state">{t('withdrawals.noWithdrawals')}</div>
        ) : (
          <div className="table-wrapper">
            <table className="retiros-table">
              <thead>
                <tr>
                  <th></th>
                  <th>{t('withdrawals.user')}</th>
                  <th>{t('withdrawals.amount')}</th>
                  <th>{t('withdrawals.method')}</th>
                  <th>{t('withdrawals.status')}</th>
                  <th>{t('withdrawals.date')}</th>
                  <th>{t('withdrawals.action')}</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map(withdrawal => (
                  <tr key={withdrawal.id}>
                    <td className="avatar-cell">
                      {withdrawal.userPhotoURL ? (
                        <img
                          src={withdrawal.userPhotoURL}
                          alt={withdrawal.userName || withdrawal.userEmail}
                          className="ret-user-avatar"
                        />
                      ) : (
                        <div className="ret-user-avatar-placeholder">
                          {(withdrawal.userName || withdrawal.userEmail || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td className="email-cell">
                      <div className="cell-title">{withdrawal.userName || '-'}</div>
                      <div className="cell-subtle">{withdrawal.userEmail || withdrawal.userId || t('common.emailNotAvailable')}</div>
                    </td>
                    <td className="amount-cell">{formatCurrency(withdrawal.amount)}</td>
                    <td>{withdrawal.method || '-'}</td>
                    <td>
                      <span className={`status-badge status-${withdrawal.status}`}>
                        {getStatusLabel(withdrawal.status)}
                      </span>
                    </td>
                    <td>{formatDate(withdrawal.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        {withdrawal.status === 'pending' && (
                          <>
                            <button
                              className="btn-action btn-approve"
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setActionModal({ isOpen: true, type: 'approve' });
                              }}
                              title={t('common.approve')}
                            >
                               {t('common.approve')}
                            </button>
                            <button
                              className="btn-action btn-reject"
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setActionModal({ isOpen: true, type: 'reject' });
                              }}
                              title={t('common.reject')}
                            >
                              
                            </button>
                          </>
                        )}
                        {withdrawal.status === 'approved' && (
                          <span className="action-label completed-label"> {t('withdrawals.processed')}</span>
                        )}
                        {withdrawal.status === 'rejected' && (
                          <span className="action-label rejected-label">— {t('withdrawals.rejected')}</span>
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

      <ActionModal
        isOpen={actionModal.isOpen}
        title={actionModal.type === 'approve' ? t('withdrawals.approveTitle') : t('withdrawals.rejectTitle')}
        message={`${actionModal.type === 'approve' ? t('withdrawals.approveMessage') : t('withdrawals.rejectMessage')} ${selectedWithdrawal ? formatCurrency(selectedWithdrawal.amount) : ''} ${t('topups.ofUser')} ${selectedWithdrawal?.userEmail || selectedWithdrawal?.userId}?`}
        actionLabel={actionModal.type === 'approve' ? t('common.approve') : t('common.reject')}
        showReasonInput={actionModal.type === 'reject'}
        reasonPlaceholder={t('common.rejectReason')}
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
