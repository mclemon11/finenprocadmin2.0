import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import useAdminInvestments from '../../hooks/useAdminInvestments';
import useProjectTimeline from '../../hooks/useProjectTimeline';
import ProjectEditModal from '../modals/ProjectEditModal';
import FixedProjectEditModal from '../modals/FixedProjectEditModal';
import ProjectTimeline from '../project/ProjectTimeline';
import InvestmentDetailDrawer from './InvestmentDetailDrawer';
import { useLanguage } from '../../../context/LanguageContext';
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
  const { t } = useLanguage();

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
              ← {t('projects.backToProjects')}
            </button>
            <div className="drawer-actions">
              <button className="action-btn secondary" onClick={() => setIsEditOpen(true)}>
                ✏️ {t('common.edit')}
              </button>
              <button className="action-btn primary" onClick={() => setActiveTab('timeline')}>
                📢 {t('projects.publishEvent')}
              </button>
            </div>
          </div>

          {/* <div className="drawer-header-content">
            <h1 className="drawer-title">{project.name}</h1>
            <span className={`badge status-badge status-${project.computedStatus}`}>
              {project.computedStatus === 'funded' && `✅ ${t('status.funded')}`}
              {project.computedStatus === 'active' && `🟢 ${t('status.active')}`}
              {project.computedStatus === 'paused' && `⏸️ ${t('status.paused')}`}
              {project.computedStatus === 'closed' && `🔒 ${t('status.closed')}`}
              {project.computedStatus === 'draft' && `📝 ${t('status.draft')}`}
            </span>
          </div> */}

          {/* Tabs */}
          <div className="drawer-tabs">
            <button
              className={`drawer-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              📊 {t('projects.overview')}
            </button>
            <button
              className={`drawer-tab ${activeTab === 'investments' ? 'active' : ''}`}
              onClick={() => setActiveTab('investments')}
            >
              💼 {t('nav.investments')} ({investmentStats.total})
            </button>
            <button
              className={`drawer-tab ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              📅 {t('projects.timeline')} ({events.length})
            </button>
            <button
              className={`drawer-tab ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              ⚙️ {t('projects.activity')} ({activityEvents.length})
            </button>
          </div>
        </div>

        {/* Contenido con scroll */}
        <div className="drawer-content">
          {activeTab === 'overview' && (
            <div className="overview-section">
              {/* Hero Image Gallery */}
              {(project.images?.cover?.url || project.images?.gallery?.length > 0 || (Array.isArray(project.images) && project.images.length > 0) || project.imageUrl) && (() => {
                // Resolve images: new nested format or legacy flat
                let allImages = [];
                if (project.images?.cover?.url || Array.isArray(project.images?.gallery)) {
                  if (project.images?.cover?.url) allImages.push(project.images.cover.url);
                  if (Array.isArray(project.images?.gallery)) {
                    allImages.push(...project.images.gallery.map(g => g?.url).filter(Boolean));
                  }
                } else {
                  allImages = Array.isArray(project.images) ? project.images.filter(u => typeof u === 'string' && u.trim()) : [];
                  if (allImages.length === 0 && project.imageUrl) allImages = [project.imageUrl];
                }
                if (allImages.length === 0) return null;
                return (
                  <div className="hero-gallery">
                    <div className="gallery-main">
                      <img src={allImages[0]} alt={project.name} />
                    </div>
                    {allImages.length > 1 && allImages.slice(1, 5).map((img, idx) => (
                      <div key={idx} className={`gallery-thumb ${idx === 3 && allImages.length > 5 ? 'has-more' : ''}`}>
                        <img src={img} alt={`${project.name} ${idx + 2}`} />
                        {idx === 3 && allImages.length > 5 && (
                          <div className="gallery-more-overlay">
                            <span>+{allImages.length - 5}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Project Hero Info */}
              <div className="overview-hero">
                <div className="overview-hero-left">
                  <h2 className="overview-title">{project.name}</h2>
                  <div className="overview-meta-row">
                    <span className={`meta-pill status-${project.computedStatus}`}>
                      <span className="status-dot"></span>
                      {project.computedStatus === 'funded' && t('status.funded')}
                      {project.computedStatus === 'active' && t('status.active')}
                      {project.computedStatus === 'paused' && t('status.paused')}
                      {project.computedStatus === 'closed' && t('status.closed')}
                      {project.computedStatus === 'draft' && t('status.draft')}
                    </span>
                    {project.expectedROI && (
                      <div className="meta-chip">
                        📈 ROI: <strong>{project.expectedROI}%</strong>
                      </div>
                    )}
                    {project.duration && (
                      <div className="meta-chip">
                        ⏱️ {t('projects.duration')}: <strong>{project.duration}m</strong>
                      </div>
                    )}
                    {project.category && (
                      <div className="meta-chip">
                        📁 {project.category}
                      </div>
                    )}
                  </div>
                  <div className="overview-badges">
                    <span className={`badge type-badge type-${project.type}`}>
                      {project.type === 'variable' ? `📊 ${t('projects.variable')}` : `🎯 ${t('projects.fixed')}`}
                    </span>
                    <span className={`badge risk-badge risk-${project.riskLevel}`}>
                      {project.riskLevel === 'low' && `🟢 ${t('projects.riskLow')}`}
                      {project.riskLevel === 'medium' && `🟡 ${t('projects.riskMedium')}`}
                      {project.riskLevel === 'high' && `🔴 ${t('projects.riskHigh')}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2-Column Layout */}
              <div className="overview-layout">
                {/* Left Column */}
                <div className="overview-main-col">
                  {/* About Section */}
                  {(project.description || project.body) && (
                    <section className="about-section">
                      <h3>📋 {t('projects.generalInfo')}</h3>
                      {project.description && <p className="about-text">{project.description}</p>}
                      {project.body && <p className="about-text">{project.body}</p>}
                    </section>
                  )}

                  {/* Key Highlights */}
                  <div className="highlights-grid">
                    <div className="highlight-card">
                      <div className="highlight-icon-wrap">💰</div>
                      <div className="highlight-content">
                        <h4>{t('projects.totalInvested')}</h4>
                        <p>{formatCurrency(investmentStats.totalAmount)}</p>
                      </div>
                    </div>
                    <div className="highlight-card">
                      <div className="highlight-icon-wrap">👥</div>
                      <div className="highlight-content">
                        <h4>{t('projects.investors')}</h4>
                        <p>{investmentStats.total}</p>
                        <span className="highlight-sub">{investmentStats.active} {t('projects.activeInvestorsCount')}</span>
                      </div>
                    </div>
                    <div className="highlight-card">
                      <div className="highlight-icon-wrap">📈</div>
                      <div className="highlight-content">
                        <h4>{t('projects.expectedROI')}</h4>
                        <p>{project.expectedROI ? `${project.expectedROI}%` : '—'}</p>
                      </div>
                    </div>
                    <div className="highlight-card">
                      <div className="highlight-icon-wrap">⏱️</div>
                      <div className="highlight-content">
                        <h4>{t('projects.duration')}</h4>
                        <p>{project.duration ? `${project.duration}m` : '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Info Sections */}
                  <div className="info-sections">
                    <div className="info-section">
                      <h3 className="section-title">📋 {t('projects.generalInfo')}</h3>
                      <div className="info-grid">
                        <div className="info-item">
                          <span className="info-key">{t('projects.creationDate')}</span>
                          <span className="info-val">{formatDate(project.createdAt)}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-key">{t('projects.lastUpdate')}</span>
                          <span className="info-val">{formatDate(project.updatedAt)}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-key">{t('projects.baseCurrency')}</span>
                          <span className="info-val">USD 🇺🇸</span>
                        </div>
                        <div className="info-item">
                          <span className="info-key">{t('projects.investmentStatus')}</span>
                          <span className="info-val">
                            {project.investable ? `✅ ${t('projects.openInvestment')}` : `🔒 ${t('projects.closedInvestment')}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {project.type === 'fixed' && (
                      <div className="info-section">
                        <h3 className="section-title">⚙️ {t('projects.fixedConfig')}</h3>
                        <div className="info-grid">
                          <div className="info-item">
                            <span className="info-key">{t('projects.targetCapital')}</span>
                            <span className="info-val bold">{formatCurrency(project.targetAmount)}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-key">{t('projects.minInvestment')}</span>
                            <span className="info-val">{formatCurrency(project.minInvestment)}</span>
                          </div>
                          {project.maxInvestment && (
                            <div className="info-item">
                              <span className="info-key">{t('projects.maxInvestment')}</span>
                              <span className="info-val">{formatCurrency(project.maxInvestment)}</span>
                            </div>
                          )}
                          <div className="info-item">
                            <span className="info-key">{t('projects.autoLockOnTarget')}</span>
                            <span className="info-val">
                              <span className={`pill ${project.autoLockOnTarget ? 'pill-on' : 'pill-off'}`}>
                                {project.autoLockOnTarget ? `✓ ${t('projects.activated')}` : `✗ ${t('projects.deactivated')}`}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {project.type === 'variable' && (
                      <div className="info-section">
                        <h3 className="section-title">📊 {t('projects.variableMetrics')}</h3>
                        <div className="metrics-cards">
                          <div className="metric-card performance">
                            <div className="metric-icon">📈</div>
                            <div className="metric-label">{t('projects.performance')}</div>
                            <div className="metric-value positive">
                              {project.performance !== undefined ? `${project.performance}%` : '—'}
                            </div>
                          </div>
                          <div className="metric-card drawdown">
                            <div className="metric-icon">📉</div>
                            <div className="metric-label">{t('projects.drawdown')}</div>
                            <div className="metric-value negative">
                              {project.drawdown !== undefined ? `${project.drawdown}%` : '—'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Sidebar */}
                <div className="overview-sidebar">
                  {/* Funding Card - Fixed */}
                  {project.type === 'fixed' && project.targetAmount && (
                    <div className="funding-card">
                      <div className="funding-card-header">
                        <span className="funding-label">{t('projects.capitalRaised')}</span>
                        <div className="funding-amounts">
                          <span className="funding-current">{formatCurrency(project.totalInvested)}</span>
                          <span className="funding-of">of {formatCurrency(project.targetAmount)}</span>
                        </div>
                      </div>
                      <div className="funding-progress-bar">
                        <div className="funding-progress-fill" style={{ width: `${Math.min(project.progress || 0, 100)}%` }}></div>
                      </div>
                      <div className="funding-progress-meta">
                        <span>{project.progress || 0}% {t('status.funded')}</span>
                        <span>{investmentStats.total} {t('projects.investors')}</span>
                      </div>
                      <div className="funding-stats-grid">
                        {project.minInvestment != null && (
                          <div className="funding-stat">
                            <span className="funding-stat-label">{t('projects.minInvestment')}</span>
                            <span className="funding-stat-value">{formatCurrency(project.minInvestment)}</span>
                          </div>
                        )}
                        {project.expectedROI != null && (
                          <div className="funding-stat">
                            <span className="funding-stat-label">{t('projects.expectedROI')}</span>
                            <span className="funding-stat-value accent">{project.expectedROI}%</span>
                          </div>
                        )}
                        {project.duration != null && (
                          <div className="funding-stat">
                            <span className="funding-stat-label">{t('projects.duration')}</span>
                            <span className="funding-stat-value">{project.duration}m</span>
                          </div>
                        )}
                        {project.maxInvestment != null && (
                          <div className="funding-stat">
                            <span className="funding-stat-label">{t('projects.maxInvestment')}</span>
                            <span className="funding-stat-value">{formatCurrency(project.maxInvestment)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Funding Card - Variable */}
                  {project.type === 'variable' && (
                    <div className="funding-card">
                      <div className="funding-card-header">
                        <span className="funding-label">{t('projects.variableMetrics')}</span>
                      </div>
                      <div className="funding-stats-grid">
                        <div className="funding-stat">
                          <span className="funding-stat-label">{t('projects.performance')}</span>
                          <span className="funding-stat-value accent">
                            {project.performance !== undefined ? `${project.performance}%` : '—'}
                          </span>
                        </div>
                        <div className="funding-stat">
                          <span className="funding-stat-label">{t('projects.drawdown')}</span>
                          <span className="funding-stat-value negative">
                            {project.drawdown !== undefined ? `${project.drawdown}%` : '—'}
                          </span>
                        </div>
                        {project.expectedROI != null && (
                          <div className="funding-stat">
                            <span className="funding-stat-label">{t('projects.expectedROI')}</span>
                            <span className="funding-stat-value accent">{project.expectedROI}%</span>
                          </div>
                        )}
                        {project.duration != null && (
                          <div className="funding-stat">
                            <span className="funding-stat-label">{t('projects.duration')}</span>
                            <span className="funding-stat-value">{project.duration}m</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick Info Card */}
                  <div className="quick-info-card">
                    <h4>{t('projects.generalInfo')}</h4>
                    <div className="quick-info-items">
                      <div className="quick-info-item">
                        <span>{t('projects.creationDate')}</span>
                        <strong>{formatDate(project.createdAt)}</strong>
                      </div>
                      <div className="quick-info-item">
                        <span>{t('projects.lastUpdate')}</span>
                        <strong>{formatDate(project.updatedAt)}</strong>
                      </div>
                      <div className="quick-info-item">
                        <span>{t('projects.baseCurrency')}</span>
                        <strong>USD 🇺🇸</strong>
                      </div>
                      <div className="quick-info-item">
                        <span>{t('projects.investmentStatus')}</span>
                        <strong>
                          {project.investable ? `✅ ${t('projects.openInvestment')}` : `🔒 ${t('projects.closedInvestment')}`}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'investments' && (
            <div className="investments-section">
              {invLoading ? (
                <div className="loading-state">{t('investments.loadingInvestments')}</div>
              ) : investments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💼</div>
                  <div className="empty-title">{t('projects.noInvestmentsTitle')}</div>
                  <div className="empty-subtitle">{t('projects.noInvestmentsSubtitle')}</div>
                </div>
              ) : (
                <div className="investments-table-wrapper">
                  <table className="investments-table">
                    <thead>
                      <tr>
                        <th>{t('projects.investor')}</th>
                        <th>{t('investments.amount')}</th>
                        <th>{t('investments.expectedROI')}</th>
                        <th>{t('investments.status')}</th>
                        <th>{t('investments.date')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {investments.map((inv) => (
                        <tr key={inv.id} onClick={() => setSelectedInvestmentId(inv.id)} className="clickable-row">
                          <td>
                            <div className="investor-cell">
                              <div className="investor-name">{inv.userName || t('users.user')}</div>
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
                              {inv.status === 'active' && `🟢 ${t('investments.active')}`}
                              {inv.status === 'completed' && `✅ ${t('investments.completed')}`}
                              {inv.status === 'cancelled' && `❌ ${t('investments.cancelled')}`}
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
                  <div className="empty-title">{t('projects.noActivityTitle')}</div>
                  <div className="empty-subtitle">{t('projects.noActivitySubtitle')}</div>
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
                            {event.visibility === 'admin' && t('projects.adminOnly')}
                            {event.visibility === 'investors' && t('projects.investorsOnly')}
                            {event.visibility === 'all' && t('common.all')}
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
