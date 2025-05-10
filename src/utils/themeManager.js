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
      // First try direct svarogUI parameter
      let themeApplied = false;

      if (svarogUI && typeof svarogUI.switchTheme === 'function') {
        console.log(`Initializing Svarog UI with theme: ${themeName}`);
        svarogUI.switchTheme(themeName);
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
      if (!themeApplied) {
        this.applyFallbackTheming(themeName);
      }

      return themeApplied;
    } catch (error) {
      console.error('Error initializing theme:', error);

      // Apply fallback theming
      this.applyFallbackTheming(themeName);
      return false;
    }
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
