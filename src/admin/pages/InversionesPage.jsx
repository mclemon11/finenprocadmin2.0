import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAdminInvestments from '../hooks/useAdminInvestments';
import useAdminProjects from '../hooks/useAdminProjects';
import './InversionesPage.css';

export default function InversionesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialProject = searchParams.get('projectId') || '';
  const initialUser = searchParams.get('userId') || '';

  const [filters, setFilters] = useState({ status: 'all', projectId: initialProject, userId: initialUser, search: '' });

  const { projects } = useAdminProjects();
  const { investments, loading, totalAmount } = useAdminInvestments({
    status: filters.status,
    projectId: filters.projectId || undefined,
    userId: filters.userId || undefined,
  });

  useEffect(() => {
    // Sincroniza filtros con query params para navegar desde otros módulos.
    setFilters((prev) => ({
      ...prev,
      projectId: initialProject,
      userId: initialUser,
    }));
  }, [initialProject, initialUser]);

  const statusFilters = [
    { value: 'all', label: 'Todas' },
    { value: 'active', label: 'Activas' },
    { value: 'completed', label: 'Completadas' },
    { value: 'cancelled', label: 'Canceladas' },
  ];

  const formatCurrency = (amount) => new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
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

  return (
    <div className="inversiones-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Inversiones</h1>
          <p className="page-subtitle">Contexto completo: usuario, proyecto y ROI real vs esperado</p>
        </div>
      </div>

      <div className="inversiones-summary">
        <div className="summary-card">
          <div className="summary-label">Total Invertido</div>
          <div className="summary-value">{formatCurrency(totalAmount)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Inversiones Activas</div>
          <div className="summary-value">{investments.filter(i => i.status === 'active').length}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total de Inversiones</div>
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
          <option value="">Todos los proyectos</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name || 'Proyecto sin nombre'}</option>
          ))}
        </select>

        <input
          type="text"
          className="filter-input"
          placeholder="Buscar usuario (email/nombre)"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>

      <div className="inversiones-card">
        <div className="card-header">
          <h3>Inversiones</h3>
        </div>

        {loading ? (
          <div className="loading-state">Cargando inversiones...</div>
        ) : filteredInvestments.length === 0 ? (
          <div className="empty-state">No hay inversiones con estos filtros</div>
        ) : (
          <div className="table-wrapper">
            <table className="inversiones-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Proyecto</th>
                  <th>Monto</th>
                  <th>ROI Esperado</th>
                  <th>ROI Real</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvestments.map(inv => (
                  <tr key={inv.id}>
                    <td>
                      <div className="cell-title">{inv.userName || 'Usuario sin datos'}</div>
                      <div className="cell-subtle">{inv.userEmail || 'Email no disponible'}</div>
                    </td>
                    <td>
                      <div className="cell-title">{inv.projectName || 'Proyecto sin nombre'}</div>
                      <div className="cell-subtle">{inv.expectedReturn ? 'Con retorno esperado' : 'Retorno no definido'}</div>
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
                        {inv.status === 'active' && 'Activa'}
                        {inv.status === 'completed' && 'Completada'}
                        {inv.status === 'cancelled' && 'Cancelada'}
                      </span>
                    </td>
                    <td>{formatDate(inv.createdAt)}</td>
                    <td className="actions-cell">
                      <button className="link-btn" onClick={() => goToUser(inv.userId)}>Ver usuario</button>
                      <button className="link-btn" onClick={() => goToProject(inv.projectId)} disabled={!inv.projectId}>Ver proyecto</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
