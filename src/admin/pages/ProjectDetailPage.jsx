import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAdminProjects from '../hooks/useAdminProjects';
import useAdminInvestments from '../hooks/useAdminInvestments';
import useProjectTimeline from '../hooks/useProjectTimeline';
import { useLanguage } from '../../context/LanguageContext';
import ProjectEditModal from '../components/modals/ProjectEditModal';
import FixedProjectEditModal from '../components/modals/FixedProjectEditModal';
import ProjectTimeline from '../components/project/ProjectTimeline';
import './ProjectDetailPage.css';

export default function ProjectDetailPage({ adminData }) {
  const { t, currentLanguage } = useLanguage();
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

  const locale = currentLanguage === 'es' ? 'es-ES' : currentLanguage === 'de' ? 'de-DE' : currentLanguage === 'zh' ? 'zh-CN' : currentLanguage === 'it' ? 'it-IT' : 'en-US';

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(locale);
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
        <div className="not-found">{t('projectDetail.notFound')}</div>
      </div>
    );
  }

  return (
    <div className="project-detail-page">
      {/* Header con navegación y acciones */}
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/admin/proyectos')}>
          ← {t('projectDetail.backToProjects')}
        </button>
        <div className="header-actions">
          {computedMode === 'readonly' && (
            <span className="locked-badge">🔒 {t('projectDetail.projectLocked')}</span>
          )}
          {computedMode !== 'readonly' && (
            <>
              <button className="ghost-btn" onClick={() => setActiveTab('timeline')}>
                📢 {t('projectDetail.publishEvent')}
              </button>
              <button className="edit-btn" onClick={() => setIsEditOpen(true)}>
                ✏️ {t('projectDetail.editProject')}
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
              {project.type === 'variable' ? `📊 ${t('projectDetail.variable')}` : `🎯 ${t('projectDetail.fixed')}`}
            </span>
            <span className={`risk-badge risk-${project.riskLevel}`}>
              {project.riskLevel === 'low' && `🟢 ${t('projectDetail.riskLow')}`}
              {project.riskLevel === 'medium' && `🟡 ${t('projectDetail.riskMedium')}`}
              {project.riskLevel === 'high' && `🔴 ${t('projectDetail.riskHigh')}`}
            </span>
            <span className={`status-badge status-${project.computedStatus}`}>
              {project.computedStatus === 'funded' && `✅ ${t('projectDetail.statusFunded')}`}
              {project.computedStatus === 'active' && `🟢 ${t('projectDetail.statusActive')}`}
              {project.computedStatus === 'paused' && `⏸️ ${t('projectDetail.statusPaused')}`}
              {project.computedStatus === 'closed' && `🔒 ${t('projectDetail.statusClosed')}`}
              {project.computedStatus === 'draft' && `📝 ${t('projectDetail.statusDraft')}`}
            </span>
          </div>
          {project.category && <div className="project-category">📁 {project.category}</div>}
        </div>

        {/* Barra de progreso para proyectos FIJOS */}
        {project.type === 'fixed' && project.targetAmount && (
          <div className="progress-card">
            <div className="progress-header">
              <span className="progress-label">💰 {t('projectDetail.capitalRaised')}</span>
              <span className="progress-percentage">{project.progress || 0}%</span>
            </div>
            <div className="progress-bar-large">
              <div className="progress-fill" style={{ width: `${project.progress || 0}%` }}></div>
            </div>
            <div className="progress-stats">
              <div className="progress-stat">
                <span className="stat-label">{t('projectDetail.raised')}</span>
                <span className="stat-value">{formatCurrency(project.totalInvested)}</span>
              </div>
              <div className="progress-stat">
                <span className="stat-label">{t('projectDetail.goal')}</span>
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
          📊 {t('projectDetail.overview')}
        </button>
        <button
          className={`tab ${activeTab === 'investments' ? 'active' : ''}`}
          onClick={() => setActiveTab('investments')}
        >
          💼 {t('projectDetail.investments')} ({investments.length})
        </button>
        <button
          className={`tab ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          📅 {t('projectDetail.timeline')}
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
                  <div className="kpi-label">{t('projectDetail.totalInvested')}</div>
                  <div className="kpi-value">{formatCurrency(project.totalInvested || 0)}</div>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon">👥</div>
                <div className="kpi-content">
                  <div className="kpi-label">{t('projectDetail.investors')}</div>
                  <div className="kpi-value">{investments.length}</div>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon">📈</div>
                <div className="kpi-content">
                  <div className="kpi-label">{t('projectDetail.expectedROI')}</div>
                  <div className="kpi-value">{project.expectedROI ? `${project.expectedROI}%` : '—'}</div>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon">⏱️</div>
                <div className="kpi-content">
                  <div className="kpi-label">{t('projectDetail.duration')}</div>
                  <div className="kpi-value">{project.duration ? `${project.duration}m` : '—'}</div>
                </div>
              </div>
            </div>

            {/* Grid de información */}
            <div className="info-grid">
              {/* Información General */}
              <div className="info-card">
                <h3>📋 {t('projectDetail.generalInfo')}</h3>
                <div className="info-content">
                  <div className="info-row">
                    <span className="info-label">{t('projectDetail.expectedROI')}</span>
                    <span className="info-value highlight">{project.expectedROI ? `${project.expectedROI}%` : '—'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">{t('projectDetail.projectDuration')}</span>
                    <span className="info-value">{project.duration ? `${project.duration} ${t('projectDetail.months')}` : '—'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">{t('projectDetail.creationDate')}</span>
                    <span className="info-value">{formatDate(project.createdAt)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">{t('projectDetail.lastUpdate')}</span>
                    <span className="info-value">{formatDate(project.updatedAt)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">{t('projectDetail.baseCurrency')}</span>
                    <span className="info-value">USD 🇺🇸</span>
                  </div>
                  {project.category && (
                    <div className="info-row">
                      <span className="info-label">{t('projectDetail.category')}</span>
                      <span className="info-value">{project.category}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Configuración según tipo */}
              {project.type === 'fixed' && (
                <div className="info-card">
                  <h3>⚙️ {t('projectDetail.fixedConfig')}</h3>
                  <div className="info-content">
                    <div className="info-row">
                      <span className="info-label">{t('projectDetail.targetCapital')}</span>
                      <span className="info-value highlight">{formatCurrency(project.targetAmount)}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">{t('projectDetail.currentCapital')}</span>
                      <span className="info-value">{formatCurrency(project.totalInvested)}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">{t('projectDetail.minInvestment')}</span>
                      <span className="info-value">{formatCurrency(project.minInvestment)}</span>
                    </div>
                    {project.maxInvestment && (
                      <div className="info-row">
                        <span className="info-label">{t('projectDetail.maxInvestment')}</span>
                        <span className="info-value">{formatCurrency(project.maxInvestment)}</span>
                      </div>
                    )}
                    <div className="info-row">
                      <span className="info-label">{t('projectDetail.autoLockOnTarget')}</span>
                      <span className="info-value">
                        <span className={`pill ${project.autoLockOnTarget ? 'pill-on' : 'pill-off'}`}>
                          {project.autoLockOnTarget ? `✓ ${t('common.enabled')}` : `✗ ${t('common.disabled')}`}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {project.type === 'variable' && (
                <div className="info-card">
                  <h3>📊 {t('projectDetail.variableMetrics')}</h3>
                  <div className="info-content">
                    <div className="info-row">
                      <span className="info-label">{t('projectDetail.performance')}</span>
                      <span className={`info-value ${project.performance && project.performance > 0 ? 'positive' : 'negative'}`}>
                        {project.performance !== undefined ? `${project.performance}%` : '—'}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">{t('projectDetail.drawdown')}</span>
                      <span className="info-value negative">{project.drawdown !== undefined ? `${project.drawdown}%` : '—'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">{t('projectDetail.manualControl')}</span>
                      <span className="info-value">
                        <span className={`pill ${project.manualControl ? 'pill-on' : 'pill-off'}`}>
                          {project.manualControl ? `✓ ${t('common.enabled')}` : `✗ ${t('common.disabled')}`}
                        </span>
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">{t('projectDetail.market')}</span>
                      <span className="info-value">{project.market || '—'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">{t('projectDetail.strategy')}</span>
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
              <div className="loading-state">⏳ {t('projectDetail.loadingInvestments')}</div>
            ) : investments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <p>{t('projectDetail.noInvestments')}</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="investments-table">
                  <thead>
                    <tr>
                      <th>{t('projectDetail.user')}</th>
                      <th>{t('projectDetail.amount')}</th>
                      <th>{t('projectDetail.expectedROI')}</th>
                      <th>{t('projectDetail.status')}</th>
                      <th>{t('projectDetail.date')}</th>
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
                            {inv.status === 'active' && `🟢 ${t('projectDetail.invActive')}`}
                            {inv.status === 'completed' && `✅ ${t('projectDetail.invCompleted')}`}
                            {inv.status === 'cancelled' && `❌ ${t('projectDetail.invCancelled')}`}
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
    </div>
  );
}
