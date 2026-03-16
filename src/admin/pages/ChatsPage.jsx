import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { usePrivateChats, usePrivateChatMessages } from '../hooks/useChat';
import { getOrCreatePrivateChat } from '../services/chat.service';
import { useLanguage } from '../../context/LanguageContext';
import ChatTab from '../components/project/ChatTab';
import './ChatsPage.css';

export default function ChatsPage({ adminData }) {
  const { t } = useLanguage();
  const { chats, loading } = usePrivateChats();
  const [selectedChatId, setSelectedChatId] = useState(null);
  const { messages, loading: msgsLoading, send } = usePrivateChatMessages(selectedChatId);
  const [allUsers, setAllUsers] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchUser, setSearchUser] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, 'users'));
      setAllUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    fetchUsers();
  }, []);

  const getUserName = (u) => u.displayName || u.fullName || u.email || '';
  const getUserPhoto = (u) => u.photoURL || u.photoUrl || '';

  const getOtherParticipant = (chat) => {
    if (!chat.participants) return { name: '?', photo: '' };
    const otherId = chat.participants.find((p) => p !== adminData?.uid) || chat.participants[0];
    const name = chat.participantNames?.[otherId] || otherId;
    const photo = chat.participantPhotos?.[otherId] || '';
    return { name, photo, id: otherId };
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = now - date;
    if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 172800000) return t('chats.yesterday');
    return date.toLocaleDateString();
  };

  const handleStartChat = async (user) => {
    const chat = await getOrCreatePrivateChat(
      adminData.uid,
      user.id,
      adminData.displayName || adminData.fullName || adminData.email || 'Admin',
      getUserName(user),
      adminData.photoURL || adminData.photoUrl || '',
      getUserPhoto(user)
    );
    setSelectedChatId(chat.id);
    setShowNewChat(false);
    setSearchUser('');
  };

  const filteredUsers = allUsers.filter(
    (u) => u.id !== adminData?.uid && getUserName(u).toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="chats-page">
      <div className="chats-layout">
        {/* Sidebar - Chat List */}
        <div className="chats-sidebar">
          <div className="chats-sidebar-header">
            <h2>{t('chats.title')}</h2>
            <button className="new-chat-btn" onClick={() => setShowNewChat(!showNewChat)}>
              + {t('chats.newChat')}
            </button>
          </div>

          {showNewChat && (
            <div className="new-chat-panel">
              <input
                type="text"
                className="search-input"
                placeholder={t('chats.searchUser')}
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
              />
              <div className="new-chat-users">
                {filteredUsers.slice(0, 8).map((u) => (
                  <div key={u.id} className="new-chat-user" onClick={() => handleStartChat(u)}>
                    {getUserPhoto(u) ? (
                      <img src={getUserPhoto(u)} alt="" className="chat-list-avatar-img" />
                    ) : (
                      <div className="chat-list-avatar">{getUserName(u)[0]?.toUpperCase() || '?'}</div>
                    )}
                    <div className="chat-list-info">
                      <div className="chat-list-name">{getUserName(u)}</div>
                      <div className="chat-list-email">{u.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="chats-list">
            {loading ? (
              <div className="chats-loading">{t('common.loading')}</div>
            ) : chats.length === 0 ? (
              <div className="chats-empty">{t('chats.noChats')}</div>
            ) : (
              chats.map((chat) => {
                const other = getOtherParticipant(chat);
                return (
                  <div
                    key={chat.id}
                    className={`chat-list-item ${selectedChatId === chat.id ? 'active' : ''}`}
                    onClick={() => setSelectedChatId(chat.id)}
                  >
                    {other.photo ? (
                      <img src={other.photo} alt="" className="chat-list-avatar-img" />
                    ) : (
                      <div className="chat-list-avatar">{other.name[0]?.toUpperCase() || '?'}</div>
                    )}
                    <div className="chat-list-content">
                      <div className="chat-list-top">
                        <span className="chat-list-name">{other.name}</span>
                        <span className="chat-list-time">{formatTime(chat.lastMessageAt)}</span>
                      </div>
                      <div className="chat-list-preview">
                        {chat.lastMessage ? (
                          chat.lastMessage.length > 40
                            ? chat.lastMessage.substring(0, 40) + '...'
                            : chat.lastMessage
                        ) : (
                          <span className="no-messages">{t('chats.noMessages')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Main - Chat Messages */}
        <div className="chats-main">
          {selectedChatId ? (
            <ChatTab
              messages={messages}
              loading={msgsLoading}
              onSend={send}
              currentUser={adminData}
            />
          ) : (
            <div className="chats-placeholder">
              <div className="chats-placeholder-icon">💬</div>
              <h3>{t('chats.selectChat')}</h3>
              <p>{t('chats.selectChatDesc')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
