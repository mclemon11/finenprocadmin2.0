/**
 * Translation helper for use outside React components (hooks, services, utils, etc.)
 * Reads the language from localStorage and returns the translated string.
 */

import es from '../assets/language/es.json';
import en from '../assets/language/en.json';
import de from '../assets/language/de.json';
import zh from '../assets/language/zh.json';
import it from '../assets/language/it.json';

const translations = { es, en, de, zh, it };
const STORAGE_KEY = 'finenproc_language';
const DEFAULT_LANGUAGE = 'es';

/**
 * Get the current language from localStorage
 * @returns {string} Language code (es, en, de, zh, it)
 */
export const getCurrentLanguage = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
};

/**
 * Get a translation by key path (e.g., 'errors.userNotAuthenticated')
 * @param {string} key - Dot-notation key path
 * @param {object} params - Optional parameters for string interpolation
 * @returns {string} Translated string or key if not found
 */
export const getTranslation = (key, params = {}) => {
  const lang = getCurrentLanguage();
  const langData = translations[lang] || translations[DEFAULT_LANGUAGE];
  
  // Navigate the key path
  const keys = key.split('.');
  let value = langData;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Key not found, return the key itself
      return key;
    }
  }
  
  if (typeof value !== 'string') {
    return key;
  }
  
  // Replace parameters like {amount} with actual values
  let result = value;
  for (const [param, val] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${param}\\}`, 'g'), String(val));
  }
  
  return result;
};

// Shorthand alias
export const t = getTranslation;
