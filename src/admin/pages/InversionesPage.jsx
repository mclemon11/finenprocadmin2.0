import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAdminInvestments from '../hooks/useAdminInvestments';
import useAdminProjects from '../hooks/useAdminProjects';
import useApproveInvestment from '../hooks/mutations/useApproveInvestment';
import useRejectInvestment from '../hooks/mutations/useRejectInvestment';
import ActionModal from '../components/modals/ActionModal';
import { useLanguage } from '../../context/LanguageContext';
import './InversionesPage.css';

export default function InversionesPage({ adminData }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialProject = searchParams.get('projectId') || '';
  const initialUser = searchParams.get('userId') || '';
  const { t } = useLanguage();

  const [filters, setFilters] = useState({ status: 'all', projectId: initialProject, userId: initialUser, search: '' });

  const { projects } = useAdminProjects();
  const { investments, loading, totalAmount, refetch } = useAdminInvestments({
    status: filters.status,
    projectId: filters.projectId || undefined,
    userId: filters.userId || undefined,
  });

  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [actionModal, setActionModal] = useState({ isOpen: false, type: null });
  const { approve: approveInvestment, loading: approveLoading } = useApproveInvestment();
  const { reject: rejectInvestment, loading: rejectLoading } = useRejectInvestment();

  useEffect(() => {
    // Sincroniza filtros con query params para navegar desde otros módulos.
    setFilters((prev) => ({
      ...prev,
      projectId: initialProject,
      userId: initialUser,
    }));
  }, [initialProject, initialUser]);

  const statusFilters = [
    { value: 'all', label: t('investments.allStatuses') },
    { value: 'active', label: t('investments.activePlural') },
    { value: 'completed', label: t('investments.completedPlural') },
    { value: 'cancelled', label: t('investments.cancelledPlural') },
  ];

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('es-MX');
  };

  const formatROI = (roiValue) => {
    if (roiValue === null || roiValue === undefined) return '—';
    return `${roiValue.toFixed(2)}%`;
  };

  const filteredInvestments = useMemo(() => {
    const term = filters.search.toLowerCase();
    return investments.filter((inv) => {
      const matchesUser = term
        ? (inv.userEmail?.toLowerCase().includes(term) || inv.userName?.toLowerCase().includes(term))
        : true;
      return matchesUser;
    });
  }, [investments, filters.search]);

  const goToUser = (userId) => {
    if (!userId) return;
    navigate(`/admin/usuarios?uid=${userId}`);
  };

  const goToProject = (projectId) => {
    if (!projectId) return;
    navigate(`/admin/proyectos?projectId=${projectId}`);
  };

  const handleApprove = async () => {
    if (!selectedInvestment) return;
    const success = await approveInvestment(
      selectedInvestment.id,
      adminData?.uid,
      adminData?.email
    );
    if (success) {
      setActionModal({ isOpen: false, type: null });
      setSelectedInvestment(null);
      refetch?.();
    }
  };

  const handleReject = async (reason) => {
    if (!selectedInvestment) return;
    const success = await rejectInvestment(
      selectedInvestment.id,
      reason,
      adminData?.uid,
      adminData?.email
    );
    if (success) {
      setActionModal({ isOpen: false, type: null });
      setSelectedInvestment(null);
      refetch?.();
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return t('investments.active');
      case 'completed': return t('investments.completed');
      case 'cancelled': return t('investments.cancelled');
      default: return status;
    }
  };

  return (
    <div className="inversiones-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('investments.title')}</h1>
          <p className="page-subtitle">{t('investments.subtitle')}</p>
        </div>
      </div>

      <div className="inversiones-summary">
        <div className="summary-card">
          <div className="summary-label">{t('investments.totalInvested')}</div>
          <div className="summary-value">{formatCurrency(totalAmount)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">{t('investments.activeInvestments')}</div>
          <div className="summary-value">{investments.filter(i => i.status === 'active').length}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">{t('investments.totalInvestments')}</div>
          <div className="summary-value">{investments.length}</div>
        </div>
      </div>

      <div className="inversiones-filters">
        {statusFilters.map(f => (
          <button
            key={f.value}
            className={`filter-btn ${filters.status === f.value ? 'active' : ''}`}
            onClick={() => setFilters({ ...filters, status: f.value })}
          >
            {f.label}
            <span className="filter-count">
              {f.value === 'all' ? investments.length : investments.filter(i => i.status === f.value).length}
            </span>
          </button>
        ))}

        <select
          className="filter-select"
          value={filters.projectId}
          onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
        >
          <option value="">{t('investments.allProjects')}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name || t('investments.projectNoName')}</option>
          ))}
        </select>

        <input
          type="text"
          className="filter-input"
          placeholder={t('investments.searchUserPlaceholder')}
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>

      <div className="inversiones-card">
        <div className="card-header">
          <h3>{t('nav.investments')}</h3>
        </div>

        {loading ? (
          <div className="loading-state">{t('investments.loadingInvestments')}</div>
        ) : filteredInvestments.length === 0 ? (
          <div className="empty-state">{t('investments.noInvestments')}</div>
        ) : (
          <div className="table-wrapper">
            <table className="inversiones-table">
              <thead>
                <tr>
                  <th>{t('investments.user')}</th>
                  <th>{t('investments.project')}</th>
                  <th>{t('investments.amount')}</th>
                  <th>{t('investments.expectedROI')}</th>
                  <th>{t('investments.actualROI')}</th>
                  <th>{t('investments.status')}</th>
                  <th>{t('investments.date')}</th>
                  <th>{t('investments.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvestments.map(inv => (
                  <tr key={inv.id}>
                    <td>
                      <div className="cell-title">{inv.userName || t('investments.userNoData')}</div>
                      <div className="cell-subtle">{inv.userEmail || t('common.emailNotAvailable')}</div>
                    </td>
                    <td>
                      <div className="cell-title">{inv.projectName || t('investments.projectNoName')}</div>
                      <div className="cell-subtle">{inv.expectedReturn ? t('investments.withExpectedReturn') : t('investments.noExpectedReturn')}</div>
                    </td>
                    <td className="amount-cell">{formatCurrency(inv.amount)}</td>
                    <td>
                      <span className={`roi-badge ${Number(inv.expectedROI) >= 0 ? 'roi-positive' : 'roi-negative'}`}>
                        {formatROI(inv.expectedROI)}
                      </span>
                    </td>
                    <td>
                      <span className={`roi-badge ${Number(inv.actualROI) >= 0 ? 'roi-positive' : 'roi-negative'}`}>
                        {formatROI(inv.actualROI)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${inv.status}`}>
                        {getStatusLabel(inv.status)}
                      </span>
                    </td>
                    <td>{formatDate(inv.createdAt)}</td>
                    <td className="actions-cell">
                      <button className="link-btn" onClick={() => goToUser(inv.userId)}>{t('investments.viewUser')}</button>
                      <button className="link-btn" onClick={() => goToProject(inv.projectId)} disabled={!inv.projectId}>{t('investments.viewProject')}</button>
                      {inv.status === 'pending' && (
                        <>
                          <button
                            className="link-btn"
                            onClick={() => {
                              setSelectedInvestment(inv);
                              setActionModal({ isOpen: true, type: 'approve' });
                            }}
                            disabled={approveLoading || rejectLoading}
                          >
                            {t('common.approve')}
                          </button>
                          <button
                            className="link-btn"
                            onClick={() => {
                              setSelectedInvestment(inv);
                              setActionModal({ isOpen: true, type: 'reject' });
                            }}
                            disabled={approveLoading || rejectLoading}
                          >
                            {t('common.reject')}
                          </button>
                        </>
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
        title={actionModal.type === 'approve' ? t('investments.approveTitle') : t('investments.rejectTitle')}
        message={`${actionModal.type === 'approve' ? t('investments.approveMessage') : t('investments.rejectMessage')} ${selectedInvestment ? formatCurrency(selectedInvestment.amount) : ''} ${t('topups.ofUser')} ${selectedInvestment?.userEmail || selectedInvestment?.userId}? ${actionModal.type === 'approve' ? t('investments.willDeductBalance') : ''}`}
        actionLabel={actionModal.type === 'approve' ? t('common.approve') : t('common.reject')}
        showReasonInput={actionModal.type === 'reject'}
        reasonPlaceholder={t('common.rejectReason')}
        loading={approveLoading || rejectLoading}
        onConfirm={actionModal.type === 'approve' ? handleApprove : handleReject}
        onCancel={() => {
          setActionModal({ isOpen: false, type: null });
          setSelectedInvestment(null);
        }}
      />
    </div>
  );
}
