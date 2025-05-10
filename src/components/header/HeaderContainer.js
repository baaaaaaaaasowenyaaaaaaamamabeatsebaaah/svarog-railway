// src/components/header/HeaderContainer.js

/**
 * Container component for managing CollapsibleHeader state
 * Follows the container/presentational pattern for component design
 */
export default class HeaderContainer {
  /**
   * Create a new HeaderContainer
   * @param {Object} options - Configuration options
   * @param {Object} options.headerData - Header data from Storyblok
   * @param {Function} options.headerComponent - Svarog header component constructor
   * @param {Function} options.transformProps - Function to transform data to props
   * @param {number} options.collapseThreshold - Scroll threshold for collapsing
   * @param {Object} options.svarogComponents - All available Svarog components
   * @param {boolean} options.showStickyIcons - Whether to show sticky icons when collapsed
   */
  constructor({
    headerData,
    headerComponent,
    transformProps,
    collapseThreshold = 100,
    svarogComponents,
    showStickyIcons = false,
  }) {
    // Store configuration
    this.headerData = headerData || {};
    this.HeaderComponent = headerComponent;
    this.transformProps = transformProps;
    this.collapseThreshold = collapseThreshold;
    this.svarogComponents = svarogComponents;
    this.showStickyIcons = showStickyIcons;

    // Set initial state
    this.state = {
      isCollapsed: false,
      isMobile: this.checkIsMobile(),
    };

    // Initialize component and event handlers
    this.initialize();
  }

  /**
   * Check if viewport is mobile size
   * @returns {boolean} - True if mobile viewport
   */
  checkIsMobile() {
    return window.innerWidth <= 768;
  }

  /**
   * Initialize the component
   */
  initialize() {
    try {
      // Transform the Storyblok data into props for the Svarog component
      const baseProps = this.getTransformedProps();

      // Create props with state included
      const props = {
        ...baseProps,
        isCollapsed: this.state.isCollapsed,
        isMobile: this.state.isMobile,
        onCallButtonClick: this.handleCallButtonClick.bind(this),
      };

      // Create the header component
      this.headerComponent = new this.HeaderComponent(props);

      // Setup sticky contact icons if enabled
      if (this.showStickyIcons) {
        this.setupStickyIcons();
      }

      // Set up event listeners for scroll and resize
      this.setupEventListeners();
    } catch (error) {
      console.error('Error initializing header container:', error);
      this.headerComponent = this.createFallbackComponent();
    }
  }

  /**
   * Transform Storyblok data into props
   * @returns {Object} - Transformed props
   */
  getTransformedProps() {
    let baseProps = {};

    try {
      baseProps =
        typeof this.transformProps === 'function'
          ? this.transformProps()
          : this.headerData;

      // Process logo URLs
      if (baseProps.logo && typeof baseProps.logo === 'object') {
        baseProps.logo = baseProps.logo.filename || '';
      }

      if (baseProps.compactLogo && typeof baseProps.compactLogo === 'object') {
        baseProps.compactLogo = baseProps.compactLogo.filename || '';
      }

      // Ensure navigation structure
      if (!baseProps.navigation) {
        baseProps.navigation = { items: [] };
      } else if (!baseProps.navigation.items) {
        baseProps.navigation.items = [];
      }
    } catch (error) {
      console.error('Error transforming props:', error);
      // Return minimal valid props on error
      return {
        siteName: this.headerData.siteName || 'Site Name',
        navigation: { items: [] },
        contactInfo: {
          location: '',
          phone: '',
          email: '',
          locationId: 'location',
        },
      };
    }

    return baseProps;
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Throttled scroll handler
    this.lastScrollTime = 0;
    this.scrollHandler = this.handleScroll.bind(this);
    window.addEventListener('scroll', this.scrollHandler, { passive: true });

    // Debounced resize handler
    this.resizeTimeout = null;
    this.resizeHandler = this.handleResize.bind(this);
    window.addEventListener('resize', this.resizeHandler);

    // Initial check
    this.handleScroll();
  }

  /**
   * Handle scroll events
   */
  handleScroll() {
    const now = Date.now();
    if (now - this.lastScrollTime < 50) return; // Throttle to 50ms
    this.lastScrollTime = now;

    const scrollY = window.scrollY;
    const shouldCollapse = scrollY > this.collapseThreshold;

    if (shouldCollapse !== this.state.isCollapsed) {
      this.setState({ isCollapsed: shouldCollapse });
    }
  }

  /**
   * Handle resize events
   */
  handleResize() {
    clearTimeout(this.resizeTimeout);

    this.resizeTimeout = setTimeout(() => {
      const isMobile = this.checkIsMobile();
      if (isMobile !== this.state.isMobile) {
        this.setState({ isMobile });
      }
    }, 150);
  }

  /**
   * Handle call button clicks
   * @param {Event} event - Click event
   */
  handleCallButtonClick(event) {
    // Add any analytics or tracking here
    if (typeof this.headerData.onCallButtonClick === 'function') {
      this.headerData.onCallButtonClick(event);
    }
  }

  /**
   * Set up sticky contact icons
   */
  setupStickyIcons() {
    const StickyContactIcons = this.svarogComponents.StickyContactIcons;

    if (!StickyContactIcons) {
      console.warn('StickyContactIcons component not available');
      return;
    }

    try {
      // Extract contact info
      const contactInfo = this.extractContactInfo();

      // Create sticky icons component
      this.stickyIcons = new StickyContactIcons({
        location: contactInfo.location,
        phone: contactInfo.phone,
        email: contactInfo.email,
        locationId: contactInfo.locationId || 'location',
        position: 'right',
      });

      // Add to document
      setTimeout(() => {
        if (document.body) {
          document.body.appendChild(this.stickyIcons.getElement());
        }
      }, 100);
    } catch (error) {
      console.error('Error setting up sticky icons:', error);
    }
  }

  /**
   * Extract contact info from header data
   * @returns {Object} - Contact info properties
   */
  extractContactInfo() {
    let contactInfo = this.headerData.contactInfo || {};

    // Handle array format (common in Storyblok)
    if (Array.isArray(contactInfo) && contactInfo.length > 0) {
      contactInfo = contactInfo[0];
    }

    return {
      location: contactInfo.location || contactInfo.Location || '',
      phone: contactInfo.phone || contactInfo.Phone || '',
      email: contactInfo.email || contactInfo.Email || '',
      locationId:
        contactInfo.locationId || contactInfo.LocationId || 'location',
    };
  }

  /**
   * Update component state
   * @param {Object} newState - New state properties
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };

    try {
      if (
        this.headerComponent &&
        typeof this.headerComponent.update === 'function'
      ) {
        this.headerComponent.update(this.state);
      } else {
        // Manual update if update method not available
        this.manuallyUpdateHeaderStyles();
      }
    } catch (error) {
      console.error('Error updating header state:', error);
    }
  }

  /**
   * Manually update header styles if update method is not available
   */
  manuallyUpdateHeaderStyles() {
    try {
      const element = this.headerComponent.getElement();
      if (!element) return;

      // Apply collapsed state
      if (this.state.isCollapsed) {
        element.classList.add('collapsible-header--collapsed');
      } else {
        element.classList.remove('collapsible-header--collapsed');
      }

      // Apply mobile state
      if (this.state.isMobile) {
        element.classList.add('collapsible-header--mobile');
      } else {
        element.classList.remove('collapsible-header--mobile');
      }
    } catch (err) {
      console.warn('Could not manually update header styles:', err);
    }
  }

  /**
   * Create a fallback component if the main one fails
   * @returns {Object} - Fallback component
   */
  createFallbackComponent() {
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

        const container = document.createElement('div');
        container.className = 'container';
        container.style.display = 'flex';
        container.style.justifyContent = 'space-between';
        container.style.alignItems = 'center';

        const siteName = this.headerData.siteName || 'Svarog UI';

        container.innerHTML = `
          <div class="header-logo">
            <h1 style="margin: 0; font-size: 1.5rem; color: var(--theme-primary, #fd7e14);">
              ${siteName}
            </h1>
          </div>
          <nav class="header-nav">
            <a href="/" style="margin: 0 10px; text-decoration: none; color: var(--theme-text, #333);">Home</a>
            <a href="/about" style="margin: 0 10px; text-decoration: none; color: var(--theme-text, #333);">About</a>
            <a href="/contact" style="margin: 0 10px; text-decoration: none; color: var(--theme-text, #333);">Contact</a>
          </nav>
        `;

        element.appendChild(container);
        return element;
      },
    };
  }

  /**
   * Get the DOM element for the component
   * @returns {HTMLElement} - The DOM element
   */
  getElement() {
    try {
      if (
        this.headerComponent &&
        typeof this.headerComponent.getElement === 'function'
      ) {
        return this.headerComponent.getElement();
      }
    } catch (error) {
      console.error('Error getting header element:', error);
    }

    // Return fallback if anything fails
    return this.createFallbackComponent().getElement();
  }

  /**
   * Clean up resources when component is destroyed
   */
  destroy() {
    // Remove event listeners
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
    }

    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }

    // Clear timeout if exists
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    // Remove sticky icons if they exist
    if (this.stickyIcons) {
      try {
        const element = this.stickyIcons.getElement();
        if (element && element.parentNode) {
          element.parentNode.removeChild(element);
        }
      } catch (error) {
        console.error('Error removing sticky icons:', error);
      }
    }
  }
}
