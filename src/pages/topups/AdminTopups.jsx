import React, { useState } from 'react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import { useAdminTopups } from '../../hooks/useAdminTopups';
import './AdminTopups.css';

export default function AdminTopups(){
  const [selectedTopup, setSelectedTopup] = useState(null);

  const { allTopups, topups, filters, setFilters, loading, error } = useAdminTopups();
  const activeFilter = filters.status ? filters.status : 'all';

  const filterTabs = [
    { value: 'all', label: 'Todas', count: allTopups.length },
    { value: 'pending', label: 'Pendientes', count: allTopups.filter(t => t.status === 'pending').length },
    { value: 'approved', label: 'Aprobadas', count: allTopups.filter(t => t.status === 'approved').length },
    { value: 'rejected', label: 'Rechazadas', count: allTopups.filter(t => t.status === 'rejected').length },
  ];

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { variant: 'pending', label: 'Pendiente' },
      approved: { variant: 'success', label: 'Aprobada' },
      rejected: { variant: 'rejected', label: 'Rechazada' },
    };
    const config = statusMap[status] || statusMap.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const filteredTopups = filter === 'all' 
    ? topups
    : topups;

  return (
    <div className="admin-topups">
      <div className="topups-header">
        <div>
          <h1 className="page-title">Gestión de Recargas</h1>
          <p className="page-subtitle">Administra y revisa todas las solicitudes de recarga</p>
        </div>
      </div>

      <div className="topups-filters">
        {filterTabs.map(f => (
          <button
            key={f.value}
            className={`filter-btn ${activeFilter === f.value ? 'active' : ''}`}
            onClick={() => setFilters.status(f.value === 'all' ? '' : f.value)}
          >
            {f.label}
            <span className="filter-count">{f.count}</span>
          </button>
        ))}
      </div>

      <Card className="topups-table-card">
        {loading ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <div className="empty-state-title">Cargando recargas…</div>
            <div className="empty-state-text">Obteniendo datos de Firestore</div>
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <div className="empty-state-title">Error al cargar</div>
            <div className="empty-state-text">{error}</div>
          </div>
        ) : filteredTopups.length > 0 ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Método</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredTopups.map(topup => (
                  <tr key={topup.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">{(topup.user?.displayName || topup.user?.email || 'U')[0]}</div>
                        <div>
                          <div className="user-name">{topup.user?.displayName || 'Sin nombre'}</div>
                          <div className="user-email">{topup.user?.email || 'Email no disponible'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="method-cell">
                        <span className="method-icon">{topup.method?.icon || '💳'}</span>
                        {topup.method?.name || 'Método no disponible'}
                      </div>
                    </td>
                    <td className="amount-cell">{formatCurrency(topup.amount)}</td>
                    <td>{getStatusBadge(topup.status)}</td>
                    <td className="date-cell">{formatDate(topup.createdAt || new Date())}</td>
                    <td>
                      <button 
                        className="btn-ghost btn-sm"
                        onClick={() => setSelectedTopup(topup)}
                      >
                        Ver detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <div className="empty-state-title">No hay recargas</div>
            <div className="empty-state-text">
              No se encontraron recargas con el filtro seleccionado
            </div>
          </div>
        )}
      </Card>

      {selectedTopup && (
        <Modal open={!!selectedTopup} onClose={() => setSelectedTopup(null)}>
          <div className="modal-header">
            <h2 className="modal-title">Detalles de Recarga</h2>
            <button className="modal-close" onClick={() => setSelectedTopup(null)}>×</button>
          </div>
          <div className="modal-body">
            <div className="detail-row">
              <span className="detail-label">ID de transacción</span>
              <span className="detail-value">{selectedTopup.id}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Usuario</span>
              <span className="detail-value">{selectedTopup.user?.displayName || 'Sin nombre'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email</span>
              <span className="detail-value">{selectedTopup.user?.email || 'Email no disponible'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Monto</span>
              <span className="detail-value">{formatCurrency(selectedTopup.amount)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Método</span>
              <span className="detail-value">{selectedTopup.method?.name || 'Método no disponible'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Estado</span>
              <span className="detail-value">{getStatusBadge(selectedTopup.status)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Fecha</span>
              <span className="detail-value">{formatDate(selectedTopup.createdAt || new Date())}</span>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setSelectedTopup(null)}>
              Cerrar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
