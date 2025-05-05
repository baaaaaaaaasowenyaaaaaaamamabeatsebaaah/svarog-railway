// src/utils/i18n.js
/**
 * Simple i18n helper for translations
 */
export default class I18n {
  constructor() {
    this.translations = {};
    this.currentLanguage = 'en';
  }

  /**
   * Load translations
   * @param {string} language - Language code
   * @param {Object} translations - Translation key-value pairs
   */
  load(language, translations) {
    this.translations[language] = {
      ...(this.translations[language] || {}),
      ...translations,
    };
    return this;
  }

  /**
   * Set current language
   * @param {string} language - Language code
   */
  setLanguage(language) {
    if (this.translations[language]) {
      this.currentLanguage = language;
    }
    return this;
  }

  /**
   * Translate a key
   * @param {string} key - Translation key
   * @param {Object} params - Replacement parameters
   * @returns {string} - Translated text
   */
  t(key, params = {}) {
    const translations = this.translations[this.currentLanguage] || {};
    let text = translations[key] || key;

    // Handle parameter replacement
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(new RegExp(`{{${param}}}`, 'g'), value);
      });
    }

    return text;
  }
}

// Create singleton instance
const i18n = new I18n();
export { i18n };
