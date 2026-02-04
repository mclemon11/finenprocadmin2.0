import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Import all language files
import en from '../assets/language/en.json';
import es from '../assets/language/es.json';
import de from '../assets/language/de.json';
import zh from '../assets/language/zh.json';
import it from '../assets/language/it.json';

const languages = { en, es, de, zh, it };

// const LANGUAGE_KEY = 'finenproc_admin_language';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    // Detectar idioma del navegador, sin persistencia
    if (typeof navigator !== 'undefined') {
      const supported = Object.keys(languages);
      const preferences = Array.isArray(navigator.languages) && navigator.languages.length
        ? navigator.languages
        : [navigator.language];
      for (const pref of preferences) {
        const normalized = String(pref).trim().toLowerCase().replace('_', '-');
        if (supported.includes(normalized)) return normalized;
        const base = normalized.split('-')[0];
        if (supported.includes(base)) return base;
        if (normalized.startsWith('zh') && supported.includes('zh')) return 'zh';
      }
    }
    return 'es';
  });

  const [translations, setTranslations] = useState(languages[currentLanguage] || languages.es);

  useEffect(() => {
    setTranslations(languages[currentLanguage] || languages.es);
  }, [currentLanguage]);

  const changeLanguage = useCallback((langCode) => {
    if (languages[langCode]) {
      setCurrentLanguage(langCode);
    }
  }, []);

  // Helper function to get nested translation
  const t = useCallback((key) => {
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  }, [translations]);

  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
    { code: 'zh', name: '中文' },
    { code: 'it', name: 'Italiano' }
  ];

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    translations,
    availableLanguages
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  return context;
};

export default LanguageContext;
