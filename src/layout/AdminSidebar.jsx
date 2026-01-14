import React from 'react';
import { NavLink } from 'react-router-dom';
import './AdminSidebar.css';

export default function AdminSidebar() {
  const Link = ({ to, children, disabled, icon }) => (
    disabled ? (
      <div className="sidebar-item disabled">
        {icon && <span className="sidebar-icon">{icon}</span>}
        {children}
      </div>
    ) : (
      <NavLink 
        to={to} 
        className={({isActive}) => isActive ? 'sidebar-item active' : 'sidebar-item'}
      >
        {icon && <span className="sidebar-icon">{icon}</span>}
        {children}
      </NavLink>
    )
  );

  return (
    <aside className="admin-sidebar">
      <div className="brand">FINENPROC</div>
      <nav>
        <Link to="/admin" icon="📊">Panel</Link>
        <Link to="/admin/usuarios" icon="👥">Usuarios</Link>
        <div className="nav-section-title">Operaciones</div>
        <Link to="/admin/operaciones/recargas" icon="💰">Recargas</Link>
        <Link to="/admin/operaciones/retiros" icon="🏦">Retiros</Link>
        <Link to="/admin/operaciones/inversiones" icon="📈">Inversiones</Link>
        <div className="nav-section-title">Otros</div>
        <Link to="/admin/proyectos" icon="📁">Proyectos</Link>
        <Link disabled icon="⚙️">Configuración</Link>
      </nav>
      <div className="sidebar-footer">Admin Panel</div>
    </aside>
  );
}
