import React, { useState, useRef, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/firebaseConfig';
import { useLanguage } from '../context/LanguageContext';
import './AdminHeader.css';

export default function AdminHeader({ admin, onToggleSidebar }) {
  const navigate = useNavigate();
  const { t, currentLanguage, changeLanguage, availableLanguages } = useLanguage();
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const languageDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setLanguageDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setLanguageDropdownOpen(false);
  };

  return (
    <header className="admin-header">
      <div className="header-left">
        <button
          className="menu-button"
          type="button"
          aria-label={t('common.menu') || 'Menu'}
          onClick={onToggleSidebar}
        >
          ☰
        </button>
        <h1>
          <span className="header-title-main">FINENPROC</span>
          <span className="header-title-badge">ADMIN</span>
        </h1>
      </div>
      <div className="header-right">
        <div className="language-dropdown-container" ref={languageDropdownRef}>
          <button 
            className="btn-ghost language-btn" 
            onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
            title={t('header.language')}
          >
            🌐 {availableLanguages.find(l => l.code === currentLanguage)?.name || 'Español'}
          </button>
          {languageDropdownOpen && (
            <div className="language-dropdown">
              <div className="language-dropdown-header">{t('language.select')}</div>
              {availableLanguages.map((lang) => (
                <button
                  key={lang.code}
                  className={`language-option ${currentLanguage === lang.code ? 'active' : ''}`}
                  onClick={() => handleLanguageChange(lang.code)}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          )}
        </div>
        {admin?.email && (
          <div className="admin-email">{admin.email}</div>
        )}
        <button className="btn-ghost" onClick={handleLogout}>
          {t('nav.logout')}
        </button>
      </div>
    </header>
  );
}
