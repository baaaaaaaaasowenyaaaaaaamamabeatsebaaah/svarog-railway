// src/storyblokIntegration.js
import * as SvarogUI from 'svarog-ui';
import { CollapsibleHeaderAdapter } from './components/header/CollapsibleHeaderAdapter.js';

/**
 * Simple integration for Storyblok and Svarog UI focused on header functionality
 */
export default class StoryblokIntegration {
  constructor(options = {}) {
    this.options = {
      token: null,
      version: 'published',
      theme: 'muchandy', // Use just 'muchandy' not 'muchandy-theme'
      ...options,
    };

    this.componentsRegistry = {
      ...SvarogUI,
    };

    // Add Grid.Column to registry if available
    if (SvarogUI.Grid && SvarogUI.Grid.Column) {
      this.componentsRegistry['Grid.Column'] = SvarogUI.Grid.Column;
    }

    this.cache = {};
  }

  /**
   * Initialize the integration
   */
  init() {
    if (!this.options.token) {
      console.error('Storyblok token is required');
      return;
    }

    console.log('Storyblok integration initialized');

    // Initialize theme if available
    if (SvarogUI.switchTheme) {
      try {
        // Pass just the theme name, not with '-theme' suffix
        console.log(`Setting theme to: ${this.options.theme}`);
        SvarogUI.switchTheme(this.options.theme);
      } catch (error) {
        console.warn('Error setting theme:', error);
      }
    }
  }

  /**
   * Fetch a story from Storyblok
   * @param {string} slug - Story slug
   * @returns {Promise<Object>} - Story data
   */
  async fetchStory(slug) {
    try {
      console.log(`Fetching story: ${slug}`);

      // Check cache first
      if (this.cache[slug]) {
        return this.cache[slug];
      }

      // Fetch from API
      const url = `https://api.storyblok.com/v2/cdn/stories/${slug}?token=${this.options.token}&version=${this.options.version}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch story: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      this.cache[slug] = data.story;
      console.log(`Story found: ${slug}`);

      return data.story;
    } catch (error) {
      console.error(`Error fetching story ${slug}:`, error);
      throw error;
    }
  }

  /**
   * Load and render the site header from config story
   * @param {string} configSlug - Config story slug
   * @returns {Promise<HTMLElement|null>} - Header element or null
   */
  async loadHeader(configSlug = 'config') {
    try {
      const configStory = await this.fetchStory(configSlug);

      if (!configStory || !configStory.content) {
        console.error('Config story not found or has no content');
        return this.createFallbackHeader();
      }

      // Get header data from config story
      let headerData =
        configStory.content.header?.[0] || configStory.content.header || {};

      // If headerData is missing, try to find it elsewhere in the content
      if (!headerData || Object.keys(headerData).length === 0) {
        headerData = configStory.content;
      }

      // Ensure component type is set
      if (!headerData.component) {
        headerData.component = 'CollapsibleHeader';
      }

      // Create header adapter
      const headerAdapter = new CollapsibleHeaderAdapter(headerData);

      // Create the component
      const headerComponent = headerAdapter.createComponent(
        this.componentsRegistry
      );

      // Return the element
      return headerComponent.getElement();
    } catch (error) {
      console.error('Error loading header:', error);
      return this.createFallbackHeader();
    }
  }

  /**
   * Create a fallback header element
   * @returns {HTMLElement} - Fallback header element
   */
  createFallbackHeader() {
    const fallbackHeader = document.createElement('header');
    fallbackHeader.className = 'fallback-header';
    fallbackHeader.style.padding = '20px';
    fallbackHeader.style.background = '#fff';
    fallbackHeader.style.position = 'sticky';
    fallbackHeader.style.top = '0';
    fallbackHeader.style.zIndex = '100';
    fallbackHeader.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

    fallbackHeader.innerHTML = `
      <div class="container" style="display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto;">
        <h1 style="margin: 0; font-size: 1.5rem; color: var(--theme-primary, #fd7e14);">Svarog UI</h1>
        <nav>
          <a href="/" style="margin: 0 10px; text-decoration: none; color: var(--theme-text, #333);">Home</a>
          <a href="/about" style="margin: 0 10px; text-decoration: none; color: var(--theme-text, #333);">About</a>
          <a href="/contact" style="margin: 0 10px; text-decoration: none; color: var(--theme-text, #333);">Contact</a>
        </nav>
      </div>
    `;

    return fallbackHeader;
  }
}
