// src/storyblokIntegration.js
import * as SvarogUI from 'svarog-ui';
import StoryblokHelper from './utils/storyblokHelper.js';

/**
 * Simple HeaderContainer for managing CollapsibleHeader state
 */
class HeaderContainer {
  constructor(props, HeaderComponent) {
    this.props = props;
    this.collapseThreshold = props.collapseThreshold || 100;
    this.HeaderComponent = HeaderComponent;

    // Initial state
    this.state = {
      isCollapsed: false,
      isMobile: window.innerWidth <= 768,
    };

    // Create header component
    this.headerComponent = new HeaderComponent({
      ...props,
      isCollapsed: this.state.isCollapsed,
      isMobile: this.state.isMobile,
    });

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

  getElement() {
    return this.headerComponent.getElement();
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
      const headerData = configStory.content.header?.[0] || {};
      const collapseThreshold =
        configStory.content.header_collapse_threshold || 100;

      console.log(
        'Raw header data from Storyblok:',
        JSON.stringify(headerData, null, 2)
      );

      console.log('Creating header with props:', {
        ...headerData,
        collapseThreshold,
      });

      // Transform props
      const headerProps = StoryblokHelper.transformProps(
        'CollapsibleHeader',
        headerData
      );

      // Check if we have CollapsibleHeader component
      if (!this.componentsRegistry.CollapsibleHeader) {
        console.warn(
          'CollapsibleHeader component not found, using regular Header'
        );

        if (this.componentsRegistry.Header) {
          // Use regular Header
          const header = this.createComponent('Header', headerProps);
          return header.getElement();
        }

        return null;
      }

      // Create header container
      const headerContainer = new HeaderContainer(
        { ...headerProps, collapseThreshold },
        this.componentsRegistry.CollapsibleHeader
      );

      return headerContainer.getElement();
    } catch (error) {
      console.error('Error loading header:', error);
      return null;
    }
  }
}
