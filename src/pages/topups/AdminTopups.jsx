import React, { useState } from 'react';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import './AdminTopups.css';

export default function AdminTopups(){
  const [filter, setFilter] = useState('all');
  const [selectedTopup, setSelectedTopup] = useState(null);
  
  // Mock data - will be replaced with real data from useAdminTopups hook
  const mockTopups = [
    {
      id: '1',
      user: { email: 'user@example.com', displayName: 'Juan Pérez' },
      amount: 500,
      status: 'pending',
      createdAt: new Date(),
      method: { name: 'Transferencia Bancaria', icon: '🏦' }
    },
    {
      id: '2',
      user: { email: 'maria@example.com', displayName: 'María García' },
      amount: 1000,
      status: 'approved',
      createdAt: new Date(Date.now() - 86400000),
      method: { name: 'OXXO', icon: '🏪' }
    },
    {
      id: '3',
      user: { email: 'carlos@example.com', displayName: 'Carlos López' },
      amount: 250,
      status: 'rejected',
      createdAt: new Date(Date.now() - 172800000),
      method: { name: 'SPEI', icon: '💳' }
    },
  ];

  const filters = [
    { value: 'all', label: 'Todas', count: mockTopups.length },
    { value: 'pending', label: 'Pendientes', count: 1 },
    { value: 'approved', label: 'Aprobadas', count: 1 },
    { value: 'rejected', label: 'Rechazadas', count: 1 },
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
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const filteredTopups = filter === 'all' 
    ? mockTopups 
    : mockTopups.filter(t => t.status === filter);

  return (
    <div className="admin-topups">
      <div className="topups-header">
        <div>
          <h1 className="page-title">Gestión de Recargas</h1>
          <p className="page-subtitle">Administra y revisa todas las solicitudes de recarga</p>
        </div>
      </div>

      <div className="topups-filters">
        {filters.map(f => (
          <button
            key={f.value}
            className={`filter-btn ${filter === f.value ? 'active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
            <span className="filter-count">{f.count}</span>
          </button>
        ))}
      </div>

      <Card className="topups-table-card">
        {filteredTopups.length > 0 ? (
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
                        <div className="user-avatar">{topup.user.displayName[0]}</div>
                        <div>
                          <div className="user-name">{topup.user.displayName}</div>
                          <div className="user-email">{topup.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="method-cell">
                        <span className="method-icon">{topup.method.icon}</span>
                        {topup.method.name}
                      </div>
                    </td>
                    <td className="amount-cell">{formatCurrency(topup.amount)}</td>
                    <td>{getStatusBadge(topup.status)}</td>
                    <td className="date-cell">{formatDate(topup.createdAt)}</td>
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
              <span className="detail-value">{selectedTopup.user.displayName}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email</span>
              <span className="detail-value">{selectedTopup.user.email}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Monto</span>
              <span className="detail-value">{formatCurrency(selectedTopup.amount)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Método</span>
              <span className="detail-value">{selectedTopup.method.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Estado</span>
              <span className="detail-value">{getStatusBadge(selectedTopup.status)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Fecha</span>
              <span className="detail-value">{formatDate(selectedTopup.createdAt)}</span>
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
