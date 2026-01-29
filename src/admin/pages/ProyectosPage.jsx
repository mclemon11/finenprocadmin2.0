import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import useAdminProjects from '../hooks/useAdminProjects';
import ProjectFormModal from '../components/modals/ProjectFormModal';
import ProjectDetailDrawer from '../components/drawers/ProjectDetailDrawer';
import { db } from '../../firebase/firebaseConfig';
import { formatMoney } from '../../utils/formatMoney';
import { useLanguage } from '../../context/LanguageContext';
import './ProyectosPage.css';

export default function ProyectosPage({ adminData }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectProject = searchParams.get('projectId') || '';
  const { projects, loading, refetch } = useAdminProjects();
  const { t } = useLanguage();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState('overview');
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    status: 'all',
    risk: 'all',
  });
  const [actionLoading, setActionLoading] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
  });
  const [actionMenuOpen, setActionMenuOpen] = useState(null);

  // Limpiar estado al cerrar drawer y prevenir scroll del body
  useEffect(() => {
    if (!isDrawerOpen) {
      setSelectedProject(null);
      setActiveDrawerTab('overview');
      document.body.style.overflow = '';
    } else {
      document.body.style.overflow = 'hidden';
    }
  }, [isDrawerOpen]);

  // Sincronizar el proyecto seleccionado cuando se refresca la lista
  useEffect(() => {
    if (!isDrawerOpen || !selectedProject?.id) return;
    const updated = projects.find((p) => p.id === selectedProject.id);
    if (updated && updated !== selectedProject) {
      setSelectedProject(updated);
    }
  }, [projects, isDrawerOpen, selectedProject?.id]);

  const handleModalSuccess = () => {
    refetch();
  };

  const handleStatusChange = async (projectId, nextStatus) => {
    if (!projectId || !nextStatus) return;
    try {
      setActionLoading(projectId);
      await updateDoc(doc(db, 'projects', projectId), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
      refetch();
    } catch (err) {
      console.error('Error actualizando estado', err);
    } finally {
      setActionLoading(null);
    }
  };

  const goToInvestments = (projectId) => {
    if (!projectId) return;
    navigate(`/admin/operaciones/inversiones?projectId=${projectId}`);
  };

  const openDetail = (project) => {
    setSelectedProject(project);
    setActiveDrawerTab('overview');
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const categories = useMemo(() => {
    const cats = new Set();
    projects.forEach((p) => p.category && cats.add(p.category));
    return ['all', ...Array.from(cats)];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (filters.type !== 'all' && p.type !== filters.type) return false;
      if (filters.category !== 'all' && p.category !== filters.category) return false;
      if (filters.status !== 'all' && p.computedStatus !== filters.status) return false;
      if (filters.risk !== 'all' && p.riskLevel !== filters.risk) return false;
      return true;
    });
  }, [projects, filters]);

  const paginatedProjects = useMemo(() => {
    const start = (pagination.page - 1) * pagination.perPage;
    const end = start + pagination.perPage;
    return filteredProjects.slice(start, end);
  }, [filteredProjects, pagination]);

  const totalPages = Math.ceil(filteredProjects.length / pagination.perPage);

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePerPageChange = (newPerPage) => {
    setPagination({ page: 1, perPage: newPerPage });
  };

  const kpis = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.computedStatus === 'active').length;
    const funded = projects.filter((p) => p.computedStatus === 'funded').length;
    const totalCapital = projects
      .filter((p) => p.type === 'fixed')
      .reduce((acc, p) => acc + Number(p.totalInvested || 0), 0);
    return { total, active, funded, totalCapital };
  }, [projects]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  return (
    <div className="proyectos-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('projects.title')}</h1>
          <p className="page-subtitle">{t('projects.subtitle')}</p>
        </div>
        <button className="create-btn" onClick={() => setIsModalOpen(true)}>
          + {t('projects.createProject')}
        </button>
      </div>

      <div className="kpis-section">
        <div className="kpi-card">
          <div className="kpi-label">{t('projects.totalProjects')}</div>
          <div className="kpi-value">{kpis.total}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('projects.activeProjects')}</div>
          <div className="kpi-value kpi-success">{kpis.active}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('projects.fundedProjects')}</div>
          <div className="kpi-value kpi-info">{kpis.funded}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('projects.totalCapital')}</div>
          <div className="kpi-value kpi-currency">{formatCurrency(kpis.totalCapital)}</div>
        </div>
      </div>

      <div className="filters-bar">
        <div className="filters-row">
          <div className="filter-group">
            <label className="filter-label">{t('projects.type')}</label>
            <select
              className="filter-select"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="all">{t('common.all')}</option>
              <option value="fixed">{t('projects.fixed')}</option>
              <option value="variable">{t('projects.variable')}</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">{t('projects.category')}</label>
            <select
              className="filter-select"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="all">{t('projects.allCategories')}</option>
              {categories.filter((c) => c !== 'all').map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">{t('projects.status')}</label>
            <select
              className="filter-select"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">{t('common.all')}</option>
              <option value="draft">{t('status.draft')}</option>
              <option value="active">{t('status.active')}</option>
              <option value="paused">{t('status.paused')}</option>
              <option value="funded">{t('status.funded')}</option>
              <option value="closed">{t('status.closed')}</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">{t('projects.risk')}</label>
            <select
              className="filter-select"
              value={filters.risk}
              onChange={(e) => setFilters({ ...filters, risk: e.target.value })}
            >
              <option value="all">{t('common.all')}</option>
              <option value="low">{t('projects.riskLow')}</option>
              <option value="medium">{t('projects.riskMedium')}</option>
              <option value="high">{t('projects.riskHigh')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="proyectos-card">
        <div className="card-header">
          <div className="card-header-left">
            <h3>{filteredProjects.length} {t('projects.projectsFound')}</h3>
          </div>
          <div className="card-header-right">
            <label className="per-page-label">
              {t('common.show')}:
              <select
                className="per-page-select"
                value={pagination.perPage}
                onChange={(e) => handlePerPageChange(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
          </div>
        </div>
        {loading ? (
          <div className="loading-state">{t('projects.loadingProjects')}</div>
        ) : filteredProjects.length === 0 ? (
          <div className="empty-state">{t('projects.noProjects')}</div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="proyectos-table">
                <thead>
                  <tr>
                    <th>{t('projects.project')}</th>
                    <th>{t('projects.type')}</th>
                    <th>{t('projects.risk')}</th>
                    <th>{t('projects.status')}</th>
                    <th>{t('projects.capitalMetrics')}</th>
                    <th className="actions-header">{t('projects.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProjects.map((p) => (
                    <tr key={p.id} className={p.id === preselectProject ? 'highlight' : ''}>
                      <td>
                        <div className="cell-title">{p.name || t('projects.projectNoName')}</div>
                        <div className="cell-subtle">{p.createdAt ? t('common.created') : t('common.noDate')}</div>
                      </td>
                      <td>
                        <span className={`type-badge type-${p.type || 'fixed'}`}>
                          {p.type === 'variable' ? t('projects.variable') : t('projects.fixed')}
                        </span>
                      </td>
                      <td>
                        <span className={`risk-badge risk-${p.riskLevel || 'medium'}`}>
                          {p.riskLevel === 'low' && t('projects.riskLow')}
                          {p.riskLevel === 'medium' && t('projects.riskMedium')}
                          {p.riskLevel === 'high' && t('projects.riskHigh')}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${p.computedStatus || 'draft'}`}>
                          {p.computedStatus === 'funded' && t('status.funded')}
                          {p.computedStatus === 'active' && t('status.active')}
                          {p.computedStatus === 'paused' && t('status.paused')}
                          {p.computedStatus === 'closed' && t('status.closed')}
                          {p.computedStatus === 'draft' && t('status.draft')}
                        </span>
                      </td>
                      <td>
                        {p.type === 'fixed' ? (
                          <div className="progress-col">
                            <div className="progress-top">{p.totalInvested ? `$${formatMoney(p.totalInvested)} USD` : t('projects.noInvestments')}</div>
                            {p.targetAmount ? (
                              <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${p.progress || 0}%` }}></div>
                              </div>
                            ) : (
                              <div className="cell-subtle">{t('projects.noTargetDefined')}</div>
                            )}
                            {p.targetAmount && (
                              <div className="progress-foot">{p.progress || 0}% {t('projects.ofTarget')} ${formatMoney(p.targetAmount)} USD</div>
                            )}
                          </div>
                        ) : (
                          <div className="metrics-col">
                            <div className="metric-line">{t('projects.performance')}: {p.performance !== undefined && p.performance !== null ? `${p.performance}%` : '—'}</div>
                            <div className="metric-line">{t('projects.drawdown')}: {p.drawdown !== undefined && p.drawdown !== null ? `${p.drawdown}%` : '—'}</div>
                          </div>
                        )}
                      </td>
                      <td className="actions-cell">
                        <div className="actions-wrapper">
                          <button
                            className="action-btn-icon"
                            onClick={() => openDetail(p)}
                            title={t('projects.viewDetail')}
                          >
                            👁️
                          </button>
                          <div className="action-menu-wrapper">
                            <button
                              className="action-menu-btn"
                              onClick={() => setActionMenuOpen(actionMenuOpen === p.id ? null : p.id)}
                              title={t('projects.moreActions')}
                            >
                              ⋮
                            </button>
                            {actionMenuOpen === p.id && (
                              <div className="action-menu">
                                <button
                                  className="action-menu-item"
                                  onClick={() => {
                                    goToInvestments(p.id);
                                    setActionMenuOpen(null);
                                  }}
                                >
                                  {t('projects.viewInvestments')}
                                </button>
                                {p.computedStatus === 'draft' && (
                                  <button
                                    className="action-menu-item"
                                    disabled={!!actionLoading}
                                    onClick={() => {
                                      handleStatusChange(p.id, 'active');
                                      setActionMenuOpen(null);
                                    }}
                                  >
                                    ✓ {t('projects.activate')}
                                  </button>
                                )}
                                {p.computedStatus === 'active' && (
                                  <>
                                    <button
                                      className="action-menu-item"
                                      disabled={!!actionLoading}
                                      onClick={() => {
                                        handleStatusChange(p.id, 'paused');
                                        setActionMenuOpen(null);
                                      }}
                                    >
                                      ⏸ {t('projects.pause')}
                                    </button>
                                    <button
                                      className="action-menu-item danger"
                                      disabled={!!actionLoading}
                                      onClick={() => {
                                        handleStatusChange(p.id, 'closed');
                                        setActionMenuOpen(null);
                                      }}
                                    >
                                      🔒 {t('projects.close')}
                                    </button>
                                  </>
                                )}
                                {p.computedStatus === 'paused' && (
                                  <button
                                    className="action-menu-item"
                                    disabled={!!actionLoading}
                                    onClick={() => {
                                      handleStatusChange(p.id, 'active');
                                      setActionMenuOpen(null);
                                    }}
                                  >
                                    ▶ {t('projects.resume')}
                                  </button>
                                )}
                                {p.computedStatus === 'funded' && (
                                  <button
                                    className="action-menu-item danger"
                                    disabled={!!actionLoading}
                                    onClick={() => {
                                      handleStatusChange(p.id, 'closed');
                                      setActionMenuOpen(null);
                                    }}
                                  >
                                    🔒 {t('projects.close')}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  ← {t('common.previous')}
                </button>
                <div className="pagination-info">
                  {t('common.page')} {pagination.page} {t('common.of')} {totalPages}
                </div>
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === totalPages}
                >
                  {t('common.next')} →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <ProjectDetailDrawer
        project={selectedProject}
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        onRefresh={refetch}
        adminData={adminData}
        activeTab={activeDrawerTab}
        onTabChange={setActiveDrawerTab}
      />
      <ProjectFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
