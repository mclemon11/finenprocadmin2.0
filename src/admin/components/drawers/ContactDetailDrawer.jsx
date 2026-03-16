import React from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../../context/LanguageContext';
import './ContactDetailDrawer.css';

export default function ContactDetailDrawer({
  contact,
  isOpen,
  onClose,
  tags = [],
  onEdit,
  onDelete,
}) {
  const { t } = useLanguage();

  if (!contact || !isOpen) return null;

  const formatDate = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const drawerContent = (
    <>
      <div className={`drawer-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
      <div className={`contact-drawer ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-header-top">
            <button className="close-drawer-btn" onClick={onClose}>
              ← {t('contacts.backToContacts')}
            </button>
            <div className="drawer-actions">
              <button className="action-btn secondary" onClick={() => onEdit?.(contact)}>
                ✏️ {t('common.edit')}
              </button>
              <button className="action-btn danger" onClick={() => onDelete?.(contact)}>
                🗑️ {t('common.delete')}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="drawer-content">
          {/* Profile Card */}
          <div className="contact-profile-card">
            <div className="profile-avatar">
              {contact.photoUrl
                ? <img src={contact.photoUrl} alt="" className="profile-avatar-img" />
                : (contact.displayName || '?')[0].toUpperCase()}
            </div>
            <h2 className="profile-name">{contact.displayName || '—'}</h2>
            <p className="profile-email">{contact.email || t('common.emailNotAvailable')}</p>
            {contact.phone && <p className="profile-phone">📞 {contact.phone}</p>}
          </div>

          {/* Info Cards */}
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">📍</div>
              <div className="info-label">{t('contacts.location')}</div>
              <div className="info-value">{contact.location || '—'}</div>
            </div>
            <div className="info-card">
              <div className="info-icon">🎯</div>
              <div className="info-label">{t('contacts.expertise')}</div>
              <div className="info-value">{contact.expertise || '—'}</div>
            </div>
          </div>

          {/* Tags */}
          <div className="detail-section">
            <h3>🏷️ {t('contacts.tags')}</h3>
            <div className="detail-tags">
              {(contact.tags || []).length === 0 ? (
                <span className="no-data-text">{t('contacts.noTagsAssigned')}</span>
              ) : (
                contact.tags.map((tagName, i) => {
                  const tagObj = tags.find((t) => t.name === tagName);
                  return (
                    <span
                      key={i}
                      className="detail-tag"
                      style={tagObj ? { backgroundColor: tagObj.color + '22', color: tagObj.color, borderColor: tagObj.color } : {}}
                    >
                      {tagName}
                    </span>
                  );
                })
              )}
            </div>
          </div>

          {/* Notes */}
          {contact.notes && (
            <div className="detail-section">
              <h3>📝 {t('contacts.notes')}</h3>
              <p className="notes-text">{contact.notes}</p>
            </div>
          )}

          {/* Meta */}
          <div className="detail-section meta-section">
            <div className="meta-row">
              <span className="meta-label">{t('contacts.userId')}</span>
              <span className="meta-value">{contact.userId || '—'}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">{t('common.created')}</span>
              <span className="meta-value">{formatDate(contact.createdAt)}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">{t('common.updated')}</span>
              <span className="meta-value">{formatDate(contact.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(drawerContent, document.body);
}
