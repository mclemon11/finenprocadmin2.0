import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './AdminSidebar.css';

export default function AdminSidebar({ isOpen, onClose }) {
  const { t } = useLanguage();

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
        <Link to="/admin" icon="">{t('nav.dashboard')}</Link>
        <Link to="/admin/usuarios" icon="">{t('nav.users')}</Link>
        <Link to="/admin/contactos" icon="">{t('nav.contacts')}</Link>
        <div className="nav-section-title">{t('nav.operations')}</div>
        <Link to="/admin/operaciones/recargas" icon="">{t('nav.topups')}</Link>
        <Link to="/admin/operaciones/retiros" icon="">{t('nav.withdrawals')}</Link>
        <Link to="/admin/operaciones/inversiones" icon="">{t('nav.investments')}</Link>
        <Link to="/admin/distribucion" icon="">{t('nav.returns')}</Link>
        <div className="nav-section-title">{t('nav.others')}</div>
        <Link to="/admin/proyectos" icon="">{t('nav.projects')}</Link>
        <Link to="/admin/chats" icon="">{t('nav.chats')}</Link>
        <Link to="/admin/asesores" icon="">{t('nav.advisors')}</Link>
        <Link to="/admin/auditoria" icon="">{t('nav.audit')}</Link>
        <Link to="/admin/configuracion" icon="">{t('nav.settings')}</Link>
      </nav>
      <div className="sidebar-footer">{t('nav.adminPanel')}</div>
    </aside>
  );
}
