import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAdminProjects from '../hooks/useAdminProjects';
import useAdminInvestments from '../hooks/useAdminInvestments';
import useProjectTimeline from '../hooks/useProjectTimeline';
import ProjectEditModal from '../components/modals/ProjectEditModal';
import ProjectTimeline from '../components/project/ProjectTimeline';
import './ProjectDetailPage.css';

export default function ProjectDetailPage({ adminData }) {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { projects, refetch } = useAdminProjects();
  const { investments, loading: invLoading } = useAdminInvestments({ projectId });
  const { addEvent } = useProjectTimeline(projectId);

  const [activeTab, setActiveTab] = useState('overview');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [mode, setMode] = useState('view'); // view | edit | readonly (UI only)

  const project = projects.find((p) => p.id === projectId);
  const computedMode = useMemo(() => {
    if (!project) return 'view';
    const locked = project.computedStatus === 'closed' || project.computedStatus === 'funded';
    return locked ? 'readonly' : mode;
  }, [project, mode]);

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
    return date.toLocaleDateString('en-US');
  };

  const handleEditSuccess = () => {
    refetch();
  };

  const handleTimelineEvent = async (eventData) => {
    await addEvent(eventData);
  };

  if (!project) {
    return (
      <div className="project-detail-page">
        <div className="not-found">Proyecto no encontrado</div>
      </div>
    );
  }

  return (
    <div className="project-detail-page">
      {/* Header con navegación y acciones */}
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/admin/proyectos')}>
          ← Volver a proyectos
        </button>
        <div className="header-actions">
          {computedMode === 'readonly' && (
            <span className="locked-badge">🔒 Proyecto cerrado / bloqueado</span>
          )}
          {computedMode !== 'readonly' && (
            <>
              <button className="ghost-btn" onClick={() => setActiveTab('timeline')}>
                📢 Publicar evento
              </button>
              <button className="edit-btn" onClick={() => setIsEditOpen(true)}>
                ✏️ Editar proyecto
              </button>
            </>
          )}
        </div>
      </div>

      {/* Hero: Nombre, badges y descripción */}
      <div className="project-hero">
        <div className="hero-content">
          <h1 className="project-name">{project.name}</h1>
          <div className="project-badges">
            <span className={`type-badge type-${project.type}`}>
              {project.type === 'variable' ? '📊 Variable' : '🎯 Fijo'}
            </span>
            <span className={`risk-badge risk-${project.riskLevel}`}>
              {project.riskLevel === 'low' && '🟢 Riesgo Bajo'}
              {project.riskLevel === 'medium' && '🟡 Riesgo Medio'}
              {project.riskLevel === 'high' && '🔴 Riesgo Alto'}
            </span>
            <span className={`status-badge status-${project.computedStatus}`}>
              {project.computedStatus === 'funded' && '✅ Funded'}
              {project.computedStatus === 'active' && '🟢 Activo'}
              {project.computedStatus === 'paused' && '⏸️ Pausado'}
              {project.computedStatus === 'closed' && '🔒 Cerrado'}
              {project.computedStatus === 'draft' && '📝 Borrador'}
            </span>
          </div>
          {project.category && <div className="project-category">📁 {project.category}</div>}
        </div>

        {/* Barra de progreso para proyectos FIJOS */}
        {project.type === 'fixed' && project.targetAmount && (
          <div className="progress-card">
            <div className="progress-header">
              <span className="progress-label">💰 Capital Recaudado</span>
              <span className="progress-percentage">{project.progress || 0}%</span>
            </div>
            <div className="progress-bar-large">
              <div className="progress-fill" style={{ width: `${project.progress || 0}%` }}></div>
            </div>
            <div className="progress-stats">
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

      {/* Tabs de navegación */}
      <div className="detail-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Resumen
        </button>
        <button
          className={`tab ${activeTab === 'investments' ? 'active' : ''}`}
          onClick={() => setActiveTab('investments')}
        >
          💼 Inversiones ({investments.length})
        </button>
        <button
          className={`tab ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          📅 Timeline
        </button>
      </div>

      {/* Contenido de tabs */}
      <div className="detail-content">
        {activeTab === 'overview' && (
          <div className="overview-layout">
            {/* KPI Cards */}
            <div className="kpi-section">
              <div className="kpi-card">
                <div className="kpi-icon">💰</div>
                <div className="kpi-content">
                  <div className="kpi-label">Total invertido</div>
                  <div className="kpi-value">{formatCurrency(project.totalInvested || 0)}</div>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon">👥</div>
                <div className="kpi-content">
                  <div className="kpi-label">Inversionistas</div>
                  <div className="kpi-value">{investments.length}</div>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon">📈</div>
                <div className="kpi-content">
                  <div className="kpi-label">ROI esperado</div>
                  <div className="kpi-value">{project.expectedROI ? `${project.expectedROI}%` : '—'}</div>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon">⏱️</div>
                <div className="kpi-content">
                  <div className="kpi-label">Duración</div>
                  <div className="kpi-value">{project.duration ? `${project.duration}m` : '—'}</div>
                </div>
              </div>
            </div>

            {/* Grid de información */}
            <div className="info-grid">
              {/* Información General */}
              <div className="info-card">
                <h3>📋 Información General</h3>
                <div className="info-content">
                  <div className="info-row">
                    <span className="info-label">ROI Esperado</span>
                    <span className="info-value highlight">{project.expectedROI ? `${project.expectedROI}%` : '—'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Duración del proyecto</span>
                    <span className="info-value">{project.duration ? `${project.duration} meses` : '—'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Fecha de creación</span>
                    <span className="info-value">{formatDate(project.createdAt)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Última actualización</span>
                    <span className="info-value">{formatDate(project.updatedAt)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Moneda base</span>
                    <span className="info-value">USD 🇺🇸</span>
                  </div>
                  {project.category && (
                    <div className="info-row">
                      <span className="info-label">Categoría</span>
                      <span className="info-value">{project.category}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Configuración según tipo */}
              {project.type === 'fixed' && (
                <div className="info-card">
                  <h3>⚙️ Configuración Fija</h3>
                  <div className="info-content">
                    <div className="info-row">
                      <span className="info-label">Capital Objetivo</span>
                      <span className="info-value highlight">{formatCurrency(project.targetAmount)}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Capital Actual</span>
                      <span className="info-value">{formatCurrency(project.totalInvested)}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Inversión Mínima</span>
                      <span className="info-value">{formatCurrency(project.minInvestment)}</span>
                    </div>
                    {project.maxInvestment && (
                      <div className="info-row">
                        <span className="info-label">Inversión Máxima</span>
                        <span className="info-value">{formatCurrency(project.maxInvestment)}</span>
                      </div>
                    )}
                    <div className="info-row">
                      <span className="info-label">Auto-lock al alcanzar meta</span>
                      <span className="info-value">
                        <span className={`pill ${project.autoLockOnTarget ? 'pill-on' : 'pill-off'}`}>
                          {project.autoLockOnTarget ? '✓ Activado' : '✗ Desactivado'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {project.type === 'variable' && (
                <div className="info-card">
                  <h3>📊 Métricas Variables</h3>
                  <div className="info-content">
                    <div className="info-row">
                      <span className="info-label">Performance</span>
                      <span className={`info-value ${project.performance && project.performance > 0 ? 'positive' : 'negative'}`}>
                        {project.performance !== undefined ? `${project.performance}%` : '—'}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Drawdown</span>
                      <span className="info-value negative">{project.drawdown !== undefined ? `${project.drawdown}%` : '—'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Control Manual</span>
                      <span className="info-value">
                        <span className={`pill ${project.manualControl ? 'pill-on' : 'pill-off'}`}>
                          {project.manualControl ? '✓ Activado' : '✗ Desactivado'}
                        </span>
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Mercado</span>
                      <span className="info-value">{project.market || '—'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Estrategia</span>
                      <span className="info-value">{project.strategy || '—'}</span>
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
              <div className="loading-state">⏳ Cargando inversiones...</div>
            ) : investments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <p>No hay inversiones en este proyecto</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="investments-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Monto</th>
                      <th>ROI Esperado</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investments.map((inv) => (
                      <tr key={inv.id}>
                        <td>
                          <div className="cell-title">{inv.userName}</div>
                          <div className="cell-subtle">{inv.userEmail}</div>
                        </td>
                        <td className="amount-cell">{formatCurrency(inv.amount)}</td>
                        <td>
                          <span className="roi-badge">
                            {inv.expectedROI !== null ? `${inv.expectedROI}%` : '—'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge status-${inv.status}`}>
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
          <ProjectTimeline projectId={projectId} adminData={adminData} />
        )}
      </div>

      <ProjectEditModal
        project={project}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={handleEditSuccess}
        onTimelineEvent={handleTimelineEvent}
      />
    </div>
  );
}
