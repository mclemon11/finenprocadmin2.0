import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import './UsuariosTable.css';

export default function UsuariosTable({ users, loading, onSelectUser }) {
  const { t, currentLanguage } = useLanguage();
  const locale = currentLanguage === 'es' ? 'es-ES' : currentLanguage === 'de' ? 'de-DE' : currentLanguage === 'zh' ? 'zh-CN' : currentLanguage === 'it' ? 'it-IT' : 'en-US';

  const formatCurrency = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v || 0);

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
      {/* Desktop Table */}
      <div className="usuarios-table-desktop">
        <table className="usuarios-table">
          <thead>
            <tr>
              <th>{t('users.user')}</th>
              <th>{t('users.status')}</th>
              <th>{t('users.walletBalance')}</th>
              <th>{t('users.totalInvested')}</th>
              <th>{t('users.totalEarned')}</th>
              <th>{t('users.activeInv')}</th>
              <th>{t('users.registrationDate')}</th>
              <th>{t('users.action')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.uid} className="usuario-row">
                <td className="user-cell">
                  <div className="user-info">
                    {user.photoURL || user.photoUrl ? (
                      <img 
                        src={user.photoURL || user.photoUrl} 
                        alt={user.displayName || user.email}
                        className="user-avatar"
                      />
                    ) : (
                      <div className="user-avatar-placeholder">
                        {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="user-details">
                      <span className="user-name">{user.displayName || '-'}</span>
                      <span className="user-email">{user.email}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`status-badge status-${user.status}`}>
                    {user.status === 'active' ? t('status.active') : t('status.inactive')}
                  </span>
                </td>
                <td className="amount-cell">{formatCurrency(user.walletBalance)}</td>
                <td className="amount-cell">{formatCurrency(user.totalInvested)}</td>
                <td className="amount-cell earned-cell">{formatCurrency(user.totalEarned)}</td>
                <td className="center-cell">{user.activeInvestments || 0}</td>
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

      {/* Mobile Cards */}
      <div className="usuarios-cards-mobile">
        {users.map(user => (
          <div key={user.uid} className="usuario-card">
            <div className="usuario-card-header">
              <div className="usuario-card-user">
                {user.photoURL || user.photoUrl ? (
                  <img 
                    src={user.photoURL || user.photoUrl} 
                    alt={user.displayName || user.email}
                    className="user-avatar-mobile"
                  />
                ) : (
                  <div className="user-avatar-placeholder-mobile">
                    {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="usuario-card-email">{user.email}</span>
              </div>
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
                <span className="usuario-card-label">{t('users.walletBalance')}</span>
                <span className="usuario-card-value">{formatCurrency(user.walletBalance)}</span>
              </div>
              <div className="usuario-card-row">
                <span className="usuario-card-label">{t('users.totalInvested')}</span>
                <span className="usuario-card-value">{formatCurrency(user.totalInvested)}</span>
              </div>
              <div className="usuario-card-row">
                <span className="usuario-card-label">{t('users.totalEarned')}</span>
                <span className="usuario-card-value accent">{formatCurrency(user.totalEarned)}</span>
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
