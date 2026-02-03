import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import './UsuariosTable.css';

export default function UsuariosTable({ users, loading, onSelectUser }) {
  const { t, currentLanguage } = useLanguage();
  const locale = currentLanguage === 'es' ? 'es-ES' : currentLanguage === 'de' ? 'de-DE' : currentLanguage === 'zh' ? 'zh-CN' : currentLanguage === 'it' ? 'it-IT' : 'en-US';

  if (loading) {
    return (
      <div className="usuarios-loading">
        <div>{t('users.loadingUsers')}</div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="usuarios-empty">
        <div>{t('users.noUsersFound')}</div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(locale);
  };

  return (
    <div className="usuarios-list">
      {/* Vista Desktop - Tabla */}
      <div className="usuarios-table-desktop">
        <table className="usuarios-table">
          <thead>
            <tr>
              <th>{t('users.email')}</th>
              <th>{t('users.name')}</th>
              <th>{t('users.status')}</th>
              <th>{t('users.role')}</th>
              <th>{t('users.registrationDate')}</th>
              <th>{t('users.action')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.uid} className="usuario-row">
                <td className="email-cell">{user.email}</td>
                <td>{user.displayName || '-'}</td>
                <td>
                  <span className={`status-badge status-${user.status}`}>
                    {user.status === 'active' ? t('status.active') : t('status.inactive')}
                  </span>
                </td>
                <td>{user.role || t('users.investor')}</td>
                <td>{formatDate(user.createdAt)}</td>
                <td>
                  <button
                    className="btn-view-detail"
                    onClick={() => onSelectUser(user.uid)}
                  >
                    {t('users.viewDetail')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista Móvil - Cards */}
      <div className="usuarios-cards-mobile">
        {users.map(user => (
          <div key={user.uid} className="usuario-card">
            <div className="usuario-card-header">
              <span className="usuario-card-email">{user.email}</span>
              <span className={`status-badge status-${user.status}`}>
                {user.status === 'active' ? t('status.active') : t('status.inactive')}
              </span>
            </div>
            <div className="usuario-card-body">
              <div className="usuario-card-row">
                <span className="usuario-card-label">{t('users.name')}</span>
                <span className="usuario-card-value">{user.displayName || '-'}</span>
              </div>
              <div className="usuario-card-row">
                <span className="usuario-card-label">{t('users.role')}</span>
                <span className="usuario-card-value">{user.role || t('users.investor')}</span>
              </div>
              <div className="usuario-card-row">
                <span className="usuario-card-label">{t('users.registrationDate')}</span>
                <span className="usuario-card-value">{formatDate(user.createdAt)}</span>
              </div>
            </div>
            <div className="usuario-card-footer">
              <button
                className="btn-view-detail-card"
                onClick={() => onSelectUser(user.uid)}
              >
                {t('users.viewDetail')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
