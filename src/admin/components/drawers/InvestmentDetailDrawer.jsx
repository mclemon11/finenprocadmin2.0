import React, { useState } from 'react';
import useInvestmentDetail from '../../hooks/useInvestmentDetail';
import {
  useChangeInvestmentStatus,
  useRecordInvestmentSystemEvent,
  useUpdateInvestmentReturn,
} from '../../hooks/mutations/useInvestmentMutations';
import { useLanguage } from '../../../context/LanguageContext';
import './InvestmentDetailDrawer.css';

export default function InvestmentDetailDrawer({ investmentId, isOpen, onClose, onUpdate }) {
  const { t } = useLanguage();
  const { investment, user, project, projectEvents, auditLog, loading, error, refetch } =
    useInvestmentDetail(investmentId);

  const [activeTab, setActiveTab] = useState('overview');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '—';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStatusChange = async (newStatus, reason) => {
    try {
      setIsActionLoading(true);
      setActionError(null);
      await useChangeInvestmentStatus(investmentId, newStatus, reason);
      setSuccessMessage(`${t('investments.investmentUpdatedTo')} ${newStatus}`);
      await refetch();
      onUpdate?.();
      setIsStatusModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRecordEvent = async (eventTitle, eventDescription, metadata) => {
    try {
      setIsActionLoading(true);
      setActionError(null);
      await useRecordInvestmentSystemEvent(investmentId, eventTitle, eventDescription, metadata);
      setSuccessMessage(t('investments.eventRecorded'));
      await refetch();
      onUpdate?.();
      setIsEventModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUpdateReturn = async (realizedReturn, notes) => {
    try {
      setIsActionLoading(true);
      setActionError(null);
      await useUpdateInvestmentReturn(investmentId, realizedReturn, notes);
      setSuccessMessage(t('investments.returnUpdated'));
      await refetch();
      onUpdate?.();
      setIsReturnModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="investment-drawer-overlay" onClick={onClose}></div>
      <div className="investment-drawer">
        {/* Header */}
        <div className="investment-drawer-header">
          <div className="header-top">
            <button className="close-btn" onClick={onClose}>
              ← {t('investments.back')}
            </button>
            <h2 className="header-title">{t('investments.investmentDetail')}</h2>
          </div>

          {loading ? (
            <div className="loading-state">{t('investments.loading')}</div>
          ) : error ? (
            <div className="error-state">{error}</div>
          ) : investment ? (
            <div className="header-info">
              {/* Usuario e Inversión */}
              <div className="header-investor">
                <div className="investor-info">
                  <span className="investor-name">{user?.displayName || user?.fullName || t('investments.user')}</span>
                  <span className="investor-email">{user?.email || '—'}</span>
                </div>
                <span className={`status-badge status-${investment.status}`}>
                  {investment.status === 'active' && t('investments.active')}
                  {investment.status === 'completed' && t('investments.completed')}
                  {investment.status === 'cancelled' && t('investments.cancelled')}
                  {investment.status === 'paused' && t('investments.paused')}
                </span>
              </div>

              {/* Monto y Proyecto */}
              <div className="header-meta">
                <div className="meta-item">
                  <span className="meta-label">{t('investments.amountInvested')}</span>
                  <span className="meta-value bold">{formatCurrency(investment.amount)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">{t('investments.project')}</span>
                  <span className="meta-value">{project?.name || '—'}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">{t('investments.date')}</span>
                  <span className="meta-value">{formatDate(investment.createdAt)}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Tabs */}
        {investment && (
          <div className="investment-tabs">
            <button
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              {t('investments.overview')}
            </button>
            <button
              className={`tab ${activeTab === 'financial' ? 'active' : ''}`}
              onClick={() => setActiveTab('financial')}
            >
              {t('investments.financial')}
            </button>
            <button
              className={`tab ${activeTab === 'project' ? 'active' : ''}`}
              onClick={() => setActiveTab('project')}
            >
              {t('investments.project')} ({projectEvents.length})
            </button>
            <button
              className={`tab ${activeTab === 'audit' ? 'active' : ''}`}
              onClick={() => setActiveTab('audit')}
            >
              {t('investments.audit')} ({auditLog.length})
            </button>
          </div>
        )}

        {/* Mensajes de estado */}
        {successMessage && (
          <div className="success-message">✅ {successMessage}</div>
        )}
        {actionError && (
          <div className="error-message">❌ {actionError}</div>
        )}

        {/* Contenido */}
        <div className="investment-content">
          {loading ? (
            <div className="content-loading">{t('investments.loadingDetails')}</div>
          ) : !investment ? (
            <div className="content-empty">{t('investments.couldNotLoad')}</div>
          ) : activeTab === 'overview' ? (
            <OverviewTab investment={investment} project={project} user={user} formatCurrency={formatCurrency} formatDate={formatDate} t={t} />
          ) : activeTab === 'financial' ? (
            <FinancialTab investment={investment} project={project} formatCurrency={formatCurrency} onUpdateReturn={() => setIsReturnModalOpen(true)} t={t} />
          ) : activeTab === 'project' ? (
            <ProjectTab projectEvents={projectEvents} formatDateTime={formatDateTime} t={t} />
          ) : activeTab === 'audit' ? (
            <AuditTab auditLog={auditLog} formatDateTime={formatDateTime} formatCurrency={formatCurrency} t={t} />
          ) : null}
        </div>

        {/* Actions Footer */}
        {investment && (
          <div className="investment-actions">
            <button
              className="action-btn primary"
              onClick={() => setIsStatusModalOpen(true)}
              disabled={isActionLoading}
            >
              {t('investments.changeStatus')}
            </button>
            <button
              className="action-btn secondary"
              onClick={() => setIsEventModalOpen(true)}
              disabled={isActionLoading}
            >
              {t('investments.recordEvent')}
            </button>
            {investment.status === 'active' && (
              <button
                className="action-btn secondary"
                onClick={() => setIsReturnModalOpen(true)}
                disabled={isActionLoading}
              >
                {t('investments.updateReturn')}
              </button>
            )}
          </div>
        )}

        {/* Status Change Modal */}
        {isStatusModalOpen && (
          <StatusChangeModal
            currentStatus={investment.status}
            onConfirm={handleStatusChange}
            onClose={() => setIsStatusModalOpen(false)}
            isLoading={isActionLoading}
            t={t}
          />
        )}

        {/* Return Update Modal */}
        {isReturnModalOpen && (
          <ReturnUpdateModal
            currentReturn={investment.realizedReturn || investment.payout}
            expectedReturn={investment.expectedReturn}
            amount={investment.amount}
            onConfirm={handleUpdateReturn}
            onClose={() => setIsReturnModalOpen(false)}
            isLoading={isActionLoading}
            formatCurrency={formatCurrency}
            t={t}
          />
        )}

        {/* System Event Modal */}
        {isEventModalOpen && (
          <SystemEventModal
            onConfirm={handleRecordEvent}
            onClose={() => setIsEventModalOpen(false)}
            isLoading={isActionLoading}
            t={t}
          />
        )}
      </div>
    </>
  );
}

/**
 * Componentes de Tab
 */
function OverviewTab({ investment, project, user, formatCurrency, formatDate, t }) {
  return (
    <div className="tab-content overview-tab">
      <div className="info-cards">
        <div className="info-card">
          <div className="card-label">{t('investments.investor')}</div>
          <div className="card-value">{user?.displayName || user?.fullName || t('investments.user')}</div>
          <div className="card-sublabel">{user?.email}</div>
        </div>
        <div className="info-card">
          <div className="card-label">{t('investments.amountInvested')}</div>
          <div className="card-value">{formatCurrency(investment.amount)}</div>
        </div>
        <div className="info-card">
          <div className="card-label">{t('investments.projectPercent')}</div>
          <div className="card-value">{investment.projectionOfTotal}%</div>
        </div>
        <div className="info-card">
          <div className="card-label">{t('investments.status')}</div>
          <div className={`card-value status-${investment.status}`}>
            {investment.status === 'active' && t('investments.active')}
            {investment.status === 'completed' && t('investments.completed')}
            {investment.status === 'cancelled' && t('investments.cancelled')}
            {investment.status === 'paused' && t('investments.paused')}
          </div>
        </div>
      </div>

      <div className="info-section">
        <h3 className="section-title">{t('investments.generalInfo')}</h3>
        <div className="info-items">
          <div className="info-item">
            <span className="label">{t('investments.project')}</span>
            <span className="value">{project?.name || '—'}</span>
          </div>
          <div className="info-item">
            <span className="label">{t('investments.projectType')}</span>
            <span className="value">{project?.type === 'fixed' ? t('projects.fixed') : t('projects.variable')}</span>
          </div>
          <div className="info-item">
            <span className="label">{t('investments.projectRisk')}</span>
            <span className={`value risk-${project?.riskLevel}`}>
              {project?.riskLevel === 'low' && t('investments.riskLow')}
              {project?.riskLevel === 'medium' && t('investments.riskMedium')}
              {project?.riskLevel === 'high' && t('investments.riskHigh')}
            </span>
          </div>
          <div className="info-item">
            <span className="label">{t('investments.investmentDate')}</span>
            <span className="value">{formatDate(investment.createdAt)}</span>
          </div>
          <div className="info-item">
            <span className="label">{t('investments.projectStatus')}</span>
            <span className="value">{project?.computedStatus || project?.status || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FinancialTab({ investment, project, formatCurrency, onUpdateReturn, t }) {
  const expectedGain = investment.amount && investment.expectedReturn
    ? investment.expectedReturn - investment.amount
    : 0;

  const actualGain = investment.amount && investment.realizedReturn
    ? investment.realizedReturn - investment.amount
    : null;

  return (
    <div className="tab-content financial-tab">
      <div className="financial-grid">
        <div className="fin-card roi">
          <div className="fin-label">{t('investments.expectedROILabel')}</div>
          <div className={`fin-value ${investment.expectedROI >= 0 ? 'positive' : 'negative'}`}>
            {investment.expectedROI !== null ? `${investment.expectedROI}%` : '—'}
          </div>
        </div>
        <div className="fin-card roi">
          <div className="fin-label">{t('investments.actualROILabel')}</div>
          <div className={`fin-value ${investment.actualROI >= 0 ? 'positive' : 'negative'}`}>
            {investment.actualROI !== null ? `${investment.actualROI}%` : t('investments.pendingValue')}
          </div>
        </div>
        <div className="fin-card gain">
          <div className="fin-label">{t('investments.expectedGain')}</div>
          <div className={`fin-value ${expectedGain >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(expectedGain)}
          </div>
        </div>
        <div className="fin-card gain">
          <div className="fin-label">{t('investments.realizedGain')}</div>
          <div className={`fin-value ${actualGain >= 0 ? 'positive' : 'negative'}`}>
            {actualGain !== null ? formatCurrency(actualGain) : t('investments.pendingValue')}
          </div>
        </div>
      </div>

      <div className="financial-details">
        <div className="fin-detail-section">
          <h3 className="section-title">{t('investments.financialDetails')}</h3>
          <div className="fin-items">
            <div className="fin-item">
              <span className="label">{t('investments.amountInvested')}</span>
              <span className="value bold">{formatCurrency(investment.amount)}</span>
            </div>
            <div className="fin-item">
              <span className="label">{t('investments.expectedReturn')}</span>
              <span className="value">{formatCurrency(investment.expectedReturn)}</span>
            </div>
            <div className="fin-item">
              <span className="label">{t('investments.realizedReturn')}</span>
              <span className="value">{formatCurrency(investment.realizedReturn || investment.payout || 0)}</span>
            </div>
            {investment.status === 'active' && (
              <div className="fin-item action">
                <button className="update-btn" onClick={onUpdateReturn}>
                  {t('investments.updateReturn')}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="fin-detail-section">
          <h3 className="section-title">{t('investments.projectRelation')}</h3>
          <div className="fin-items">
            <div className="fin-item">
              <span className="label">{t('investments.totalCapitalPercent')}</span>
              <span className="value">{investment.projectionOfTotal}%</span>
            </div>
            <div className="fin-item">
              <span className="label">{t('investments.projectTotalCapital')}</span>
              <span className="value">{formatCurrency(project?.totalInvested || 0)}</span>
            </div>
            <div className="fin-item">
              <span className="label">{t('investments.projectGoal')}</span>
              <span className="value">
                {project?.type === 'fixed'
                  ? formatCurrency(project?.targetAmount)
                  : t('projects.variable')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectTab({ projectEvents, formatDateTime, t }) {
  const relevantEvents = projectEvents.filter(
    (e) => e.type === 'system' || e.visibility === 'investors' || e.visibility === 'all'
  );

  return (
    <div className="tab-content project-tab">
      {relevantEvents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">{t('investments.noProjectEvents')}</div>
          <div className="empty-subtitle">{t('investments.noRelatedUpdates')}</div>
        </div>
      ) : (
        <div className="events-list">
          {relevantEvents.map((event) => (
            <div key={event.id} className="event-item">
              <div className="event-header">
                <span className="event-title">{event.title}</span>
                <span className="event-date">{formatDateTime(event.createdAt)}</span>
              </div>
              {event.description && (
                <div className="event-description">{event.description}</div>
              )}
              <div className="event-meta">
                <span className={`badge visibility-${event.visibility}`}>
                  {event.visibility === 'admin' && t('investments.adminOnly')}
                  {event.visibility === 'investors' && t('investments.investorsOnly')}
                  {event.visibility === 'all' && t('investments.allVisibility')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuditTab({ auditLog, formatDateTime, formatCurrency, t }) {
  return (
    <div className="tab-content audit-tab">
      {auditLog.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">{t('investments.noChangeHistory')}</div>
          <div className="empty-subtitle">{t('investments.noChangesRecorded')}</div>
        </div>
      ) : (
        <div className="audit-list">
          {auditLog.map((entry, idx) => (
            <div key={entry.id || idx} className="audit-entry">
              <div className="audit-header">
                <span className="audit-action">{formatAuditAction(entry.action, t)}</span>
                <span className="audit-date">{formatDateTime(entry.timestamp)}</span>
              </div>
              {entry.action === 'status_change' && (
                <div className="audit-details">
                  <span>
                    {t('investments.from')} <strong>{entry.previousStatus}</strong> {t('investments.to')} <strong>{entry.newStatus}</strong>
                  </span>
                  {entry.reason && <span className="reason">{t('investments.reason')}: {entry.reason}</span>}
                </div>
              )}
              {entry.action === 'system_event' && (
                <div className="audit-details">
                  <span className="title">{entry.eventTitle}</span>
                  {entry.eventDescription && (
                    <span className="desc">{entry.eventDescription}</span>
                  )}
                </div>
              )}
              {entry.action === 'return_update' && (
                <div className="audit-details">
                  <span>
                    {t('investments.returnUpdatedTo')} <strong>{formatCurrency(Number(entry.newValue) || 0)}</strong>
                  </span>
                  {entry.notes && <span className="notes">{t('investments.notes')}: {entry.notes}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Modales de Acciones
 */
function StatusChangeModal({ currentStatus, onConfirm, onClose, isLoading, t }) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [reason, setReason] = useState('');

  const statuses = [
    { value: 'active', label: t('investments.active') },
    { value: 'paused', label: t('investments.paused') },
    { value: 'completed', label: t('investments.completed') },
    { value: 'cancelled', label: t('investments.cancelled') },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('investments.changeInvestmentStatus')}</h3>
          <button className="close-modal-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>{t('investments.newStatus')}</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              disabled={isLoading}
            >
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>{t('investments.reasonOptional')}</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('investments.explainChange')}
              disabled={isLoading}
              rows={3}
            />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn secondary" onClick={onClose} disabled={isLoading}>
            {t('investments.cancel')}
          </button>
          <button
            className="btn primary"
            onClick={() => onConfirm(selectedStatus, reason)}
            disabled={isLoading}
          >
            {isLoading ? t('investments.updating') : t('investments.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReturnUpdateModal({ currentReturn, expectedReturn, amount, onConfirm, onClose, isLoading, formatCurrency, t }) {
  const [realizedReturn, setRealizedReturn] = useState(currentReturn || expectedReturn || '');
  const [notes, setNotes] = useState('');

  const gain = realizedReturn ? Number(realizedReturn) - amount : 0;
  const roi = amount > 0 && realizedReturn ? ((gain / amount) * 100).toFixed(2) : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('investments.updateInvestmentReturn')}</h3>
          <button className="close-modal-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>{t('investments.realizedReturnUSD')}</label>
            <input
              type="number"
              value={realizedReturn}
              onChange={(e) => setRealizedReturn(e.target.value)}
              placeholder={t('investments.amountReceived')}
              disabled={isLoading}
            />
            <div className="form-hint">{t('investments.investedAmount')}: {formatCurrency(amount)}</div>
          </div>
          {realizedReturn && (
            <div className="return-preview">
              <div className="preview-item">
                <span>{t('investments.gainLoss')}</span>
                <span className={gain >= 0 ? 'positive' : 'negative'}>
                  {formatCurrency(gain)}
                </span>
              </div>
              <div className="preview-item">
                <span>{t('investments.roi')}</span>
                <span className={roi >= 0 ? 'positive' : 'negative'}>{roi}%</span>
              </div>
            </div>
          )}
          <div className="form-group">
            <label>{t('investments.notesOptional')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('investments.returnDetails')}
              disabled={isLoading}
              rows={3}
            />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn secondary" onClick={onClose} disabled={isLoading}>
            {t('investments.cancel')}
          </button>
          <button
            className="btn primary"
            onClick={() => onConfirm(realizedReturn, notes)}
            disabled={isLoading || !realizedReturn}
          >
            {isLoading ? t('investments.updating') : t('investments.saveReturn')}
          </button>
        </div>
      </div>
    </div>
  );
}

function SystemEventModal({ onConfirm, onClose, isLoading, t }) {
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('investments.registerSystemEvent')}</h3>
          <button className="close-modal-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>{t('investments.eventTitle')}</label>
            <input
              type="text"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder={t('investments.eventTitlePlaceholder')}
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label>{t('investments.descriptionOptional')}</label>
            <textarea
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder={t('investments.additionalDetails')}
              disabled={isLoading}
              rows={4}
            />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn secondary" onClick={onClose} disabled={isLoading}>
            {t('investments.cancel')}
          </button>
          <button
            className="btn primary"
            onClick={() => onConfirm(eventTitle, eventDescription, {})}
            disabled={isLoading || !eventTitle}
          >
            {isLoading ? t('investments.registering') : t('investments.registerEvent')}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatAuditAction(action, t) {
  const labels = {
    status_change: t('investments.statusChange'),
    system_event: t('investments.systemEvent'),
    return_update: t('investments.returnUpdate'),
  };
  return labels[action] || action;
}
