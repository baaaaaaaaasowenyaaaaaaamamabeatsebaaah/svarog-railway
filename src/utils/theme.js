// src/utils/theme.js
/**
 * Theme Manager - Handles theme switching and management
 */
export default class ThemeManager {
  constructor() {
    this.currentTheme = null;
    this.themeChangeListeners = [];
    this.availableThemes = ['default-theme', 'cabalou-theme', 'muchandy-theme'];
  }

  /**
   * Initialize the theme manager
   * @param {string} initialTheme - The initial theme to use
   * @returns {ThemeManager} - The theme manager instance
   */
  init(initialTheme = 'default-theme') {
    this.switchTheme(initialTheme);
    return this;
  }

  /**
   * Switch to a different theme
   * @param {string} themeName - The theme name to switch to
   * @returns {boolean} - Success status
   */
  switchTheme(themeName) {
    if (!this.isValidTheme(themeName)) {
      console.warn(`Theme "${themeName}" not found, falling back to default`);
      themeName = 'default-theme';
    }

    if (this.currentTheme === themeName) {
      return true;
    }

    const html = document.documentElement;

    // Remove previous theme class
    if (this.currentTheme) {
      html.classList.remove(this.currentTheme);
    }

    // Add new theme class
    html.classList.add(themeName);

    const previousTheme = this.currentTheme;
    this.currentTheme = themeName;

    // Notify listeners
    this.themeChangeListeners.forEach((listener) => {
      try {
        listener(themeName, previousTheme);
      } catch (error) {
        console.error('Error in theme change listener:', error);
      }
    });

    // Dispatch event for other components
    window.dispatchEvent(
      new CustomEvent('themechange', {
        detail: {
          theme: themeName,
          previousTheme,
        },
      })
    );

    return true;
  }

  /**
   * Check if theme name is valid
   * @param {string} themeName - The theme name to check
   * @returns {boolean} - Is theme valid
   */
  isValidTheme(themeName) {
    return this.availableThemes.includes(themeName);
  }

  /**
   * Add a theme change listener
   * @param {Function} listener - The listener function
   * @returns {Function} - Remove listener function
   */
  onThemeChange(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Theme change listener must be a function');
    }

    this.themeChangeListeners.push(listener);

    return () => {
      const index = this.themeChangeListeners.indexOf(listener);
      if (index !== -1) {
        this.themeChangeListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get the current theme
   * @returns {string} - Current theme name
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Get available themes
   * @returns {Array} - List of available themes
   */
  getAvailableThemes() {
    return [...this.availableThemes];
  }

  /**
   * Add a new theme
   * @param {string} themeName - The theme name to add
   * @returns {boolean} - Success status
   */
  addTheme(themeName) {
    if (this.isValidTheme(themeName)) {
      return false;
    }

    this.availableThemes.push(themeName);
    return true;
  }
}

// Create singleton instance
const themeManager = new ThemeManager();
export { themeManager };
