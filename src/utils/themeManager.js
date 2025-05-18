// src/utils/themeManager.js
import StorageHelper from './storageHelper.js';

/**
 * Manages theme initialization and switching for Svarog UI
 */
export default class ThemeManager {
  /**
   * Available themes in Svarog UI
   */
  static THEMES = {
    DEFAULT: 'default',
    MUCHANDY: 'muchandy',
    CABALOU: 'cabalou',
  };

  static storage = new StorageHelper('local', 'svarog_');

  /**
   * Initialize the theme system and set the default theme
   * @param {Object} svarogUI - The Svarog UI library
   * @param {string} themeName - Name of the theme to use
   * @returns {boolean} - Success status
   */
  static initializeTheme(svarogUI, themeName = ThemeManager.THEMES.MUCHANDY) {
    try {
      // Try to get saved theme first
      const savedTheme = ThemeManager.storage.get('theme');
      const themeToUse = savedTheme || themeName;

      console.log(`Initializing theme, using ${themeToUse}`);

      // First try direct svarogUI parameter
      let themeApplied = false;

      if (svarogUI && typeof svarogUI.switchTheme === 'function') {
        svarogUI.switchTheme(themeToUse);
        themeApplied = true;
      }
      // Try global SvarogUI
      else if (
        typeof window !== 'undefined' &&
        window.SvarogUI &&
        typeof window.SvarogUI.switchTheme === 'function'
      ) {
        console.log(
          `Initializing from global SvarogUI with theme: ${themeName}`
        );
        window.SvarogUI.switchTheme(themeName);
        themeApplied = true;
      }
      // Try importing from 'svarog-ui'
      else {
        try {
          // Dynamic import would be best here, but if not available, use CSS class instead
          import('svarog-ui')
            .then((SvarogUI) => {
              if (SvarogUI && typeof SvarogUI.switchTheme === 'function') {
                console.log(
                  `Initializing imported SvarogUI with theme: ${themeName}`
                );
                SvarogUI.switchTheme(themeName);
                themeApplied = true;
              } else {
                this.applyFallbackTheming(themeName);
              }
            })
            .catch((err) => {
              console.warn('Error importing SvarogUI:', err);
              this.applyFallbackTheming(themeName);
            });
        } catch (importError) {
          console.warn('Dynamic import not supported, using CSS fallback');
          this.applyFallbackTheming(themeName);
        }
      }

      // If we couldn't apply the theme through the API, use CSS class fallback
      if (themeApplied) {
        ThemeManager.storage.set('theme', themeToUse);
        console.log(`Saved theme "${themeToUse}" to storage`);
      }

      return themeApplied;
    } catch (error) {
      console.error('Error initializing theme:', error);

      // Apply fallback theming
      this.applyFallbackTheming(themeName);
      return false;
    }
  }

  static switchTheme(svarogUI, themeName) {
    const success = ThemeManager.initializeTheme(svarogUI, themeName);
    if (success) {
      // Remove all theme classes first
      if (typeof document !== 'undefined') {
        Object.values(ThemeManager.THEMES).forEach((theme) => {
          document.documentElement.classList.remove(`${theme}-theme`);
        });
      }
      // Apply new theme
      ThemeManager.applyFallbackTheming(themeName);
    }
    return success;
  }

  // Add a new method for CSS fallback theming
  static applyFallbackTheming(themeName) {
    console.log(`Applying fallback CSS theming for: ${themeName}`);
    // Add theme class to HTML element
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add(`${themeName}-theme`);

      // Store theme preference in localStorage
      try {
        localStorage.setItem('svarog-theme', themeName);
      } catch (e) {
        console.warn('Could not save theme to localStorage');
      }
    }
  }
}
