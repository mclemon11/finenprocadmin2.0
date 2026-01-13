import React from 'react';
import Card from '../../components/Card';
import './AdminDashboard.css';

export default function AdminDashboard(){
  const stats = [
    { 
      id: 'pending_topups', 
      label: 'Recargas pendientes', 
      value: '12',
      icon: '⏳',
      change: '+3 desde ayer',
      changeType: 'positive'
    },
    { 
      id: 'approved_topups', 
      label: 'Recargas aprobadas', 
      value: '145',
      icon: '✓',
      change: '+15 esta semana',
      changeType: 'positive'
    },
    { 
      id: 'rejected_topups', 
      label: 'Recargas rechazadas', 
      value: '8',
      icon: '✕',
      change: '-2 desde ayer',
      changeType: 'negative'
    },
    { 
      id: 'total_users', 
      label: 'Usuarios totales', 
      value: '1,243',
      icon: '👥',
      change: '+25 este mes',
      changeType: 'positive'
    },
  ];

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">¡Bienvenido, Admin!</h1>
          <p className="dashboard-subtitle">Aquí está el resumen de la plataforma</p>
        </div>
        <div className="dashboard-meta">
          <span className="last-updated">Última actualización: Hoy, {new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}</span>
        </div>
      </div>

      <div className="grid grid-4">
        {stats.map(s=> (
          <Card key={s.id} className="stat-card">
            <div className="stat-icon" style={{
              background: s.changeType === 'positive' ? 'var(--success-bg)' : 'var(--danger-bg)'
            }}>
              {s.icon}
            </div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            {s.change && (
              <div className={`stat-change ${s.changeType}`}>
                {s.changeType === 'positive' ? '↑' : '↓'} {s.change}
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="dashboard-section">
        <h3 className="section-title">Actividad reciente</h3>
        <Card>
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">Sin actividad reciente</div>
            <div className="empty-state-text">Las transacciones recientes aparecerán aquí</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
