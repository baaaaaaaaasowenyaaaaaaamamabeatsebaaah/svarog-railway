// src/cms/storyblok-integration.js
import StoryblokApi from './storyblok.js';
import ComponentRegistry from '../components/registry.js';
import ComponentLoader from '../components/loader.js';
import ContentBlockRenderer from '../components/content/ContentBlockRenderer.js';

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
      // Load Svarog UI components
      const components = await this.componentLoader.loadComponents();

      // Create component registry
      this.registry = new ComponentRegistry(components);

      // Initialize content renderer
      this.contentRenderer = new ContentBlockRenderer(this.registry);

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
    if (!this.initialized) {
      await this.initialize();
    }

    return this.registry.getComponentElement(componentData, options);
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
      await this.contentRenderer.renderBlocks(content.body, containerElement);

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
      const themeManager = this.componentLoader.getThemeManager();
      if (themeManager && typeof themeManager.switchTheme === 'function') {
        themeManager.switchTheme(themeName);
      } else {
        // Fallback: apply theme class directly
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
