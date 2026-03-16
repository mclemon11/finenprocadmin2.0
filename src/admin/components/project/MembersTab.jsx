import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import { useLanguage } from '../../../context/LanguageContext';

const ROLES = ['Investor', 'Legal', 'Manager', 'Advisor', 'Contact'];

export default function MembersTab({ projectId, members, onAddMember, onRemoveMember }) {
  const { t } = useLanguage();
  const [allUsers, setAllUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('Investor');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, 'users'));
      const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAllUsers(users);
    };
    fetchUsers();
  }, []);

  const getUserName = (u) => u.displayName || u.fullName || u.email || '';
  const getUserPhoto = (u) => u.photoURL || u.photoUrl || '';

  const memberIds = members.map((m) => m.userId);
  const availableUsers = allUsers.filter(
    (u) => !memberIds.includes(u.id) && getUserName(u).toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!selectedUserId) return;
    const user = allUsers.find((u) => u.id === selectedUserId);
    if (!user) return;
    await onAddMember({
      userId: user.id,
      displayName: getUserName(user),
      email: user.email || '',
      photoUrl: getUserPhoto(user),
      role: selectedRole,
    });
    setSelectedUserId('');
    setSelectedRole('Investor');
    setShowAddModal(false);
    setSearch('');
  };

  const handleRemove = async (member) => {
    if (window.confirm(t('projectDetail.confirmRemoveMember'))) {
      await onRemoveMember(member);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Investor': return 'role-investor';
      case 'Legal': return 'role-legal';
      case 'Manager': return 'role-manager';
      case 'Advisor': return 'role-advisor';
      case 'Contact': return 'role-contact';
      default: return '';
    }
  };

  return (
    <div className="members-tab">
      <div className="members-header">
        <h3>{t('projectDetail.membersTitle')} ({members.length})</h3>
        <button className="add-member-btn" onClick={() => setShowAddModal(true)}>
          + {t('projectDetail.addMember')}
        </button>
      </div>

      {members.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <p>{t('projectDetail.noMembers')}</p>
        </div>
      ) : (
        <div className="members-grid">
          {members.map((m) => (
            <div key={m.userId} className="member-card">
              <div className="member-info">
                {m.photoUrl ? (
                  <img src={m.photoUrl} alt="" className="member-avatar-img" />
                ) : (
                  <div className="member-avatar">{(m.displayName || '?')[0].toUpperCase()}</div>
                )}
                <div className="member-details">
                  <div className="member-name">{m.displayName || m.email}</div>
                  <div className="member-email">{m.email}</div>
                </div>
              </div>
              <div className="member-actions">
                <span className={`role-badge ${getRoleBadgeClass(m.role)}`}>{m.role}</span>
                <button className="remove-member-btn" onClick={() => handleRemove(m)} title={t('common.delete')}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content add-member-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('projectDetail.addMember')}</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>{t('projectDetail.selectUser')}</label>
                <input
                  type="text"
                  className="search-input"
                  placeholder={t('projectDetail.searchUsers')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="user-select-list">
                  {availableUsers.slice(0, 10).map((u) => (
                    <div
                      key={u.id}
                      className={`user-select-item ${selectedUserId === u.id ? 'selected' : ''}`}
                      onClick={() => setSelectedUserId(u.id)}
                    >
                      {getUserPhoto(u) ? (
                        <img src={getUserPhoto(u)} alt="" className="user-select-photo" />
                      ) : (
                        <div className="user-select-avatar">{getUserName(u)[0]?.toUpperCase() || '?'}</div>
                      )}
                      <div className="user-select-info">
                        <div className="user-select-name">{getUserName(u)}</div>
                        <div className="user-select-email">{u.email}</div>
                      </div>
                    </div>
                  ))}
                  {availableUsers.length === 0 && (
                    <div className="user-select-empty">{t('projectDetail.noUsersFound')}</div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>{t('projectDetail.memberRole')}</label>
                <select
                  className="role-select"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowAddModal(false)}>{t('common.cancel')}</button>
              <button className="confirm-btn" onClick={handleAdd} disabled={!selectedUserId}>
                {t('projectDetail.addMember')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
