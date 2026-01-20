import React, { useState } from 'react';
import useInvestmentDetail from '../../hooks/useInvestmentDetail';
import {
  useChangeInvestmentStatus,
  useRecordInvestmentSystemEvent,
  useUpdateInvestmentReturn,
} from '../../hooks/mutations/useInvestmentMutations';
import './InvestmentDetailDrawer.css';

export default function InvestmentDetailDrawer({ investmentId, isOpen, onClose, onUpdate }) {
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
      setSuccessMessage(`Inversión actualizada a ${newStatus}`);
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
      setSuccessMessage('Evento registrado');
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
      setSuccessMessage('Retorno actualizado');
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
              ← Volver
            </button>
            <h2 className="header-title">Detalle de Inversión</h2>
          </div>

          {loading ? (
            <div className="loading-state">Cargando...</div>
          ) : error ? (
            <div className="error-state">{error}</div>
          ) : investment ? (
            <div className="header-info">
              {/* Usuario e Inversión */}
              <div className="header-investor">
                <div className="investor-info">
                  <span className="investor-name">{user?.displayName || user?.fullName || 'Usuario'}</span>
                  <span className="investor-email">{user?.email || '—'}</span>
                </div>
                <span className={`status-badge status-${investment.status}`}>
                  {investment.status === 'active' && 'Activa'}
                  {investment.status === 'completed' && 'Completada'}
                  {investment.status === 'cancelled' && 'Cancelada'}
                  {investment.status === 'paused' && 'Pausada'}
                </span>
              </div>

              {/* Monto y Proyecto */}
              <div className="header-meta">
                <div className="meta-item">
                  <span className="meta-label">Monto Invertido</span>
                  <span className="meta-value bold">{formatCurrency(investment.amount)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Proyecto</span>
                  <span className="meta-value">{project?.name || '—'}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Fecha</span>
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
              Resumen
            </button>
            <button
              className={`tab ${activeTab === 'financial' ? 'active' : ''}`}
              onClick={() => setActiveTab('financial')}
            >
              Financiero
            </button>
            <button
              className={`tab ${activeTab === 'project' ? 'active' : ''}`}
              onClick={() => setActiveTab('project')}
            >
              Proyecto ({projectEvents.length})
            </button>
            <button
              className={`tab ${activeTab === 'audit' ? 'active' : ''}`}
              onClick={() => setActiveTab('audit')}
            >
              Audit ({auditLog.length})
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
            <div className="content-loading">Cargando detalles...</div>
          ) : !investment ? (
            <div className="content-empty">No se pudo cargar la inversión</div>
          ) : activeTab === 'overview' ? (
            <OverviewTab investment={investment} project={project} user={user} formatCurrency={formatCurrency} formatDate={formatDate} />
          ) : activeTab === 'financial' ? (
            <FinancialTab investment={investment} project={project} formatCurrency={formatCurrency} onUpdateReturn={() => setIsReturnModalOpen(true)} />
          ) : activeTab === 'project' ? (
            <ProjectTab projectEvents={projectEvents} formatDateTime={formatDateTime} />
          ) : activeTab === 'audit' ? (
            <AuditTab auditLog={auditLog} formatDateTime={formatDateTime} formatCurrency={formatCurrency} />
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
              Cambiar Estado
            </button>
            <button
              className="action-btn secondary"
              onClick={() => setIsEventModalOpen(true)}
              disabled={isActionLoading}
            >
              Registrar Evento
            </button>
            {investment.status === 'active' && (
              <button
                className="action-btn secondary"
                onClick={() => setIsReturnModalOpen(true)}
                disabled={isActionLoading}
              >
                Actualizar Retorno
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
          />
        )}

        {/* System Event Modal */}
        {isEventModalOpen && (
          <SystemEventModal
            onConfirm={handleRecordEvent}
            onClose={() => setIsEventModalOpen(false)}
            isLoading={isActionLoading}
          />
        )}
      </div>
    </>
  );
}

/**
 * Componentes de Tab
 */
function OverviewTab({ investment, project, user, formatCurrency, formatDate }) {
  return (
    <div className="tab-content overview-tab">
      <div className="info-cards">
        <div className="info-card">
          <div className="card-label">Inversionista</div>
          <div className="card-value">{user?.displayName || user?.fullName || 'Usuario'}</div>
          <div className="card-sublabel">{user?.email}</div>
        </div>
        <div className="info-card">
          <div className="card-label">Monto Invertido</div>
          <div className="card-value">{formatCurrency(investment.amount)}</div>
        </div>
        <div className="info-card">
          <div className="card-label">% del Proyecto</div>
          <div className="card-value">{investment.projectionOfTotal}%</div>
        </div>
        <div className="info-card">
          <div className="card-label">Estado</div>
          <div className={`card-value status-${investment.status}`}>
            {investment.status === 'active' && 'Activa'}
            {investment.status === 'completed' && 'Completada'}
            {investment.status === 'cancelled' && 'Cancelada'}
            {investment.status === 'paused' && 'Pausada'}
          </div>
        </div>
      </div>

      <div className="info-section">
        <h3 className="section-title">Información General</h3>
        <div className="info-items">
          <div className="info-item">
            <span className="label">Proyecto</span>
            <span className="value">{project?.name || '—'}</span>
          </div>
          <div className="info-item">
            <span className="label">Tipo de Proyecto</span>
            <span className="value">{project?.type === 'fixed' ? 'Fijo' : 'Variable'}</span>
          </div>
          <div className="info-item">
            <span className="label">Riesgo del Proyecto</span>
            <span className={`value risk-${project?.riskLevel}`}>
              {project?.riskLevel === 'low' && 'Riesgo Bajo'}
              {project?.riskLevel === 'medium' && 'Riesgo Medio'}
              {project?.riskLevel === 'high' && 'Riesgo Alto'}
            </span>
          </div>
          <div className="info-item">
            <span className="label">Fecha de Inversión</span>
            <span className="value">{formatDate(investment.createdAt)}</span>
          </div>
          <div className="info-item">
            <span className="label">Estado del Proyecto</span>
            <span className="value">{project?.computedStatus || project?.status || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FinancialTab({ investment, project, formatCurrency, onUpdateReturn }) {
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
          <div className="fin-label">ROI Esperado</div>
          <div className={`fin-value ${investment.expectedROI >= 0 ? 'positive' : 'negative'}`}>
            {investment.expectedROI !== null ? `${investment.expectedROI}%` : '—'}
          </div>
        </div>
        <div className="fin-card roi">
          <div className="fin-label">ROI Real</div>
          <div className={`fin-value ${investment.actualROI >= 0 ? 'positive' : 'negative'}`}>
            {investment.actualROI !== null ? `${investment.actualROI}%` : 'Pendiente'}
          </div>
        </div>
        <div className="fin-card gain">
          <div className="fin-label">Ganancia Esperada</div>
          <div className={`fin-value ${expectedGain >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(expectedGain)}
          </div>
        </div>
        <div className="fin-card gain">
          <div className="fin-label">Ganancia Realizada</div>
          <div className={`fin-value ${actualGain >= 0 ? 'positive' : 'negative'}`}>
            {actualGain !== null ? formatCurrency(actualGain) : 'Pendiente'}
          </div>
        </div>
      </div>

      <div className="financial-details">
        <div className="fin-detail-section">
          <h3 className="section-title">Detalles Financieros</h3>
          <div className="fin-items">
            <div className="fin-item">
              <span className="label">Monto Invertido</span>
              <span className="value bold">{formatCurrency(investment.amount)}</span>
            </div>
            <div className="fin-item">
              <span className="label">Retorno Esperado</span>
              <span className="value">{formatCurrency(investment.expectedReturn)}</span>
            </div>
            <div className="fin-item">
              <span className="label">Retorno Realizado</span>
              <span className="value">{formatCurrency(investment.realizedReturn || investment.payout || 0)}</span>
            </div>
            {investment.status === 'active' && (
              <div className="fin-item action">
                <button className="update-btn" onClick={onUpdateReturn}>
                  Actualizar Retorno
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="fin-detail-section">
          <h3 className="section-title">Relación con Proyecto</h3>
          <div className="fin-items">
            <div className="fin-item">
              <span className="label">% del Capital Total</span>
              <span className="value">{investment.projectionOfTotal}%</span>
            </div>
            <div className="fin-item">
              <span className="label">Capital Total del Proyecto</span>
              <span className="value">{formatCurrency(project?.totalInvested || 0)}</span>
            </div>
            <div className="fin-item">
              <span className="label">Meta del Proyecto</span>
              <span className="value">
                {project?.type === 'fixed'
                  ? formatCurrency(project?.targetAmount)
                  : 'Variable'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectTab({ projectEvents, formatDateTime }) {
  const relevantEvents = projectEvents.filter(
    (e) => e.type === 'system' || e.visibility === 'investors' || e.visibility === 'all'
  );

  return (
    <div className="tab-content project-tab">
      {relevantEvents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">Sin eventos del proyecto</div>
          <div className="empty-subtitle">No hay actualizaciones de proyecto relacionadas</div>
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
                  {event.visibility === 'admin' && 'Solo admin'}
                  {event.visibility === 'investors' && 'Inversionistas'}
                  {event.visibility === 'all' && 'Todos'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuditTab({ auditLog, formatDateTime, formatCurrency }) {
  return (
    <div className="tab-content audit-tab">
      {auditLog.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">Sin historial de cambios</div>
          <div className="empty-subtitle">No hay cambios registrados en esta inversión</div>
        </div>
      ) : (
        <div className="audit-list">
          {auditLog.map((entry, idx) => (
            <div key={entry.id || idx} className="audit-entry">
              <div className="audit-header">
                <span className="audit-action">{formatAuditAction(entry.action)}</span>
                <span className="audit-date">{formatDateTime(entry.timestamp)}</span>
              </div>
              {entry.action === 'status_change' && (
                <div className="audit-details">
                  <span>
                    De <strong>{entry.previousStatus}</strong> a <strong>{entry.newStatus}</strong>
                  </span>
                  {entry.reason && <span className="reason">Razón: {entry.reason}</span>}
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
                    Retorno actualizado a <strong>{formatCurrency(Number(entry.newValue) || 0)}</strong>
                  </span>
                  {entry.notes && <span className="notes">Notas: {entry.notes}</span>}
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
function StatusChangeModal({ currentStatus, onConfirm, onClose, isLoading }) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [reason, setReason] = useState('');

  const statuses = [
    { value: 'active', label: 'Activa' },
    { value: 'paused', label: 'Pausada' },
    { value: 'completed', label: 'Completada' },
    { value: 'cancelled', label: 'Cancelada' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Cambiar Estado de Inversión</h3>
          <button className="close-modal-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Nuevo Estado</label>
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
            <label>Razón (opcional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explica el cambio de estado..."
              disabled={isLoading}
              rows={3}
            />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </button>
          <button
            className="btn primary"
            onClick={() => onConfirm(selectedStatus, reason)}
            disabled={isLoading}
          >
            {isLoading ? 'Actualizando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReturnUpdateModal({ currentReturn, expectedReturn, amount, onConfirm, onClose, isLoading, formatCurrency }) {
  const [realizedReturn, setRealizedReturn] = useState(currentReturn || expectedReturn || '');
  const [notes, setNotes] = useState('');

  const gain = realizedReturn ? Number(realizedReturn) - amount : 0;
  const roi = amount > 0 && realizedReturn ? ((gain / amount) * 100).toFixed(2) : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Actualizar Retorno de Inversión</h3>
          <button className="close-modal-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Retorno Realizado (USD)</label>
            <input
              type="number"
              value={realizedReturn}
              onChange={(e) => setRealizedReturn(e.target.value)}
              placeholder="Cantidad recibida"
              disabled={isLoading}
            />
            <div className="form-hint">Monto invertido: {formatCurrency(amount)}</div>
          </div>
          {realizedReturn && (
            <div className="return-preview">
              <div className="preview-item">
                <span>Ganancia / Pérdida</span>
                <span className={gain >= 0 ? 'positive' : 'negative'}>
                  {formatCurrency(gain)}
                </span>
              </div>
              <div className="preview-item">
                <span>ROI</span>
                <span className={roi >= 0 ? 'positive' : 'negative'}>{roi}%</span>
              </div>
            </div>
          )}
          <div className="form-group">
            <label>Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles sobre el retorno..."
              disabled={isLoading}
              rows={3}
            />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </button>
          <button
            className="btn primary"
            onClick={() => onConfirm(realizedReturn, notes)}
            disabled={isLoading || !realizedReturn}
          >
            {isLoading ? 'Actualizando...' : 'Guardar Retorno'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SystemEventModal({ onConfirm, onClose, isLoading }) {
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Registrar Evento de Sistema</h3>
          <button className="close-modal-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Título del Evento</label>
            <input
              type="text"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="Ej: Pago parcial recibido"
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label>Descripción (opcional)</label>
            <textarea
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Detalles adicionales..."
              disabled={isLoading}
              rows={4}
            />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </button>
          <button
            className="btn primary"
            onClick={() => onConfirm(eventTitle, eventDescription, {})}
            disabled={isLoading || !eventTitle}
          >
            {isLoading ? 'Registrando...' : 'Registrar Evento'}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatAuditAction(action) {
  const labels = {
    status_change: 'Cambio de Estado',
    system_event: 'Evento de Sistema',
    return_update: 'Actualización de Retorno',
  };
  return labels[action] || action;
}
