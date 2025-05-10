// src/cms/storyblok-integration.js
import StoryblokApi from './storyblok.js';
import ComponentRegistry from '../components/registry.js';
import ComponentLoader from '../components/loader.js';
import ContentBlockRenderer from '../components/content/ContentBlockRenderer.js';

// Preload svarog-ui for emergency fallback
let svarogUILib = {};
(async function loadSvarogBackup() {
  try {
    svarogUILib = await import('svarog-ui');
    console.log('Preloaded Svarog UI backup:', Object.keys(svarogUILib));
  } catch (err) {
    console.error('Failed to preload Svarog UI:', err);
  }
})();

/**
 * Integrates Storyblok with Svarog UI components
 */
export default class StoryblokIntegration {
  constructor() {
    this.api = new StoryblokApi();
    this.componentLoader = new ComponentLoader();
    this.registry = null;
    this.initialized = false;
    this.contentRenderer = null;
  }

  /**
   * Initialize the integration
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Check if ComponentLoader has the needed method
      if (
        !this.componentLoader ||
        typeof this.componentLoader.loadComponents !== 'function'
      ) {
        console.error(
          'ComponentLoader missing loadComponents method - creating emergency fallback'
        );

        // Create a fallback if the method doesn't exist
        if (this.componentLoader) {
          // Add the method if missing
          this.componentLoader.loadComponents = async () => {
            console.warn('Using fallback loadComponents implementation');
            try {
              // Direct import
              const svarogUI = await import('svarog-ui');
              console.log(
                'Imported Svarog UI directly:',
                Object.keys(svarogUI)
              );
              return svarogUI;
            } catch (importError) {
              console.error('Error in fallback import:', importError);
              return svarogUILib || {}; // Use preloaded or empty object
            }
          };
        } else {
          // Create a minimal loader if none exists
          this.componentLoader = {
            async loadComponents() {
              console.warn('Using minimal componentLoader implementation');
              try {
                const svarogUI = await import('svarog-ui');
                return svarogUI;
              } catch (error) {
                console.error('Error loading components directly:', error);
                return svarogUILib || {};
              }
            },
          };
        }
      }

      // Load Svarog UI components with error handling
      let components;
      try {
        components = await this.componentLoader.loadComponents();
      } catch (loadError) {
        console.error('Error loading components, using fallback:', loadError);

        // Direct import as fallback
        try {
          components = await import('svarog-ui');
        } catch (importError) {
          console.error('Error in fallback direct import:', importError);
          components = svarogUILib || {}; // Use preloaded or empty object
        }
      }

      // Create component registry with fallback
      try {
        this.registry = new ComponentRegistry(components);
      } catch (registryError) {
        console.error('Error creating component registry:', registryError);
        // Create minimal registry
        this.registry = {
          getComponentElement: async () => {
            const fallback = document.createElement('div');
            fallback.innerHTML = '<p>Component unavailable</p>';
            return fallback;
          },
        };
      }

      // Initialize content renderer with fallback
      try {
        this.contentRenderer = new ContentBlockRenderer(this.registry);
      } catch (rendererError) {
        console.error('Error creating content renderer:', rendererError);
        // Create minimal renderer
        this.contentRenderer = {
          renderBlocks: async (blocks, container) => {
            container.innerHTML =
              '<div style="padding: 20px; background: #f8f8f8;"><p>Content rendering unavailable</p></div>';
          },
        };
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Storyblok integration:', error);
      throw error;
    }
  }

  /**
   * Get a Storyblok component element
   * @param {Object} componentData - Storyblok component data
   * @param {Object} options - Additional options
   * @returns {Promise<HTMLElement>} - Component element
   */
  async getComponentElement(componentData, options = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      return this.registry.getComponentElement(componentData, options);
    } catch (error) {
      console.error(
        `Error getting component element for ${componentData?.component}:`,
        error
      );

      // Create fallback element
      const fallback = document.createElement('div');
      fallback.className = 'fallback-component';
      fallback.style.padding = '15px';
      fallback.style.margin = '10px 0';
      fallback.style.border = '1px solid #ddd';
      fallback.style.borderRadius = '4px';

      const componentType = componentData?.component || 'Unknown';
      fallback.innerHTML = `
        <p><strong>${componentType} Component</strong></p>
        <p>Unable to render component.</p>
      `;

      return fallback;
    }
  }

  /**
   * Get site header from Storyblok
   * @returns {Promise<HTMLElement>} - Header element
   */
  async getHeader() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Get header data from API
      const headerData = await this.api.getHeaderData();

      if (!headerData) {
        console.warn('No header data found');
        // Create a fallback header
        return this.createFallbackHeader();
      }

      // Ensure the component property is set
      if (!headerData.component) {
        console.warn(
          'Header data missing component type, assuming CollapsibleHeader'
        );
        headerData.component = 'CollapsibleHeader';
      }

      // Create header element
      return this.getComponentElement(headerData);
    } catch (error) {
      console.error('Error getting header:', error);
      return this.createFallbackHeader();
    }
  }

  /**
   * Create a fallback header
   * @returns {HTMLElement} - Fallback header element
   */
  createFallbackHeader() {
    const header = document.createElement('header');
    header.className = 'default-header';
    header.innerHTML = `
      <div class="container">
        <h1>Svarog UI</h1>
        <nav>
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
        </nav>
      </div>
    `;
    return header;
  }

  /**
   * Get content blocks from a Storyblok story
   * @param {string} slug - Story slug
   * @returns {Promise<Array<HTMLElement>>} - Array of content block elements
   */
  async getContentBlocks(slug) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Get story data
      const story = await this.api.getStory(slug);

      if (!story) {
        console.warn(`Story not found: ${slug}`);
        return [];
      }

      // Check if story has body content
      const content = story.content || {};
      if (
        !content.body ||
        !Array.isArray(content.body) ||
        content.body.length === 0
      ) {
        console.warn(`No body content in story: ${slug}`);

        // Create a default content block for the story
        const defaultBlock = {
          component: 'Section',
          _uid: `default-${slug}`,
          title: story.name || slug,
          content:
            content.intro || content.description || 'No content available.',
        };

        const element = await this.getComponentElement(defaultBlock);
        return element ? [element] : [];
      }

      // Create a container element to render content blocks
      const containerElement = document.createElement('div');
      containerElement.className = 'content-blocks-container';

      // Use content renderer to render blocks
      if (
        this.contentRenderer &&
        typeof this.contentRenderer.renderBlocks === 'function'
      ) {
        await this.contentRenderer.renderBlocks(content.body, containerElement);
      } else {
        // Fallback rendering if contentRenderer is not available
        containerElement.innerHTML = '<p>Content renderer not available</p>';
      }

      // Return the container with rendered content
      return [containerElement];
    } catch (error) {
      console.error(`Error getting content blocks for ${slug}:`, error);

      // Create error container
      const errorContainer = document.createElement('div');
      errorContainer.className = 'content-error-container';
      errorContainer.style.padding = '20px';
      errorContainer.style.margin = '20px 0';
      errorContainer.style.backgroundColor = '#f8d7da';
      errorContainer.style.color = '#721c24';
      errorContainer.style.borderRadius = '4px';
      errorContainer.style.border = '1px solid #f5c6cb';

      errorContainer.innerHTML = `
        <h3 style="margin-top: 0;">Error Loading Content</h3>
        <p>${error.message}</p>
        <button style="background: #721c24; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;" onclick="window.location.reload()">Retry</button>
      `;

      return [errorContainer];
    }
  }

  /**
   * Apply theme from Storyblok config or force a specific theme
   * @param {string} forcedTheme - Optional theme to force
   * @returns {Promise<string>} - Applied theme name
   */
  async applyTheme(forcedTheme = null) {
    try {
      // Use forced theme if provided, otherwise get from config
      let themeName = forcedTheme;

      if (!themeName) {
        // Get theme from site config
        const config = await this.api.getSiteConfig();
        themeName = config.theme || 'muchandy-theme';
      }

      // Ensure 'muchandy-theme' if specifically requesting 'muchandy'
      if (forcedTheme === 'muchandy') {
        themeName = 'muchandy-theme';
      }

      console.log(`Applying theme: ${themeName}`);

      // Switch theme using theme manager
      const themeManager = this.componentLoader
        ? this.componentLoader.getThemeManager()
        : null;

      if (themeManager && typeof themeManager.switchTheme === 'function') {
        themeManager.switchTheme(themeName);
      } else {
        // Fallback: Apply theme class directly
        document.documentElement.classList.remove(
          'default-theme',
          'cabalou-theme',
          'muchandy-theme'
        );
        document.documentElement.classList.add(themeName);
      }

      return themeName;
    } catch (error) {
      console.error('Error applying theme:', error);

      // Apply muchandy-theme as fallback
      document.documentElement.classList.remove(
        'default-theme',
        'cabalou-theme',
        'muchandy-theme'
      );
      document.documentElement.classList.add('muchandy-theme');

      return 'muchandy-theme';
    }
  }
}
