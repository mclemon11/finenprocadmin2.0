import React from 'react';
import './UsuariosTable.css';

export default function UsuariosTable({ users, loading, onSelectUser }) {
  if (loading) {
    return (
      <div className="usuarios-table-loading">
        <div>Cargando usuarios...</div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="usuarios-table-empty">
        <div>No hay usuarios encontrados</div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-MX');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  return (
    <div className="usuarios-table-wrapper">
      <table className="usuarios-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Nombre</th>
            <th>Estado</th>
            <th>Rol</th>
            <th>Fecha Registro</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.uid} className="usuario-row">
              <td className="email-cell">{user.email}</td>
              <td>{user.displayName || '-'}</td>
              <td>
                <span className={`status-badge status-${user.status}`}>
                  {user.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td>{user.role || 'investor'}</td>
              <td>{formatDate(user.createdAt)}</td>
              <td>
                <button
                  className="btn-view-detail"
                  onClick={() => onSelectUser(user.uid)}
                >
                  Ver detalle
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
