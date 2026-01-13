import React from 'react';
import { NavLink } from 'react-router-dom';

export default function AdminSidebar() {
  const Link = ({ to, children, disabled, icon }) => (
    disabled ? (
      <div className="sidebar-item disabled">
        {icon && <span style={{marginRight: '12px', fontSize: '18px'}}>{icon}</span>}
        {children}
      </div>
    ) : (
      <NavLink 
        to={to} 
        className={({isActive}) => isActive ? 'sidebar-item active' : 'sidebar-item'}
      >
        {icon && <span style={{marginRight: '12px', fontSize: '18px'}}>{icon}</span>}
        {children}
      </NavLink>
    )
  );

  return (
    <aside className="admin-sidebar">
      <div className="brand">FINENPROC</div>
      <nav>
        <Link to="/admin" icon="📊">Panel</Link>
        <Link to="/admin/topups" icon="💰">Recargas</Link>
        <Link disabled icon="📁">Proyectos</Link>
        <Link disabled icon="💼">Inversiones</Link>
        <Link disabled icon="👥">Usuarios</Link>
      </nav>
      <div className="sidebar-footer">Admin Panel</div>
    </aside>
  );
}
