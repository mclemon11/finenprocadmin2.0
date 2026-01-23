import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import useAdminInvestments from '../../hooks/useAdminInvestments';
import useProjectTimeline from '../../hooks/useProjectTimeline';
import ProjectEditModal from '../modals/ProjectEditModal';
import FixedProjectEditModal from '../modals/FixedProjectEditModal';
import ProjectTimeline from '../project/ProjectTimeline';
import InvestmentDetailDrawer from './InvestmentDetailDrawer';
import './ProjectDetailDrawer.css';

export default function ProjectDetailDrawer({ 
  project, 
  isOpen, 
  onClose, 
  onRefresh, 
  adminData,
  activeTab: externalActiveTab = 'overview',
  onTabChange = null 
}) {
  const [internalActiveTab, setInternalActiveTab] = useState('overview');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState(null);

  // Usar activeTab controlado externamente si se proporciona
  const activeTab = onTabChange ? externalActiveTab : internalActiveTab;
  const setActiveTab = onTabChange || setInternalActiveTab;

  const { investments, loading: invLoading } = useAdminInvestments({ projectId: project?.id });
  const { events, addEvent, refetch: refetchTimeline } = useProjectTimeline(project?.id);

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
      day: 'numeric' 
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

  const handleEditSuccess = () => {
    onRefresh();
    refetchTimeline();
  };

  const handleTimelineEvent = async (eventData) => {
    await addEvent(eventData);
    refetchTimeline();
  };

  // Actividad: eventos del sistema + actualizaciones
  const activityEvents = useMemo(() => {
    return events.filter(e => e.type === 'system' || e.visibility === 'admin');
  }, [events]);

  // Resumen de inversiones
  const investmentStats = useMemo(() => {
    const total = investments.length;
    const active = investments.filter(i => i.status === 'active').length;
    const totalAmount = investments.reduce((sum, i) => sum + (i.amount || 0), 0);
    return { total, active, totalAmount };
  }, [investments]);

  if (!project || !isOpen) return null;

  const drawerContent = (
    <>
      <div className={`drawer-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
      <div className={`project-drawer ${isOpen ? 'open' : ''}`}>
        {/* Header fijo */}
        <div className="drawer-header">
          <div className="drawer-header-top">
            <button className="close-drawer-btn" onClick={onClose}>
              ← Volver a proyectos
            </button>
            <div className="drawer-actions">
              <button className="action-btn secondary" onClick={() => setIsEditOpen(true)}>
                ✏️ Editar
              </button>
              <button className="action-btn primary" onClick={() => setActiveTab('timeline')}>
                📢 Publicar evento
              </button>
            </div>
          </div>

          <div className="drawer-header-content">
            <div className="project-title-section">
              <h1 className="drawer-title">{project.name}</h1>
              <div className="drawer-badges">
                <span className={`badge type-badge type-${project.type}`}>
                  {project.type === 'variable' ? '📊 Variable' : '🎯 Fijo'}
                </span>
                <span className={`badge risk-badge risk-${project.riskLevel}`}>
                  {project.riskLevel === 'low' && '🟢 Riesgo Bajo'}
                  {project.riskLevel === 'medium' && '🟡 Riesgo Medio'}
                  {project.riskLevel === 'high' && '🔴 Riesgo Alto'}
                </span>
                <span className={`badge status-badge status-${project.computedStatus}`}>
                  {project.computedStatus === 'funded' && '✅ Funded'}
                  {project.computedStatus === 'active' && '🟢 Activo'}
                  {project.computedStatus === 'paused' && '⏸️ Pausado'}
                  {project.computedStatus === 'closed' && '🔒 Cerrado'}
                  {project.computedStatus === 'draft' && '📝 Borrador'}
                </span>
              </div>
              {project.category && (
                <div className="project-meta">📁 {project.category}</div>
              )}
            </div>

            {project.type === 'fixed' && project.targetAmount && (
              <div className="header-progress">
                <div className="progress-header-row">
                  <span className="progress-label-text">💰 Capital Recaudado</span>
                  <span className="progress-percent">{project.progress || 0}%</span>
                </div>
                <div className="progress-bar-header">
                  <div 
                    className="progress-fill-header" 
                    style={{ width: `${project.progress || 0}%` }}
                  ></div>
                </div>
                <div className="progress-stats-row">
                  <div className="progress-stat">
                    <span className="stat-label">Recaudado</span>
                    <span className="stat-value">{formatCurrency(project.totalInvested)}</span>
                  </div>
                  <div className="progress-stat">
                    <span className="stat-label">Meta</span>
                    <span className="stat-value">{formatCurrency(project.targetAmount)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="drawer-tabs">
            <button
              className={`drawer-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              📊 Resumen
            </button>
            <button
              className={`drawer-tab ${activeTab === 'investments' ? 'active' : ''}`}
              onClick={() => setActiveTab('investments')}
            >
              💼 Inversiones ({investmentStats.total})
            </button>
            <button
              className={`drawer-tab ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              📅 Timeline ({events.length})
            </button>
            <button
              className={`drawer-tab ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              ⚙️ Actividad ({activityEvents.length})
            </button>
          </div>
        </div>

        {/* Contenido con scroll */}
        <div className="drawer-content">
          {activeTab === 'overview' && (
            <div className="overview-section">
              <div className="overview-grid">
                {/* KPIs principales */}
                <div className="kpi-box">
                  <div className="kpi-icon">💰</div>
                  <div className="kpi-data">
                    <div className="kpi-label">Total Invertido</div>
                    <div className="kpi-value">{formatCurrency(investmentStats.totalAmount)}</div>
                  </div>
                </div>
                <div className="kpi-box">
                  <div className="kpi-icon">👥</div>
                  <div className="kpi-data">
                    <div className="kpi-label">Inversionistas</div>
                    <div className="kpi-value">{investmentStats.total}</div>
                    <div className="kpi-sublabel">{investmentStats.active} activos</div>
                  </div>
                </div>
                <div className="kpi-box">
                  <div className="kpi-icon">📈</div>
                  <div className="kpi-data">
                    <div className="kpi-label">ROI Esperado</div>
                    <div className="kpi-value">{project.expectedROI ? `${project.expectedROI}%` : '—'}</div>
                  </div>
                </div>
                <div className="kpi-box">
                  <div className="kpi-icon">⏱️</div>
                  <div className="kpi-data">
                    <div className="kpi-label">Duración</div>
                    <div className="kpi-value">{project.duration ? `${project.duration}m` : '—'}</div>
                  </div>
                </div>
              </div>

              {/* Información detallada */}
              <div className="info-sections">
                <div className="info-section">
                  <h3 className="section-title">📋 Información General</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-key">Fecha de creación</span>
                      <span className="info-val">{formatDate(project.createdAt)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-key">Última actualización</span>
                      <span className="info-val">{formatDate(project.updatedAt)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-key">Moneda base</span>
                      <span className="info-val">USD 🇺🇸</span>
                    </div>
                    <div className="info-item">
                      <span className="info-key">Estado de inversión</span>
                      <span className="info-val">
                        {project.investable ? '✅ Abierto' : '🔒 Cerrado'}
                      </span>
                    </div>
                  </div>
                </div>

                {project.type === 'fixed' && (
                  <div className="info-section">
                    <h3 className="section-title">⚙️ Configuración Fija</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-key">Capital objetivo</span>
                        <span className="info-val bold">{formatCurrency(project.targetAmount)}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-key">Inversión mínima</span>
                        <span className="info-val">{formatCurrency(project.minInvestment)}</span>
                      </div>
                      {project.maxInvestment && (
                        <div className="info-item">
                          <span className="info-key">Inversión máxima</span>
                          <span className="info-val">{formatCurrency(project.maxInvestment)}</span>
                        </div>
                      )}
                      <div className="info-item">
                        <span className="info-key">Auto-lock al alcanzar meta</span>
                        <span className="info-val">
                          <span className={`pill ${project.autoLockOnTarget ? 'pill-on' : 'pill-off'}`}>
                            {project.autoLockOnTarget ? '✓ Activado' : '✗ Desactivado'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {project.type === 'variable' && (
                  <div className="info-section">
                    <h3 className="section-title">📊 Métricas Variables</h3>
                    <div className="metrics-cards">
                      <div className="metric-card performance">
                        <div className="metric-icon">📈</div>
                        <div className="metric-label">Performance</div>
                        <div className="metric-value positive">
                          {project.performance !== undefined ? `${project.performance}%` : '—'}
                        </div>
                      </div>
                      <div className="metric-card drawdown">
                        <div className="metric-icon">📉</div>
                        <div className="metric-label">Drawdown</div>
                        <div className="metric-value negative">
                          {project.drawdown !== undefined ? `${project.drawdown}%` : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'investments' && (
            <div className="investments-section">
              {invLoading ? (
                <div className="loading-state">Cargando inversiones...</div>
              ) : investments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">�</div>
                  <div className="empty-title">Sin inversiones</div>
                  <div className="empty-subtitle">Este proyecto aún no tiene inversionistas</div>
                </div>
              ) : (
                <div className="investments-table-wrapper">
                  <table className="investments-table">
                    <thead>
                      <tr>
                        <th>Inversionista</th>
                        <th>Monto</th>
                        <th>ROI Esperado</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {investments.map((inv) => (
                        <tr key={inv.id} onClick={() => setSelectedInvestmentId(inv.id)} className="clickable-row">
                          <td>
                            <div className="investor-cell">
                              <div className="investor-name">{inv.userName || 'Usuario'}</div>
                              <div className="investor-email">{inv.userEmail}</div>
                            </div>
                          </td>
                          <td className="amount-cell">{formatCurrency(inv.amount)}</td>
                          <td>
                            <span className="roi-badge">
                              {inv.expectedROI !== null ? `${inv.expectedROI}%` : '—'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge status-badge status-${inv.status}`}>
                              {inv.status === 'active' && '🟢 Activa'}
                              {inv.status === 'completed' && '✅ Completada'}
                              {inv.status === 'cancelled' && '❌ Cancelada'}
                            </span>
                          </td>
                          <td className="date-cell">{formatDate(inv.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="timeline-section">
              <ProjectTimeline projectId={project.id} adminData={adminData} />
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="activity-section">
              {activityEvents.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">⚙️</div>
                  <div className="empty-title">Sin actividad</div>
                  <div className="empty-subtitle">No hay eventos del sistema registrados</div>
                </div>
              ) : (
                <div className="activity-list">
                  {activityEvents.map((event) => (
                    <div key={event.id} className="activity-item">
                      <div className="activity-icon">
                        {event.type === 'system' ? '⚙️' : '📋'}
                      </div>
                      <div className="activity-content">
                        <div className="activity-header">
                          <span className="activity-title">{event.title}</span>
                          <span className="activity-date">{formatDateTime(event.createdAt)}</span>
                        </div>
                        {event.description && (
                          <div className="activity-description">{event.description}</div>
                        )}
                        <div className="activity-meta">
                          <span className={`badge visibility-badge visibility-${event.visibility}`}>
                            {event.visibility === 'admin' && 'Solo admin'}
                            {event.visibility === 'investors' && 'Inversionistas'}
                            {event.visibility === 'all' && 'Todos'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de edición según tipo de proyecto */}
      {project.type === 'fixed' ? (
        <FixedProjectEditModal
          project={project}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSuccess={handleEditSuccess}
          onTimelineEvent={handleTimelineEvent}
        />
      ) : (
        <ProjectEditModal
          project={project}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSuccess={handleEditSuccess}
          onTimelineEvent={handleTimelineEvent}
        />
      )}

      <InvestmentDetailDrawer
        investmentId={selectedInvestmentId}
        isOpen={!!selectedInvestmentId}
        onClose={() => setSelectedInvestmentId(null)}
        onUpdate={() => {
          onRefresh();
          const refetch = investments.length > 0 ? () => {} : null;
        }}
      />
    </>
  );

  return createPortal(drawerContent, document.body);
}
