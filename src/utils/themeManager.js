// src/utils/themeManager.js
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

  /**
   * Initialize the theme system and set the default theme
   * @param {Object} svarogUI - The Svarog UI library
   * @param {string} themeName - Name of the theme to use
   * @returns {boolean} - Success status
   */
  static initializeTheme(svarogUI, themeName = ThemeManager.THEMES.MUCHANDY) {
    try {
      if (!svarogUI || typeof svarogUI.switchTheme !== 'function') {
        console.error('Svarog UI theme system not available');
        return false;
      }

      // Apply theme
      console.log(`Initializing Svarog UI with theme: ${themeName}`);
      svarogUI.switchTheme(themeName);

      // Add theme class to document for CSS
      document.documentElement.classList.add(`${themeName}-theme`);

      return true;
    } catch (error) {
      console.error('Error initializing theme:', error);

      // Fallback to CSS-only theming
      document.documentElement.classList.add(`${themeName}-theme`);

      return false;
    }
  }
}
