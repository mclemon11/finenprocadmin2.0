import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import useAdminProjects from '../hooks/useAdminProjects';
import ProjectFormModal from '../components/modals/ProjectFormModal';
import ProjectDetailDrawer from '../components/drawers/ProjectDetailDrawer';
import { db } from '../../firebase/firebaseConfig';
import './ProyectosPage.css';

export default function ProyectosPage({ adminData }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectProject = searchParams.get('projectId') || '';
  const { projects, loading, refetch } = useAdminProjects();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    status: 'all',
    risk: 'all',
  });
  const [actionLoading, setActionLoading] = useState(null);

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
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedProject(null);
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
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  return (
    <div className="proyectos-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Catálogo de Proyectos</h1>
          <p className="page-subtitle">Gestión y control de productos financieros</p>
        </div>
        <button className="create-btn" onClick={() => setIsModalOpen(true)}>
          + Crear proyecto
        </button>
      </div>

      <div className="kpis-section">
        <div className="kpi-card">
          <div className="kpi-label">Proyectos Totales</div>
          <div className="kpi-value">{kpis.total}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Activos</div>
          <div className="kpi-value kpi-success">{kpis.active}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Funded</div>
          <div className="kpi-value kpi-info">{kpis.funded}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Capital Total</div>
          <div className="kpi-value kpi-currency">{formatCurrency(kpis.totalCapital)}</div>
        </div>
      </div>

      <div className="filters-section">
        <select
          className="filter-select"
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        >
          <option value="all">Todos los tipos</option>
          <option value="fixed">Fijos</option>
          <option value="variable">Variables</option>
        </select>

        <select
          className="filter-select"
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
        >
          <option value="all">Todas las categorías</option>
          {categories.filter((c) => c !== 'all').map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="all">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="active">Activo</option>
          <option value="paused">Pausado</option>
          <option value="funded">Funded</option>
          <option value="closed">Cerrado</option>
        </select>

        <select
          className="filter-select"
          value={filters.risk}
          onChange={(e) => setFilters({ ...filters, risk: e.target.value })}
        >
          <option value="all">Todos los riesgos</option>
          <option value="low">Bajo</option>
          <option value="medium">Medio</option>
          <option value="high">Alto</option>
        </select>
      </div>

      <div className="proyectos-card">
        <div className="card-header">
          <h3>{filteredProjects.length} proyectos</h3>
        </div>
        {loading ? (
          <div className="loading-state">Cargando proyectos...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="empty-state">No hay proyectos con estos filtros</div>
        ) : (
          <div className="table-wrapper">
            <table className="proyectos-table">
                <thead>
                  <tr>
                    <th>Proyecto</th>
                    <th>Tipo</th>
                    <th>Riesgo</th>
                    <th>Estado</th>
                    <th>Capital / Métricas</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((p) => (
                    <tr key={p.id} className={p.id === preselectProject ? 'highlight' : ''}>
                      <td>
                        <div className="cell-title">{p.name || 'Proyecto sin nombre'}</div>
                        <div className="cell-subtle">{p.createdAt ? 'Creado' : 'Sin fecha'}</div>
                      </td>
                      <td>
                        <span className={`type-badge type-${p.type || 'fixed'}`}>
                          {p.type === 'variable' ? 'Variable' : 'Fijo'}
                        </span>
                      </td>
                      <td>
                        <span className={`risk-badge risk-${p.riskLevel || 'medium'}`}>
                          {p.riskLevel === 'low' && 'Bajo'}
                          {p.riskLevel === 'medium' && 'Medio'}
                          {p.riskLevel === 'high' && 'Alto'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${p.computedStatus || 'draft'}`}>
                          {p.computedStatus === 'funded' && 'Funded'}
                          {p.computedStatus === 'active' && 'Activo'}
                          {p.computedStatus === 'paused' && 'Pausado'}
                          {p.computedStatus === 'closed' && 'Cerrado'}
                          {p.computedStatus === 'draft' && 'Borrador'}
                        </span>
                      </td>
                      <td>
                        {p.type === 'fixed' ? (
                          <div className="progress-col">
                            <div className="progress-top">{p.totalInvested ? `MXN ${p.totalInvested}` : 'Sin inversiones'}</div>
                            {p.targetAmount ? (
                              <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${p.progress || 0}%` }}></div>
                              </div>
                            ) : (
                              <div className="cell-subtle">Sin target definido</div>
                            )}
                            {p.targetAmount && (
                              <div className="progress-foot">{p.progress || 0}% de MXN {p.targetAmount}</div>
                            )}
                          </div>
                        ) : (
                          <div className="metrics-col">
                            <div className="metric-line">Performance: {p.performance !== undefined && p.performance !== null ? `${p.performance}%` : '—'}</div>
                            <div className="metric-line">Drawdown: {p.drawdown !== undefined && p.drawdown !== null ? `${p.drawdown}%` : '—'}</div>
                          </div>
                        )}
                      </td>
                      <td className="actions-cell">
                        <button className="link-btn primary-link" onClick={() => openDetail(p)}>Ver detalle</button>
                        <button className="link-btn" onClick={() => goToInvestments(p.id)}>Ver inversiones</button>
                        {!p.investable && <span className="cell-subtle">Bloqueado para nuevas inversiones</span>}
                        {p.computedStatus === 'draft' && (
                          <button className="link-btn" disabled={!!actionLoading} onClick={() => handleStatusChange(p.id, 'active')}>
                            Activar
                          </button>
                        )}
                        {p.computedStatus === 'active' && (
                          <>
                            <button className="link-btn" disabled={!!actionLoading} onClick={() => handleStatusChange(p.id, 'paused')}>
                              Pausar
                            </button>
                            <button className="link-btn" disabled={!!actionLoading} onClick={() => handleStatusChange(p.id, 'closed')}>
                              Cerrar
                            </button>
                          </>
                        )}
                        {p.computedStatus === 'paused' && (
                          <button className="link-btn" disabled={!!actionLoading} onClick={() => handleStatusChange(p.id, 'active')}>
                            Reanudar
                          </button>
                        )}
                        {p.computedStatus === 'funded' && (
                          <button className="link-btn" disabled={!!actionLoading} onClick={() => handleStatusChange(p.id, 'closed')}>
                            Cerrar
                          </button>
                        )}
                        {p.computedStatus === 'closed' && <span className="cell-subtle">Cerrado</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>


      <ProjectDetailDrawer
        project={selectedProject}
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        onRefresh={refetch}
        adminData={adminData}
      />
      <ProjectFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
