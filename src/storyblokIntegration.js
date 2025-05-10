// src/storyblokIntegration.js
import * as SvarogUI from 'svarog-ui';
import StoryblokHelper from './utils/storyblokHelper.js';

/**
 * Simple HeaderContainer for managing CollapsibleHeader state
 */
class HeaderContainer {
  constructor({
    headerData,
    headerComponent,
    collapseThreshold = 100,
    showStickyIcons = false,
  }) {
    this.props = headerData || {};
    this.HeaderComponent = headerComponent;
    this.collapseThreshold = collapseThreshold;
    this.showStickyIcons = showStickyIcons;

    // Initial state
    this.state = {
      isCollapsed: false,
      isMobile: window.innerWidth <= 768,
    };

    // Create header component
    try {
      // Ensure navigation.items exists
      if (
        !this.props.navigation ||
        !Array.isArray(this.props.navigation.items)
      ) {
        console.log('Fixing navigation.items structure');
        if (!this.props.navigation) {
          this.props.navigation = { items: [] };
        } else {
          this.props.navigation.items = Array.isArray(
            this.props.navigation.items
          )
            ? this.props.navigation.items
            : [];
        }
      }

      console.log('Creating header with props:', {
        ...this.props,
        isCollapsed: this.state.isCollapsed,
        isMobile: this.state.isMobile,
      });

      this.headerComponent = new this.HeaderComponent({
        ...this.props,
        isCollapsed: this.state.isCollapsed,
        isMobile: this.state.isMobile,
      });
    } catch (error) {
      console.error('Error creating header component:', error);
      this.headerComponent = this.createFallbackHeader();
    }

    // Setup event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Throttled scroll handler
    let lastScrollTime = 0;
    const handleScroll = () => {
      const now = Date.now();
      if (now - lastScrollTime < 100) return; // Throttle to 100ms
      lastScrollTime = now;

      const scrollY = window.scrollY;
      const shouldCollapse = scrollY > this.collapseThreshold;

      if (shouldCollapse !== this.state.isCollapsed) {
        this.state.isCollapsed = shouldCollapse;

        // Update component if it has an update method
        if (this.headerComponent.update) {
          this.headerComponent.update({
            isCollapsed: this.state.isCollapsed,
          });
        }
      }
    };

    // Debounced resize handler
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const isMobile = window.innerWidth <= 768;

        if (isMobile !== this.state.isMobile) {
          this.state.isMobile = isMobile;

          // Update component if it has an update method
          if (this.headerComponent.update) {
            this.headerComponent.update({
              isMobile: this.state.isMobile,
            });
          }
        }
      }, 200);
    };

    // Add event listeners
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    // Store for cleanup
    this.cleanup = () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };

    // Initial state
    handleScroll();
    handleResize();
  }

  createFallbackHeader() {
    return {
      getElement: () => {
        const element = document.createElement('header');
        element.className = 'fallback-header';
        element.style.padding = '20px';
        element.style.background = '#fff';
        element.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        element.style.position = 'sticky';
        element.style.top = '0';
        element.style.zIndex = '100';

        const siteName = this.props.siteName || 'Svarog UI';

        element.innerHTML = `
          <div class="container" style="display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto;">
            <h1 style="margin: 0; font-size: 1.5rem; color: var(--theme-primary, #fd7e14);">${siteName}</h1>
            <nav>
              <a href="/" style="margin: 0 10px; text-decoration: none; color: var(--theme-text, #333);">Home</a>
              <a href="/about" style="margin: 0 10px; text-decoration: none; color: var(--theme-text, #333);">About</a>
              <a href="/contact" style="margin: 0 10px; text-decoration: none; color: var(--theme-text, #333);">Contact</a>
            </nav>
          </div>
        `;

        return element;
      },
      update: () => {}, // Placeholder update method
    };
  }

  getElement() {
    try {
      // Get element from header component
      if (
        this.headerComponent &&
        typeof this.headerComponent.getElement === 'function'
      ) {
        return this.headerComponent.getElement();
      }

      // Use element property as fallback
      if (this.headerComponent && this.headerComponent.element) {
        return this.headerComponent.element;
      }

      // Create fallback if all else fails
      return this.createFallbackHeader().getElement();
    } catch (error) {
      console.error('Error getting header element:', error);
      return this.createFallbackHeader().getElement();
    }
  }

  destroy() {
    if (this.cleanup) {
      this.cleanup();
    }
  }
}

/**
 * Integration for Storyblok and Svarog UI
 */
export default class StoryblokIntegration {
  constructor(options = {}) {
    this.options = {
      token: null,
      version: 'published',
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
        const savedTheme = localStorage.getItem('svarog-theme') || 'default';
        SvarogUI.switchTheme(savedTheme);
      } catch (error) {
        console.warn('Error setting theme:', error);
        SvarogUI.switchTheme('default');
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
   * Create a Svarog component instance
   * @param {string} componentName - Component name
   * @param {Object} props - Component props
   * @returns {Object|null} - Component instance or null if component not found
   */
  createComponent(componentName, props) {
    try {
      const Component = this.componentsRegistry[componentName];

      if (!Component) {
        console.error(`Component ${componentName} not found in registry`);
        return null;
      }

      // Special case for Grid.Column
      if (componentName === 'Grid.Column' && this.componentsRegistry.Grid) {
        return new this.componentsRegistry.Grid.Column(props);
      }

      // Create and return component instance
      return new Component(props);
    } catch (error) {
      console.error(`Error creating component ${componentName}:`, error);
      return null;
    }
  }

  /**
   * Handle rendering a Grid component with its columns
   * @param {Object} grid - Grid component instance
   * @param {Array} columns - Column data from Storyblok
   */
  handleGridColumns(grid, columns) {
    if (!grid || !columns || !Array.isArray(columns)) {
      return;
    }

    console.log('Adding columns to grid...');
    let addedColumns = 0;

    columns.forEach((columnData) => {
      try {
        // Transform column props
        const columnProps = StoryblokHelper.transformProps(
          'Grid.Column',
          columnData
        );

        // Create column component
        const column = this.createComponent('Grid.Column', columnProps);

        if (column) {
          grid.appendChild(column.getElement());
          addedColumns++;
        }
      } catch (error) {
        console.error('Error creating column:', error);
      }
    });

    console.log(`Added ${addedColumns} columns to grid`);
  }

  /**
   * Render Storyblok block as a Svarog component
   * @param {Object} block - Storyblok block data
   * @returns {HTMLElement|null} - Rendered element or null
   */
  renderBlock(block) {
    try {
      if (!block || !block.component) {
        return null;
      }

      const componentName = block.component;
      console.log(`Creating component: ${componentName}`);

      // Transform props
      const props = StoryblokHelper.transformProps(componentName, block);

      // Handle nested components in 'children' field
      if (block.body && Array.isArray(block.body)) {
        props.children = block.body
          .map((childBlock) => this.renderBlock(childBlock))
          .filter(Boolean);
      }

      // Create component
      const component = this.createComponent(componentName, props);

      if (!component) {
        return null;
      }

      // Special handling for Grid columns
      if (
        componentName === 'Grid' &&
        block.columns &&
        Array.isArray(block.columns)
      ) {
        this.handleGridColumns(component, block.columns);
      }

      return component.getElement();
    } catch (error) {
      console.error('Error rendering block:', error);
      return null;
    }
  }

  /**
   * Render a story into a container
   * @param {string} slug - Story slug
   * @param {HTMLElement} container - Container element
   */
  async renderStory(slug, container) {
    try {
      const story = await this.fetchStory(slug);

      if (!story || !story.content || !story.content.body) {
        console.error(`Story ${slug} has no content or body`);
        return;
      }

      // Clear container
      container.innerHTML = '';

      // Render each block
      story.content.body.forEach((block) => {
        const element = this.renderBlock(block);
        if (element) {
          container.appendChild(element);
        }
      });

      console.log('Content loaded successfully');
    } catch (error) {
      console.error(`Error rendering story ${slug}:`, error);
      container.innerHTML =
        '<div class="error-message">Error loading content</div>';
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
        return null;
      }

      // Get header data from config story
      let headerData =
        configStory.content.header?.[0] || configStory.content.header || {};

      // If headerData is missing, try to find it elsewhere in the content
      if (!headerData || Object.keys(headerData).length === 0) {
        headerData = configStory.content;
      }

      // Log for debugging
      console.log(
        'Creating header with data:',
        JSON.stringify(headerData, null, 2)
      );

      // Ensure component type is set
      if (!headerData.component) {
        headerData.component = 'CollapsibleHeader';
      }

      // Transform the navigation structure to match what CollapsibleHeader expects
      const transformedProps = StoryblokHelper.transformHeaderProps(headerData);

      // Create header container
      const headerContainer = new HeaderContainer({
        headerData: transformedProps,
        headerComponent: this.componentsRegistry.CollapsibleHeader,
        collapseThreshold: parseInt(headerData.collapseThreshold || 100, 10),
        showStickyIcons: !!headerData.showStickyIcons,
      });

      return headerContainer.getElement();
    } catch (error) {
      console.error('Error loading header:', error);

      // Create fallback header
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
}
