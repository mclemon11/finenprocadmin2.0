import React, { useState, useMemo, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import useAdminContacts from '../hooks/useAdminContacts';
import ContactFormModal from '../components/modals/ContactFormModal';
import ContactDetailDrawer from '../components/drawers/ContactDetailDrawer';
import { useLanguage } from '../../context/LanguageContext';
import Swal from 'sweetalert2';
import './ContactosPage.css';

export default function ContactosPage({ adminData }) {
  const { contacts, tags, loading, addContact, editContact, removeContact, addTag, removeTag, refetch } = useAdminContacts();
  const { t } = useLanguage();

  // Fetch ALL users (no orderBy/where constraints — includes admins & investors)
  const [users, setUsers] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
      } catch (err) {
        console.error('Error fetching users for contacts:', err);
      }
    })();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({ search: '', tag: 'all' });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // KPIs
  const kpis = useMemo(() => ({
    total: contacts.length,
    withExpertise: contacts.filter(c => c.expertise).length,
    totalTags: tags.length,
    withLocation: contacts.filter(c => c.location).length,
  }), [contacts, tags]);

  // Filter contacts
  const filteredContacts = useMemo(() => {
    let list = contacts;
    if (filters.search) {
      const s = filters.search.toLowerCase();
      list = list.filter(c =>
        (c.displayName || '').toLowerCase().includes(s) ||
        (c.email || '').toLowerCase().includes(s) ||
        (c.expertise || '').toLowerCase().includes(s) ||
        (c.location || '').toLowerCase().includes(s)
      );
    }
    if (filters.tag !== 'all') {
      list = list.filter(c => Array.isArray(c.tags) && c.tags.includes(filters.tag));
    }
    return list;
  }, [contacts, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / pageSize));
  const paginatedContacts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredContacts.slice(start, start + pageSize);
  }, [filteredContacts, currentPage]);

  useMemo(() => setCurrentPage(1), [filters.search, filters.tag]);

  const handleCreateContact = async (data) => {
    const result = await addContact(data);
    if (result.success) {
      Swal.fire({
        title: t('contacts.alerts.created'),
        icon: 'success',
        background: '#1a1f2e',
        color: '#fff',
        confirmButtonColor: '#10b981',
        timer: 2000,
        timerProgressBar: true,
      });
    } else if (result.error === 'ALREADY_EXISTS') {
      Swal.fire({
        title: t('contacts.alerts.alreadyExists'),
        text: t('contacts.alerts.alreadyExistsText'),
        icon: 'warning',
        background: '#1a1f2e',
        color: '#fff',
        confirmButtonColor: '#f59e0b',
      });
    } else {
      Swal.fire({
        title: t('common.error'),
        text: result.error,
        icon: 'error',
        background: '#1a1f2e',
        color: '#fff',
        confirmButtonColor: '#ef4444',
      });
    }
    return result;
  };

  const handleEditContact = async (contactId, data) => {
    const result = await editContact(contactId, data);
    if (result.success) {
      Swal.fire({
        title: t('contacts.alerts.updated'),
        icon: 'success',
        background: '#1a1f2e',
        color: '#fff',
        confirmButtonColor: '#10b981',
        timer: 2000,
        timerProgressBar: true,
      });
    }
    return result;
  };

  const handleDeleteContact = async (contact) => {
    const result = await Swal.fire({
      title: t('contacts.alerts.confirmDelete'),
      text: t('contacts.alerts.confirmDeleteText').replace('{name}', contact.displayName),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel'),
      background: '#1a1f2e',
      color: '#fff',
    });

    if (result.isConfirmed) {
      await removeContact(contact.id);
      Swal.fire({
        title: t('contacts.alerts.deleted'),
        icon: 'success',
        background: '#1a1f2e',
        color: '#fff',
        confirmButtonColor: '#10b981',
        timer: 1500,
        timerProgressBar: true,
      });
    }
  };

  const openEdit = (contact) => {
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  const openDetail = (contact) => {
    setSelectedContact(contact);
    setIsDrawerOpen(true);
  };

  const formatDate = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="contactos-page">
        <div className="loading-state">{t('contacts.loading')}</div>
      </div>
    );
  }

  return (
    <div className="contactos-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('contacts.title')}</h1>
          <p className="page-subtitle">{t('contacts.subtitle')}</p>
        </div>
        <button className="create-btn" onClick={() => { setEditingContact(null); setIsModalOpen(true); }}>
          + {t('contacts.createContact')}
        </button>
      </div>

      {/* KPIs */}
      <div className="kpis-section">
        <div className="kpi-card accent-blue">
          <div className="kpi-label">{t('contacts.totalContacts')}</div>
          <div className="kpi-value">{kpis.total}</div>
        </div>
        <div className="kpi-card accent-green">
          <div className="kpi-label">{t('contacts.withExpertise')}</div>
          <div className="kpi-value">{kpis.withExpertise}</div>
        </div>
        <div className="kpi-card accent-cyan">
          <div className="kpi-label">{t('contacts.totalTags')}</div>
          <div className="kpi-value">{kpis.totalTags}</div>
        </div>
        <div className="kpi-card accent-amber">
          <div className="kpi-label">{t('contacts.withLocation')}</div>
          <div className="kpi-value">{kpis.withLocation}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-toolbar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder={t('contacts.searchPlaceholder')}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <select
          className="filter-select"
          value={filters.tag}
          onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
        >
          <option value="all">{t('contacts.filterByTag')}: {t('common.all')}</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.name}>{tag.name}</option>
          ))}
        </select>
      </div>

      {/* Tags Section */}
      <div className="tags-section">
        <div className="tags-header">
          <h3>{t('contacts.tagsTitle')}</h3>
          <button
            className="add-tag-btn"
            onClick={async () => {
              const { value: tagName } = await Swal.fire({
                title: t('contacts.createTag'),
                input: 'text',
                inputPlaceholder: t('contacts.tagNamePlaceholder'),
                showCancelButton: true,
                confirmButtonColor: '#6366f1',
                cancelButtonColor: '#6b7280',
                background: '#1a1f2e',
                color: '#fff',
                inputValidator: (val) => !val?.trim() ? t('contacts.tagRequired') : null,
              });
              if (tagName) {
                const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                const res = await addTag(tagName.trim(), color);
                if (res.error === 'TAG_EXISTS') {
                  Swal.fire({ title: t('contacts.tagExists'), icon: 'warning', background: '#1a1f2e', color: '#fff', confirmButtonColor: '#f59e0b' });
                }
              }
            }}
          >
            + {t('contacts.addTag')}
          </button>
        </div>
        <div className="tags-list">
          {tags.map((tag) => (
            <span key={tag.id} className="tag-chip" style={{ backgroundColor: tag.color + '22', color: tag.color, borderColor: tag.color }}>
              {tag.name}
              <button
                className="tag-remove"
                onClick={async () => {
                  await removeTag(tag.id);
                }}
                title={t('common.delete')}
              >
                ×
              </button>
            </span>
          ))}
          {tags.length === 0 && <span className="no-tags">{t('contacts.noTags')}</span>}
        </div>
      </div>

      {/* Contacts Table */}
      <div className="contacts-table-wrapper">
        <table className="contacts-table">
          <thead>
            <tr>
              <th>{t('contacts.name')}</th>
              <th>{t('contacts.email')}</th>
              <th>{t('contacts.location')}</th>
              <th>{t('contacts.expertise')}</th>
              <th>{t('contacts.tags')}</th>
              <th>{t('contacts.created')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedContacts.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">{t('contacts.noContacts')}</td>
              </tr>
            ) : (
              paginatedContacts.map((contact) => (
                <tr key={contact.id} onClick={() => openDetail(contact)} className="clickable-row">
                  <td className="contact-name-cell">
                    <div className="contact-avatar">
                      {contact.photoUrl
                        ? <img src={contact.photoUrl} alt="" className="contact-avatar-img" />
                        : (contact.displayName || '?')[0].toUpperCase()}
                    </div>
                    <span>{contact.displayName || '—'}</span>
                  </td>
                  <td>{contact.email || '—'}</td>
                  <td>{contact.location || '—'}</td>
                  <td>{contact.expertise || '—'}</td>
                  <td>
                    <div className="cell-tags">
                      {(contact.tags || []).slice(0, 3).map((tagName, i) => {
                        const tagObj = tags.find(t => t.name === tagName);
                        return (
                          <span
                            key={i}
                            className="mini-tag"
                            style={tagObj ? { backgroundColor: tagObj.color + '22', color: tagObj.color } : {}}
                          >
                            {tagName}
                          </span>
                        );
                      })}
                      {(contact.tags || []).length > 3 && <span className="mini-tag more">+{contact.tags.length - 3}</span>}
                    </div>
                  </td>
                  <td>{formatDate(contact.createdAt)}</td>
                  <td>
                    <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                      <button className="action-btn-sm edit" onClick={() => openEdit(contact)} title={t('common.edit')}>✏️</button>
                      <button className="action-btn-sm delete" onClick={() => handleDeleteContact(contact)} title={t('common.delete')}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>{t('common.previous')}</button>
          <span>{t('common.page')} {currentPage} {t('common.of')} {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>{t('common.next')}</button>
        </div>
      )}

      {/* Modal */}
      <ContactFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingContact(null); }}
        onSubmit={editingContact ? (data) => handleEditContact(editingContact.id, data) : handleCreateContact}
        contact={editingContact}
        users={users}
        tags={tags}
        onCreateTag={addTag}
      />

      {/* Drawer */}
      <ContactDetailDrawer
        contact={selectedContact}
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setSelectedContact(null); }}
        tags={tags}
        onEdit={(c) => { setIsDrawerOpen(false); openEdit(c); }}
        onDelete={handleDeleteContact}
      />
    </div>
  );
}
