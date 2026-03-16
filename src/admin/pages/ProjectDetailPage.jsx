import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAdminProjects from '../hooks/useAdminProjects';
import useAdminInvestments from '../hooks/useAdminInvestments';
import useProjectTimeline from '../hooks/useProjectTimeline';
import { useProjectChat, useProjectMembers } from '../hooks/useChat';
import { useProjectTasks } from '../hooks/useTasks';
import { useLanguage } from '../../context/LanguageContext';
import ProjectEditModal from '../components/modals/ProjectEditModal';
import FixedProjectEditModal from '../components/modals/FixedProjectEditModal';
import RegisterUpdateModal from '../components/modals/RegisterUpdateModal';
import ProjectTimeline from '../components/project/ProjectTimeline';
import MembersTab from '../components/project/MembersTab';
import ChatTab from '../components/project/ChatTab';
import TasksTab from '../components/project/TasksTab';
import { getProjectUpdates, deleteProjectUpdate, calculatePerformanceSummary } from '../services/projectUpdates.service';
import { getAdvisorById } from '../services/advisor.service';
import Swal from 'sweetalert2';
import './ProjectDetailPage.css';

export default function ProjectDetailPage({ adminData }) {
  const { t, currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { projects, refetch } = useAdminProjects();
  const { investments, loading: invLoading } = useAdminInvestments({ projectId });
  const { addEvent } = useProjectTimeline(projectId);

  // Chat & members hooks
  const { messages: chatMessages, loading: chatLoading, send: sendChat } = useProjectChat(projectId);
  const project = projects.find((p) => p.id === projectId);
  const { members, loading: membersLoading, addMember, removeMember } = useProjectMembers(projectId, project);
  const { tasks, loading: tasksLoading, addTask, editTask, removeTask } = useProjectTasks(projectId);

  const [activeTab, setActiveTab] = useState('overview');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [mode, setMode] = useState('view'); // view | edit | readonly (UI only)

  // Variable project updates state
  const [projectUpdates, setProjectUpdates] = useState([]);
  const [updatesLoading, setUpdatesLoading] = useState(false);
  const [isRegisterUpdateOpen, setIsRegisterUpdateOpen] = useState(false);
  const [assignedAdvisor, setAssignedAdvisor] = useState(null);

  // Fetch assigned advisor
  useEffect(() => {
    if (project?.advisorId) {
      getAdvisorById(project.advisorId).then(res => {
        if (res.success && res.data) setAssignedAdvisor(res.data);
        else setAssignedAdvisor(null);
      });
    } else {
      setAssignedAdvisor(null);
    }
  }, [project?.advisorId]);

  // Fetch project updates for variable projects
  const fetchUpdates = async () => {
    if (!projectId) return;
    setUpdatesLoading(true);
    const data = await getProjectUpdates(projectId);
    setProjectUpdates(data);
    setUpdatesLoading(false);
  };

  useEffect(() => {
    if (project?.type === 'variable' && projectId) {
      fetchUpdates();
    }
  }, [project?.type, projectId]);

  // Performance summary for variable projects
  const performanceSummary = useMemo(() => {
    if (project?.type !== 'variable' || !project?.expectedReturn) return null;
    return calculatePerformanceSummary(
      projectUpdates,
      project.expectedReturn,
      project.returnPeriod || 'monthly',
      project.totalInvested || 0
    );
  }, [project, projectUpdates]);

  const handleDeleteUpdate = async (update) => {
    const result = await Swal.fire({
      title: t('projectUpdates.confirmDelete'),
      text: t('projectUpdates.confirmDeleteText'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: t('projectUpdates.yesDelete'),
      cancelButtonText: t('common.cancel'),
      background: '#1a1f2e',
      color: '#ffffff',
      customClass: { popup: 'swal-dark-popup' },
    });
    if (!result.isConfirmed) return;
    await deleteProjectUpdate(update.id, update.media || []);
    fetchUpdates();
  };

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
            <span className="locked-badge"> {t('projectDetail.projectLocked')}</span>
          )}
          {computedMode !== 'readonly' && (
            <>
              {project.type === 'variable' && (
                <button className="ghost-btn update-btn" onClick={() => setIsRegisterUpdateOpen(true)}>
                  📊 {t('projectDetail.registerUpdate')}
                </button>
              )}
              <button className="ghost-btn" onClick={() => setActiveTab('timeline')}>
                 {t('projectDetail.publishEvent')}
              </button>
              <button className="edit-btn" onClick={() => setIsEditOpen(true)}>
                 {t('projectDetail.editProject')}
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
              {project.type === 'variable' ? ` ${t('projectDetail.variable')}` : ` ${t('projectDetail.fixed')}`}
            </span>
            <span className={`risk-badge risk-${project.riskLevel}`}>
              {project.riskLevel === 'low' && `${t('projectDetail.riskLow')}`}
              {project.riskLevel === 'medium' && `🟡 ${t('projectDetail.riskMedium')}`}
              {project.riskLevel === 'high' && ` ${t('projectDetail.riskHigh')}`}
            </span>
            <span className={`status-badge status-${project.computedStatus}`}>
              {project.computedStatus === 'funded' && ` ${t('projectDetail.statusFunded')}`}
              {project.computedStatus === 'active' && `${t('projectDetail.statusActive')}`}
              {project.computedStatus === 'paused' && ` ${t('projectDetail.statusPaused')}`}
              {project.computedStatus === 'closed' && ` ${t('projectDetail.statusClosed')}`}
              {project.computedStatus === 'draft' && ` ${t('projectDetail.statusDraft')}`}
            </span>
          </div>
          {project.category && <div className="project-category"> {project.category}</div>}
        </div>

        {/* Barra de progreso para proyectos FIJOS */}
        {project.type === 'fixed' && project.targetAmount && (
          <div className="progress-card">
            <div className="progress-header">
              <span className="progress-label"> {t('projectDetail.capitalRaised')}</span>
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
           {t('projectDetail.overview')}
        </button>
        <button
          className={`tab ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          👥 {t('projectDetail.members')} ({members.length})
        </button>
        <button
          className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          💬 {t('projectDetail.chat')}
        </button>
        <button
          className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          📋 {t('projectDetail.tasks')} ({tasks.length})
        </button>
        <button
          className={`tab ${activeTab === 'investments' ? 'active' : ''}`}
          onClick={() => setActiveTab('investments')}
        >
           {t('projectDetail.investments')} ({investments.length})
        </button>
        <button
          className={`tab ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
           {t('projectDetail.timeline')}
        </button>
        {project.type === 'variable' && (
          <button
            className={`tab ${activeTab === 'updates' ? 'active' : ''}`}
            onClick={() => setActiveTab('updates')}
          >
            📊 {t('projectDetail.updates')} ({projectUpdates.length})
          </button>
        )}
      </div>

      {/* Contenido de tabs */}
      <div className="detail-content">
        {activeTab === 'overview' && (
          <div className="overview-layout">
            {/* KPI Cards */}
            <div className="kpi-section">
              <div className="kpi-card">
                <div className="kpi-icon"></div>
                <div className="kpi-content">
                  <div className="kpi-label">{t('projectDetail.totalInvested')}</div>
                  <div className="kpi-value">{formatCurrency(project.totalInvested || 0)}</div>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon"></div>
                <div className="kpi-content">
                  <div className="kpi-label">{t('projectDetail.investors')}</div>
                  <div className="kpi-value">{investments.length}</div>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon"></div>
                <div className="kpi-content">
                  <div className="kpi-label">{t('projectDetail.expectedROI')}</div>
                  <div className="kpi-value">{project.expectedROI ? `${project.expectedROI}%` : '—'}</div>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon"></div>
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
                <h3> {t('projectDetail.generalInfo')}</h3>
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
                    <span className="info-value">USD </span>
                  </div>
                  {project.category && (
                    <div className="info-row">
                      <span className="info-label">{t('projectDetail.category')}</span>
                      <span className="info-value">{project.category}</span>
                    </div>
                  )}
                  <div className="info-row">
                    <span className="info-label">{t('projectDetail.advisor')}</span>
                    <span className="info-value">
                      {assignedAdvisor ? (
                        <span className="advisor-badge">
                          {assignedAdvisor.photoUrl && <img src={assignedAdvisor.photoUrl} alt="" className="advisor-badge-photo" />}
                          {assignedAdvisor.name}
                        </span>
                      ) : (
                        <span className="text-muted">{t('projectDetail.noAdvisorAssigned')}</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Configuración según tipo */}
              {project.type === 'fixed' && (
                <div className="info-card">
                  <h3> {t('projectDetail.fixedConfig')}</h3>
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
                          {project.autoLockOnTarget ? ` ${t('common.enabled')}` : ` ${t('common.disabled')}`}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {project.type === 'variable' && (
                <div className="info-card">
                  <h3> {t('projectDetail.variableMetrics')}</h3>
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
                      <span className="info-label">{t('projectDetail.expectedReturn')}</span>
                      <span className="info-value highlight">
                        {project.expectedReturn ? `${project.expectedReturn}%` : '—'}
                        {project.returnPeriod && (
                          <span className="period-badge">
                            {project.returnPeriod === 'monthly' ? t('projectDetail.monthly') : project.returnPeriod === 'quarterly' ? t('projectDetail.quarterly') : t('projectDetail.yearly')}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">{t('projectDetail.manualControl')}</span>
                      <span className="info-value">
                        <span className={`pill ${project.manualControl ? 'pill-on' : 'pill-off'}`}>
                          {project.manualControl ? ` ${t('common.enabled')}` : ` ${t('common.disabled')}`}
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

              {/* Performance Comparison Card (variable projects) */}
              {project.type === 'variable' && performanceSummary && (
                <div className={`info-card performance-card comparison-${performanceSummary.comparison}`}>
                  <h3>📊 {t('projectDetail.performanceComparison')}</h3>
                  <div className="info-content">
                    <div className="info-row">
                      <span className="info-label">{t('projectDetail.totalProfit')}</span>
                      <span className="info-value positive">{formatCurrency(performanceSummary.totalProfit)}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">{t('projectDetail.totalLoss')}</span>
                      <span className="info-value negative">{formatCurrency(performanceSummary.totalLoss)}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">{t('projectDetail.netReturn')}</span>
                      <span className={`info-value ${performanceSummary.netReturn >= 0 ? 'positive' : 'negative'}`}>
                        {formatCurrency(performanceSummary.netReturn)}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">{t('projectDetail.expectedAmount')}</span>
                      <span className="info-value">{formatCurrency(performanceSummary.expectedAmount)}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">{t('projectDetail.comparisonResult')}</span>
                      <span className={`info-value comparison-indicator comparison-${performanceSummary.comparison}`}>
                        {performanceSummary.comparison === 'above' && `📈 ${t('projectDetail.aboveExpected')}`}
                        {performanceSummary.comparison === 'below' && `📉 ${t('projectDetail.belowExpected')}`}
                        {performanceSummary.comparison === 'equal' && `✅ ${t('projectDetail.onTrack')}`}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <MembersTab
            projectId={projectId}
            members={members}
            onAddMember={addMember}
            onRemoveMember={removeMember}
          />
        )}

        {activeTab === 'chat' && (
          <ChatTab
            messages={chatMessages}
            loading={chatLoading}
            onSend={sendChat}
            currentUser={adminData}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksTab
            tasks={tasks}
            loading={tasksLoading}
            members={members}
            onAddTask={addTask}
            onEditTask={editTask}
            onRemoveTask={removeTask}
          />
        )}

        {activeTab === 'investments' && (
          <div className="investments-section">
            {invLoading ? (
              <div className="loading-state"> {t('projectDetail.loadingInvestments')}</div>
            ) : investments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"></div>
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
                            {inv.status === 'active' && `${t('projectDetail.invActive')}`}
                            {inv.status === 'completed' && ` ${t('projectDetail.invCompleted')}`}
                            {inv.status === 'cancelled' && ` ${t('projectDetail.invCancelled')}`}
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

        {activeTab === 'updates' && project.type === 'variable' && (
          <div className="updates-section">
            <div className="updates-header">
              <h3>{t('projectDetail.projectUpdates')}</h3>
              <button className="register-btn" onClick={() => setIsRegisterUpdateOpen(true)}>
                + {t('projectDetail.registerUpdate')}
              </button>
            </div>

            {updatesLoading ? (
              <div className="loading-state">⏳ {t('projectDetail.loadingUpdates')}</div>
            ) : projectUpdates.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <p>{t('projectDetail.noUpdates')}</p>
              </div>
            ) : (
              <div className="updates-timeline">
                {projectUpdates.map((update) => (
                  <div key={update.id} className={`update-card update-type-${update.type}`}>
                    <div className="update-card-header">
                      <div className="update-type-badge">
                        {update.type === 'status_update' && '📋'}
                        {update.type === 'profit' && '📈'}
                        {update.type === 'loss' && '📉'}
                        <span>
                          {update.type === 'status_update' && t('projectUpdates.statusUpdate')}
                          {update.type === 'profit' && t('projectUpdates.profit')}
                          {update.type === 'loss' && t('projectUpdates.loss')}
                        </span>
                      </div>
                      <div className="update-card-actions">
                        <span className="update-date">{formatDate(update.createdAt)}</span>
                        <button className="update-delete-btn" onClick={() => handleDeleteUpdate(update)}>
                          🗑️
                        </button>
                      </div>
                    </div>
                    <h4 className="update-title">{update.title}</h4>
                    {update.description && <p className="update-description">{update.description}</p>}
                    {update.amount !== null && update.amount !== undefined && (
                      <div className={`update-amount ${update.amount >= 0 ? 'positive' : 'negative'}`}>
                        {update.amount >= 0 ? '+' : ''}{formatCurrency(update.amount)}
                      </div>
                    )}
                    {update.media && update.media.length > 0 && (
                      <div className="update-media">
                        {update.media.map((m, idx) => (
                          <a key={idx} href={m.url} target="_blank" rel="noopener noreferrer" className="media-link">
                            📎 {m.fileName || `${t('projectUpdates.file')} ${idx + 1}`}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
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

      {/* Modal para registrar actualizaciones de proyecto variable */}
      {project.type === 'variable' && (
        <RegisterUpdateModal
          projectId={projectId}
          isOpen={isRegisterUpdateOpen}
          onClose={() => setIsRegisterUpdateOpen(false)}
          onSuccess={fetchUpdates}
        />
      )}
    </div>
  );
}
