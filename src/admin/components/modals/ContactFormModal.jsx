import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import './ContactFormModal.css';

export default function ContactFormModal({
  isOpen,
  onClose,
  onSubmit,
  contact,
  users = [],
  tags = [],
  onCreateTag,
}) {
  const { t } = useLanguage();
  const isEditing = !!contact;

  const [form, setForm] = useState({
    userId: '',
    displayName: '',
    email: '',
    phone: '',
    location: '',
    expertise: '',
    tags: [],
    notes: '',
    photoUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  // Reset form on open / edit
  useEffect(() => {
    if (!isOpen) return;
    if (contact) {
      setForm({
        userId: contact.userId || '',
        displayName: contact.displayName || '',
        email: contact.email || '',
        phone: contact.phone || '',
        location: contact.location || '',
        expertise: contact.expertise || '',
        tags: Array.isArray(contact.tags) ? [...contact.tags] : [],
        notes: contact.notes || '',
        photoUrl: contact.photoUrl || '',
      });
      setUserSearch(contact.displayName || contact.email || '');
    } else {
      setForm({ userId: '', displayName: '', email: '', phone: '', location: '', expertise: '', tags: [], notes: '', photoUrl: '' });
      setUserSearch('');
    }
    setError(null);
  }, [isOpen, contact]);

  // Helper to get display name / photo from user
  const getUserName = (u) => u.displayName || u.fullName || '';
  const getUserPhoto = (u) => u.photoURL || u.photoUrl || '';

  // Filter users for selector
  const filteredUsers = useMemo(() => {
    if (!userSearch) return users.slice(0, 10);
    const s = userSearch.toLowerCase();
    return users
      .filter((u) =>
        (u.email || '').toLowerCase().includes(s) ||
        getUserName(u).toLowerCase().includes(s)
      )
      .slice(0, 10);
  }, [users, userSearch]);

  const selectUser = (user) => {
    const name = getUserName(user) || user.email || '';
    setForm((prev) => ({
      ...prev,
      userId: user.uid,
      displayName: name,
      email: user.email || '',
      phone: user.phone || '',
      location: user.country || user.location || '',
      photoUrl: getUserPhoto(user),
    }));
    setUserSearch(name);
    setShowUserDropdown(false);
  };

  const toggleTag = (tagName) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagName)
        ? prev.tags.filter((t) => t !== tagName)
        : [...prev.tags, tagName],
    }));
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const res = await onCreateTag?.(newTagName.trim(), color);
    if (res?.success && res?.data) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, newTagName.trim()] }));
    }
    setNewTagName('');
    setShowNewTag(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.userId && !isEditing) {
      setError(t('contacts.errors.userRequired'));
      return;
    }
    if (!form.displayName) {
      setError(t('contacts.errors.nameRequired'));
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const result = await onSubmit(form);
      if (result?.success) {
        onClose();
      } else if (result?.error === 'ALREADY_EXISTS') {
        setError(t('contacts.errors.alreadyExists'));
      } else {
        setError(result?.error || t('common.error'));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="contact-modal-overlay" onClick={onClose}>
      <div className="contact-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? t('contacts.editContact') : t('contacts.createContact')}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* User selector (only on create) */}
            {!isEditing && (
              <div className="form-section">
                <div className="form-section-header">
                  <h3> {t('contacts.selectUser')}</h3>
                  <p>{t('contacts.selectUserDesc')}</p>
                </div>
                <div className="form-row user-selector-row">
                  <label>
                    {t('contacts.user')} *
                    <div className="user-search-wrapper">
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => {
                          setUserSearch(e.target.value);
                          setShowUserDropdown(true);
                        }}
                        onFocus={() => setShowUserDropdown(true)}
                        placeholder={t('contacts.searchUserPlaceholder')}
                      />
                      {showUserDropdown && filteredUsers.length > 0 && (
                        <div className="user-dropdown">
                          {filteredUsers.map((u) => (
                            <div
                              key={u.uid}
                              className={`user-option ${form.userId === u.uid ? 'selected' : ''}`}
                              onClick={() => selectUser(u)}
                            >
                              <div className="user-option-avatar">
                                {getUserPhoto(u)
                                  ? <img src={getUserPhoto(u)} alt="" className="user-option-photo" />
                                  : (getUserName(u) || u.email || '?')[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="user-option-name">{getUserName(u) || 'Sin nombre'}</div>
                                <div className="user-option-email">{u.email}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Contact info */}
            <div className="form-section">
              <div className="form-section-header">
                <h3>📋 {t('contacts.contactInfo')}</h3>
              </div>

              <div className="form-row form-row-2">
                <label>
                  {t('contacts.name')} *
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    placeholder={t('contacts.namePlaceholder')}
                  />
                </label>
                <label>
                  {t('contacts.email')}
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@ejemplo.com"
                  />
                </label>
              </div>

              <div className="form-row form-row-2">
                <label>
                  {t('contacts.phone')}
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </label>
                <label>
                  📍 {t('contacts.location')}
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder={t('contacts.locationPlaceholder')}
                  />
                </label>
              </div>

              <div className="form-row">
                <label>
                  🎯 {t('contacts.expertise')}
                  <input
                    type="text"
                    value={form.expertise}
                    onChange={(e) => setForm({ ...form, expertise: e.target.value })}
                    placeholder={t('contacts.expertisePlaceholder')}
                  />
                </label>
              </div>

              <div className="form-row">
                <label>
                  📝 {t('contacts.notes')}
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder={t('contacts.notesPlaceholder')}
                    rows={3}
                  />
                </label>
              </div>
            </div>

            {/* Tags */}
            <div className="form-section">
              <div className="form-section-header">
                <h3>🏷️ {t('contacts.tags')}</h3>
                <p>{t('contacts.tagsDesc')}</p>
              </div>
              <div className="tags-selector">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    className={`tag-option ${form.tags.includes(tag.name) ? 'selected' : ''}`}
                    style={form.tags.includes(tag.name) ? { backgroundColor: tag.color + '33', color: tag.color, borderColor: tag.color } : {}}
                    onClick={() => toggleTag(tag.name)}
                  >
                    {tag.name}
                  </button>
                ))}
                {!showNewTag ? (
                  <button type="button" className="tag-option add-new" onClick={() => setShowNewTag(true)}>
                    + {t('contacts.newTag')}
                  </button>
                ) : (
                  <div className="inline-tag-create">
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder={t('contacts.tagNamePlaceholder')}
                      autoFocus
                    />
                    <button type="button" className="mini-confirm" onClick={handleCreateTag}>✓</button>
                    <button type="button" className="mini-cancel" onClick={() => { setShowNewTag(false); setNewTagName(''); }}>✕</button>
                  </div>
                )}
              </div>
            </div>

            {error && <div className="form-error">{error}</div>}
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={saving}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="submit-btn" disabled={saving}>
              {saving ? t('common.processing') : isEditing ? t('common.save') : t('contacts.createContact')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
