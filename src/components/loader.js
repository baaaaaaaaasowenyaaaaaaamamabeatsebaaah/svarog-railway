// src/components/loader.js
/**
 * Load and initialize Svarog UI components
 */
export default class ComponentLoader {
  constructor() {
    this.components = null;
    this.isLoaded = false;
    this.themeManager = null;
  }

  /**
   * Load all Svarog UI components
   * @returns {Promise<Object>} - Loaded components
   */
  async loadComponents() {
    try {
      if (this.isLoaded) {
        return this.components;
      }

      // Import Svarog UI
      const svarogUI = await import('svarog-ui');

      // Log available components
      console.log('Available in Svarog UI:', Object.keys(svarogUI));

      // Store components for reuse
      this.components = svarogUI;

      // Initialize theme management
      this.initThemeManager(svarogUI);

      this.isLoaded = true;
      return this.components;
    } catch (error) {
      console.error('Error loading Svarog UI components:', error);
      throw new Error(`Failed to load Svarog UI components: ${error.message}`);
    }
  }

  /**
   * Initialize the theme manager
   * @param {Object} svarogUI - Svarog UI library
   */
  initThemeManager(svarogUI) {
    // Try to find theme management functionality
    if (svarogUI.switchTheme) {
      this.themeManager = {
        switchTheme: svarogUI.switchTheme,
      };
    } else if (svarogUI.Theme && svarogUI.Theme.setTheme) {
      this.themeManager = {
        switchTheme: svarogUI.Theme.setTheme,
      };
    } else if (svarogUI.themeManager && svarogUI.themeManager.switchTheme) {
      this.themeManager = svarogUI.themeManager;
    } else {
      console.warn('No theme management found in Svarog UI');

      // Create a basic theme manager
      this.themeManager = {
        switchTheme: (themeName) => {
          // Remove existing theme classes
          document.documentElement.classList.remove(
            'default-theme',
            'cabalou-theme',
            'muchandy-theme'
          );

          // Add new theme class
          document.documentElement.classList.add(themeName);

          // Try to use localStorage for persistence
          try {
            localStorage.setItem('svarog-theme', themeName);
          } catch (e) {
            // Ignore errors with localStorage
          }

          console.log(`Applied theme: ${themeName}`);
        },
      };
    }
  }

  /**
   * Get the theme manager
   * @returns {Object|null} - Theme manager
   */
  getThemeManager() {
    return this.themeManager;
  }

  /**
   * Get loaded components
   * @returns {Object|null} - Loaded components
   */
  getComponents() {
    return this.components;
  }

  /**
   * Check if components are loaded
   * @returns {boolean} - Whether components are loaded
   */
  areComponentsLoaded() {
    return this.isLoaded;
  }
}
