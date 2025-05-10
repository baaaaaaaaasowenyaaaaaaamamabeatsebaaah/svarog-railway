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

      // Analyze and initialize components
      const processedComponents = this.analyzeAndInitialize(svarogUI);

      // Store components for reuse
      this.components = processedComponents;

      // Initialize theme management
      this.initThemeManager(this.components);

      this.isLoaded = true;
      return this.components;
    } catch (error) {
      console.error('Error loading Svarog UI components:', error);
      throw new Error(`Failed to load Svarog UI components: ${error.message}`);
    }
  }

  /**
   * Analyze and initialize components
   * @param {Object} svarogUI - Loaded Svarog UI components
   * @returns {Object} - Analyzed components
   */
  analyzeAndInitialize(svarogUI) {
    // Import debug utility
    import('../utils/debug.js').then((debug) => {
      debug.analyzeComponents(svarogUI);
    });

    // Check if Grid.Column needs to be created
    if (
      svarogUI.Grid &&
      !svarogUI['Grid.Column'] &&
      typeof svarogUI.Grid === 'function'
    ) {
      // Check if Grid.Column exists as a static property
      if (svarogUI.Grid.Column) {
        console.log('Adding Grid.Column to components');
        svarogUI['Grid.Column'] = svarogUI.Grid.Column;
      } else {
        console.log('Creating fallback Grid.Column');
        svarogUI['Grid.Column'] = function Column(props) {
          const element = document.createElement('div');
          element.className = `grid-column span-${props.width || 12}`;
          element.style.gridColumn = `span ${props.width || 12}`;

          if (props.children) {
            if (typeof props.children === 'string') {
              element.textContent = props.children;
            } else if (props.children instanceof HTMLElement) {
              element.appendChild(props.children);
            } else if (Array.isArray(props.children)) {
              props.children.forEach((child) => {
                if (child instanceof HTMLElement) {
                  element.appendChild(child);
                }
              });
            }
          }

          return {
            getElement: () => element,
          };
        };
      }
    }

    // Don't create ContactInfo if it exists
    if (!svarogUI.ContactInfo) {
      console.log('Creating fallback ContactInfo component');
      svarogUI.ContactInfo = function ContactInfo(props) {
        const element = document.createElement('div');
        element.className = 'contact-info';
        element.style.padding = '20px';
        element.style.margin = '20px 0';
        element.style.background = '#f8f8f8';
        element.style.borderRadius = '4px';
        element.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

        element.innerHTML = `
        <h3 style="margin-top: 0; color: #fd7e14;">Contact Information</h3>
        <div style="margin-bottom: 10px;">
          <strong>Location:</strong> ${props.location || ''}
        </div>
        <div style="margin-bottom: 10px;">
          <strong>Phone:</strong> <a href="tel:${props.phone || ''}">${
          props.phone || ''
        }</a>
        </div>
        <div>
          <strong>Email:</strong> <a href="mailto:${props.email || ''}">${
          props.email || ''
        }</a>
        </div>
      `;

        return {
          getElement: () => element,
        };
      };
    }

    return svarogUI;
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
