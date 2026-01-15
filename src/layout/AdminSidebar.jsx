import React from 'react';
import { NavLink } from 'react-router-dom';
import './AdminSidebar.css';

export default function AdminSidebar({ isOpen, onClose }) {
  const Link = ({ to, children, disabled, icon }) => {
    const handleClick = () => {
      if (onClose) onClose();
    };

    return disabled ? (
      <div className="sidebar-item disabled">
        {icon && <span className="sidebar-icon">{icon}</span>}
        {children}
      </div>
    ) : (
      <NavLink 
        to={to} 
        onClick={handleClick}
        className={({isActive}) => isActive ? 'sidebar-item active' : 'sidebar-item'}
      >
        {icon && <span className="sidebar-icon">{icon}</span>}
        {children}
      </NavLink>
    );
  };

  return (
    <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
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
