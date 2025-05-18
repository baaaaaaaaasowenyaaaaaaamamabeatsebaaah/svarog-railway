// src/storyblokIntegration.js
import * as SvarogUI from 'svarog-ui';
import { CollapsibleHeaderAdapter } from './components/header/CollapsibleHeaderAdapter.js';
import ContentCache from './utils/contentCache.js';

/**
 * Simple integration for Storyblok and Svarog UI focused on header functionality
 */
export default class StoryblokIntegration {
  constructor(options = {}) {
    this.options = {
      token: null,
      version: 'published',
      theme: 'muchandy', // Use just 'muchandy' not 'muchandy-theme'
      cacheEnabled: true, // Enable caching by default
      cacheTTL: 5 * 60 * 1000, // 5 minutes TTL
      ...options,
    };

    // Initialize content cache
    this.contentCache = new ContentCache({
      enabled: this.options.cacheEnabled,
      maxAge: this.options.cacheTTL,
    });

    this.componentsRegistry = {
      ...SvarogUI,
      MuchandyHero: SvarogUI.MuchandyHero || null,
    };

    // Add Grid.Column to registry if available
    if (SvarogUI.Grid && SvarogUI.Grid.Column) {
      this.componentsRegistry['Grid.Column'] = SvarogUI.Grid.Column;
    }

    this.cache = {};
    this.componentAdapters = {
      CollapsibleHeader: CollapsibleHeaderAdapter,
      // Add more component adapters here as needed
    };
  }

  /**
   * Initialize the integration
   */
  init() {
    // Check for token with better logging
    const token = this.options.token || '';

    if (!token) {
      console.warn(
        'Storyblok token is missing. Using fallback content instead of API content.'
      );
    } else {
      console.log('Storyblok integration initialized with token');
    }

    // Initialize theme if available
    if (SvarogUI.switchTheme) {
      try {
        console.log(`Setting theme to: ${this.options.theme}`);
        SvarogUI.switchTheme(this.options.theme);
      } catch (error) {
        console.warn('Error setting theme:', error);
        this.applyFallbackTheming(this.options.theme);
      }
    } else {
      this.applyFallbackTheming(this.options.theme);
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
      const cacheKey = `story:${slug}:${this.options.version}`;
      const cachedStory = this.contentCache.get(cacheKey);

      if (cachedStory) {
        console.log(`Using cached story: ${slug}`);
        return cachedStory;
      }

      // Make sure token is available
      const token = this.options.token || '';
      if (!token) {
        console.warn('Storyblok token is missing - using fallback content');
        return null;
      }

      // Fetch from API with error handling
      const url = `https://api.storyblok.com/v2/cdn/stories/${slug}?token=${token}&version=${this.options.version}`;

      // Wrap fetch in a try-catch to handle potential message channel errors
      let response;
      try {
        response = await fetch(url);
      } catch (error) {
        // Handle message channel errors gracefully
        if (error.message && error.message.includes('message channel closed')) {
          console.warn(
            'Navigation cancelled during story fetch:',
            error.message
          );
          throw new Error('Navigation cancelled');
        }
        throw error;
      }

      if (!response.ok) {
        throw new Error(
          `Failed to fetch story: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      this.cache[slug] = data.story;
      console.log(`Story found: ${slug}`);

      this.contentCache.set(cacheKey, data.story);
      return data.story;
    } catch (error) {
      // Special handling for navigation cancellation
      if (error.message === 'Navigation cancelled') {
        console.log(`Story fetch for ${slug} was cancelled due to navigation`);
        return null;
      }

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

      // Store reference to the header component for external access
      this.headerComponent = headerComponent;

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
    console.log('Creating fallback header');
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

  /**
   * Load and render content from a Storyblok story
   * @param {string} slug - Story slug
   * @returns {Promise<HTMLElement>} - Content element
   */
  async loadContent(slug) {
    try {
      console.log(`Loading content for slug: ${slug}`);
      const story = await this.fetchStory(slug);
      return this.renderContent(story);
    } catch (error) {
      console.error(`Error loading content for ${slug}:`, error);
      return this.createErrorContent(error.message);
    }
  }

  /**
   * Render a Storyblok story content
   * @param {Object} story - Storyblok story data
   * @returns {HTMLElement} - Content element
   */
  renderContent(story) {
    if (!story || !story.content) {
      return this.createEmptyContent('Content not found');
    }

    try {
      // Create content container
      const contentContainer = document.createElement('div');
      contentContainer.className = 'storyblok-content';

      // Wrap in container for styling consistency
      const container = document.createElement('div');
      container.className = 'container';
      contentContainer.appendChild(container);

      // Add page title if available
      if (story.name || story.content.title) {
        const title = document.createElement('h1');
        title.className = 'content-title';
        title.textContent = story.content.title || story.name;
        container.appendChild(title);
      }

      // Parse and render components from Storyblok
      if (story.content.body && Array.isArray(story.content.body)) {
        // Handle body components
        story.content.body.forEach((component) => {
          const componentElement = this.renderComponent(component);
          if (componentElement) {
            container.appendChild(componentElement);
          }
        });

        if (
          story.content.hero &&
          Array.isArray(story.content.hero) &&
          story.content.hero.length > 0
        ) {
          const heroComponent = this.renderComponent(story.content.hero[0]);
          if (heroComponent) {
            container.appendChild(heroComponent);
          }
        }
      } else if (story.content.text) {
        // Handle simple text content
        const textContainer = document.createElement('div');
        textContainer.className = 'content-text';
        textContainer.innerHTML = story.content.text;
        container.appendChild(textContainer);
      } else {
        // Create fallback content
        const fallbackContent = document.createElement('div');
        fallbackContent.className = 'fallback-content';
        fallbackContent.innerHTML = `
          <div class="content-section" style="padding: 40px; background-color: #f8f9fa; border-radius: 8px; margin: 20px 0;">
            <h2>Content for: ${story.name}</h2>
            <p>This is a placeholder for the "${story.name}" page content.</p>
          </div>
        `;
        container.appendChild(fallbackContent);
      }

      return contentContainer;
    } catch (error) {
      console.error('Error rendering content:', error);
      return this.createErrorContent(error.message);
    }
  }

  /**
   * Render a Storyblok component
   * @param {Object} component - Storyblok component data
   * @returns {HTMLElement|null} - Component element or null
   */
  renderComponent(component) {
    if (!component || !component.component) {
      console.warn('Invalid component data:', component);
      return null;
    }

    try {
      // Check if we have an adapter for this component
      const AdapterClass = this.componentAdapters[component.component];

      if (AdapterClass) {
        // Create adapter instance
        const adapter = new AdapterClass(component);
        // Create component using the adapter
        const svarogComponent = adapter.createComponent(
          this.componentsRegistry
        );
        // Return the element
        return svarogComponent.getElement();
      }

      // For components without adapters, create a generic element
      return this.createGenericComponent(component);
    } catch (error) {
      console.error(`Error rendering component ${component.component}:`, error);
      return this.createErrorComponent(component.component, error.message);
    }
  }

  /**
   * Create a generic component element for components without specific adapters
   * @param {Object} component - Storyblok component data
   * @returns {HTMLElement} - Generic component element
   */
  createGenericComponent(component) {
    const genericElement = document.createElement('div');
    genericElement.className = `sb-component sb-component-${component.component.toLowerCase()}`;

    // Create title if component has one
    if (component.title || component.headline) {
      const title = document.createElement('h2');
      title.className = 'component-title';
      title.textContent = component.title || component.headline;
      genericElement.appendChild(title);
    }

    // Create content if component has it
    if (component.text || component.content) {
      const content = document.createElement('div');
      content.className = 'component-content';
      content.innerHTML = component.text || component.content || '';
      genericElement.appendChild(content);
    }

    // If component has children, render them
    if (component.body && Array.isArray(component.body)) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'component-children';

      component.body.forEach((child) => {
        const childElement = this.renderComponent(child);
        if (childElement) {
          childrenContainer.appendChild(childElement);
        }
      });

      genericElement.appendChild(childrenContainer);
    }

    return genericElement;
  }

  /**
   * Create error component
   * @param {string} componentName - Name of the component that failed
   * @param {string} errorMessage - Error message
   * @returns {HTMLElement} - Error component element
   */
  createErrorComponent(componentName, errorMessage) {
    const errorElement = document.createElement('div');
    errorElement.className = 'component-error';
    errorElement.style.padding = '15px';
    errorElement.style.margin = '10px 0';
    errorElement.style.backgroundColor = '#fff0f0';
    errorElement.style.border = '1px solid #ffcece';
    errorElement.style.borderRadius = '4px';

    errorElement.innerHTML = `
      <p><strong>Error rendering component: ${componentName}</strong></p>
      <p>${errorMessage}</p>
    `;

    return errorElement;
  }

  /**
   * Create empty content element
   * @param {string} message - Message to display
   * @returns {HTMLElement} - Empty content element
   */
  createEmptyContent(message) {
    const emptyContent = document.createElement('div');
    emptyContent.className = 'empty-content';
    emptyContent.innerHTML = `
      <div class="container" style="text-align: center; padding: 60px 20px;">
        <h2>Content Not Available</h2>
        <p>${message || 'The requested content could not be found.'}</p>
      </div>
    `;
    return emptyContent;
  }

  /**
   * Create error content element
   * @param {string} errorMessage - Error message
   * @returns {HTMLElement} - Error content element
   */
  createErrorContent(errorMessage) {
    const errorContent = document.createElement('div');
    errorContent.className = 'error-content';

    errorContent.innerHTML = `
    <div class="container" style="text-align: center; padding: 60px 20px;">
      <h2>Error Loading Content</h2>
      <p>${errorMessage || 'An error occurred while loading the content.'}</p>
      <button class="retry-button">Retry</button>
    </div>
  `;

    // Add event listener programmatically instead of using inline onclick
    setTimeout(() => {
      const retryButton = errorContent.querySelector('.retry-button');
      if (retryButton) {
        retryButton.addEventListener('click', () => {
          window.location.reload();
        });
      }
    }, 0);

    return errorContent;
  }

  /**
   * Load and render a page from Storyblok
   * @param {string} slug - Page slug
   * @returns {Promise<HTMLElement>} - Page content element
   */
  async loadPage(slug) {
    try {
      // Normalize slug
      const normalizedSlug = slug === 'home' ? '' : slug;

      // Fetch story
      const story = await this.fetchStory(normalizedSlug);

      // Render content
      return this.renderContent(story);
    } catch (error) {
      console.error(`Error loading page ${slug}:`, error);
      return this.createErrorContent(error.message);
    }
  }

  /**
   * Load and render the site footer
   * @param {string} configSlug - Config story slug
   * @returns {Promise<HTMLElement>} - Footer element
   */
  async loadFooter(configSlug = 'config') {
    try {
      const configStory = await this.fetchStory(configSlug);

      if (!configStory || !configStory.content) {
        console.error('Config story not found or has no content');
        return this.createFallbackFooter();
      }

      // Get footer data from config story
      let footerData =
        configStory.content.footer?.[0] || configStory.content.footer || {};

      // For now, just create a fallback footer
      // In a real implementation, you would create a footer adapter like the header
      return this.createFallbackFooter(footerData);
    } catch (error) {
      console.error('Error loading footer:', error);
      return this.createFallbackFooter();
    }
  }

  /**
   * Create a fallback footer element
   * @param {Object} footerData - Optional footer data from Storyblok
   * @returns {HTMLElement} - Fallback footer element
   */
  createFallbackFooter(footerData = {}) {
    const fallbackFooter = document.createElement('footer');
    fallbackFooter.className = 'fallback-footer';
    fallbackFooter.style.padding = '40px 0';
    fallbackFooter.style.background = '#f8f9fa';
    fallbackFooter.style.borderTop = '1px solid #e0e0e0';

    // Use data from Storyblok if available
    const siteName = footerData.siteName || 'Svarog UI';
    const copyright =
      footerData.copyright ||
      `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`;

    fallbackFooter.innerHTML = `
      <div class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
          <div>
            <h3 style="margin: 0; font-size: 1.5rem; color: var(--theme-primary, #fd7e14);">${siteName}</h3>
          </div>
          <div style="display: flex; gap: 20px;">
            <a href="/" style="text-decoration: none; color: var(--theme-text, #333);">Home</a>
            <a href="/about" style="text-decoration: none; color: var(--theme-text, #333);">About</a>
            <a href="/contact" style="text-decoration: none; color: var(--theme-text, #333);">Contact</a>
          </div>
          <div style="color: var(--theme-text-light, #6c757d); font-size: 14px;">
            ${copyright}
          </div>
        </div>
      </div>
    `;

    return fallbackFooter;
  }
}
