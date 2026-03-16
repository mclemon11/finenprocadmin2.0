import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../../context/LanguageContext';

export default function ChatTab({ messages, loading, onSend, currentUser }) {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(
      currentUser.uid,
      currentUser.displayName || currentUser.fullName || currentUser.email || 'Admin',
      text,
      currentUser.photoURL || currentUser.photoUrl || ''
    );
    setText('');
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString();
  };

  // Group messages by date
  const grouped = [];
  let lastDate = '';
  messages.forEach((msg) => {
    const d = formatDate(msg.createdAt);
    if (d !== lastDate) {
      grouped.push({ type: 'date', date: d });
      lastDate = d;
    }
    grouped.push({ type: 'msg', ...msg });
  });

  return (
    <div className="chat-tab">
      <div className="chat-messages">
        {loading ? (
          <div className="chat-loading">{t('projectDetail.loadingChat')}</div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <p>{t('projectDetail.noMessages')}</p>
          </div>
        ) : (
          grouped.map((item, i) =>
            item.type === 'date' ? (
              <div key={`date-${i}`} className="chat-date-divider">
                <span>{item.date}</span>
              </div>
            ) : (
              <div
                key={item.id || i}
                className={`chat-message ${item.senderId === currentUser?.uid ? 'own' : ''}`}
              >
                <div className="chat-msg-header">
                  {item.senderPhoto ? (
                    <img src={item.senderPhoto} alt="" className="chat-avatar-img" />
                  ) : (
                    <div className="chat-avatar">{(item.senderName || '?')[0].toUpperCase()}</div>
                  )}
                  <span className="chat-sender">{item.senderName}</span>
                  <span className="chat-time">{formatTime(item.createdAt)}</span>
                </div>
                <div className="chat-bubble">{item.text}</div>
              </div>
            )
          )
        )}
        <div ref={endRef} />
      </div>

      <form className="chat-input-bar" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('projectDetail.typeMessage')}
        />
        <button type="submit" className="chat-send-btn" disabled={!text.trim()}>
          {t('projectDetail.send')}
        </button>
      </form>
    </div>
  );
}
