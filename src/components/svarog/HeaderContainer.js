// src/components/header/HeaderContainer.js
/**
 * Container component for managing CollapsibleHeader state
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
    try {
      this.headerData = headerData || {};
      this.HeaderComponent = headerComponent;
      this.transformProps = transformProps;
      this.collapseThreshold = collapseThreshold;
      this.svarogComponents = svarogComponents;
      this.showStickyIcons = showStickyIcons;

      // Initial state
      this.state = {
        isCollapsed: false,
        isMobile: window.innerWidth <= 768,
      };

      // Create the header component
      this.initialize();

      // Set up event listeners
      this.setupEventListeners();
    } catch (error) {
      console.error('Error in HeaderContainer constructor:', error);
      throw error;
    }
  }

  /**
   * Initialize the header component
   */
  initialize() {
    try {
      // Get initial props
      let baseProps =
        typeof this.transformProps === 'function' ? this.transformProps() : {};

      // Ensure navigation.items exists and is an array
      if (!baseProps.navigation || !Array.isArray(baseProps.navigation.items)) {
        console.log('Fixing navigation.items structure');
        if (!baseProps.navigation) {
          baseProps.navigation = { items: [] };
        } else {
          baseProps.navigation.items = Array.isArray(baseProps.navigation.items)
            ? baseProps.navigation.items
            : [];
        }
      }

      // Create props with state
      const props = {
        ...baseProps,
        isCollapsed: this.state.isCollapsed,
        isMobile: this.state.isMobile,
      };

      // Create the component
      this.headerComponent = new this.HeaderComponent(props);

      // Check if it has the necessary methods
      if (typeof this.headerComponent.getElement !== 'function') {
        console.error('Header component does not have getElement method');

        // Add getElement method if missing
        this.headerComponent.getElement = () => {
          if (this.headerComponent.element) {
            console.log('Using element property as fallback');
            return this.headerComponent.element;
          }
          console.warn('Creating fallback header element');
          return this.createFallbackHeaderElement();
        };
      }

      // Check if it has update method
      if (typeof this.headerComponent.update !== 'function') {
        console.warn(
          'Header component does not have update method, adding basic implementation'
        );

        // Add basic update implementation
        this.headerComponent.update = (newProps) => {
          console.log('Header update called with props:', newProps);
          // Try to manually update styles if possible
          try {
            const element = this.headerComponent.getElement();
            if (element) {
              if (newProps.isCollapsed) {
                element.classList.add('collapsible-header--collapsed');
              } else {
                element.classList.remove('collapsible-header--collapsed');
              }

              if (newProps.isMobile) {
                element.classList.add('collapsible-header--mobile');
              } else {
                element.classList.remove('collapsible-header--mobile');
              }
            }
          } catch (updateError) {
            console.error('Error manually updating header:', updateError);
          }
        };
      }

      // Create sticky icons if needed
      if (this.showStickyIcons) {
        this.createStickyIcons();
      }
    } catch (error) {
      console.error('Error in HeaderContainer.initialize:', error);
      throw error;
    }
  }

  /**
   * Create a fallback header element if component creation fails
   * @returns {HTMLElement} - Fallback header element
   */
  createFallbackHeaderElement() {
    const element = document.createElement('header');
    element.className = 'fallback-header collapsible-header';
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

    const siteName =
      this.headerData.siteName || this.headerData.SiteName || 'Svarog UI';

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
  }

  /**
   * Create and add sticky contact icons if needed
   */
  createStickyIcons() {
    if (!this.showStickyIcons || !this.headerData.contactInfo) {
      return; // Don't show sticky icons
    }

    // Check if StickyContactIcons component is available in svarogComponents
    const StickyContactIcons =
      this.svarogComponents && this.svarogComponents.StickyContactIcons;

    if (StickyContactIcons) {
      try {
        // Get contact info from header data
        const contactInfo = this.headerData.contactInfo;

        // Handle if contactInfo is an array (common in Storyblok)
        let location = '',
          phone = '',
          email = '',
          locationId = 'location';

        if (Array.isArray(contactInfo) && contactInfo.length > 0) {
          location = contactInfo[0].location || contactInfo[0].Location || '';
          phone = contactInfo[0].phone || contactInfo[0].Phone || '';
          email = contactInfo[0].email || contactInfo[0].Email || '';
          locationId =
            contactInfo[0].locationId ||
            contactInfo[0].LocationId ||
            'location';
        } else {
          location = contactInfo.location || contactInfo.Location || '';
          phone = contactInfo.phone || contactInfo.Phone || '';
          email = contactInfo.email || contactInfo.Email || '';
          locationId =
            contactInfo.locationId || contactInfo.LocationId || 'location';
        }

        // Create props for sticky icons
        const props = {
          location,
          phone,
          email,
          locationId,
          position: 'right', // Default position
        };

        // Create sticky icons component
        const stickyIcons = new StickyContactIcons(props);

        // Add to document when header is mounted
        setTimeout(() => {
          try {
            const iconElement = stickyIcons.getElement();
            if (iconElement && document.body) {
              document.body.appendChild(iconElement);
            }
          } catch (error) {
            console.error('Error adding sticky icons to document:', error);
          }
        }, 100);

        // Store reference for cleanup
        this.stickyIcons = stickyIcons;
      } catch (error) {
        console.error('Error creating sticky contact icons:', error);
      }
    } else {
      console.warn('StickyContactIcons component not available in Svarog UI');
    }
  }

  /**
   * Set up event listeners for scroll and resize
   */
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
        this.setState({ isCollapsed: shouldCollapse });
      }
    };

    // Debounced resize handler
    let resizeTimeout;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const isMobile = window.innerWidth <= 768;
        if (isMobile !== this.state.isMobile) {
          this.setState({ isMobile });
        }
      }, 200);
    };

    // Add event listeners
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    // Store remove function for cleanup
    this.removeEventListeners = () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };

    // Initial call to set correct state
    handleScroll();
    handleResize();
  }

  /**
   * Update state and component
   * @param {Object} newState - New state object
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };

    try {
      // Update component with new state
      if (
        this.headerComponent &&
        typeof this.headerComponent.update === 'function'
      ) {
        this.headerComponent.update({
          isCollapsed: this.state.isCollapsed,
          isMobile: this.state.isMobile,
        });
      }
    } catch (error) {
      console.error('Error updating header component:', error);
    }
  }

  /**
   * Get the header element
   * @returns {HTMLElement} - Header element
   */
  getElement() {
    try {
      if (
        this.headerComponent &&
        typeof this.headerComponent.getElement === 'function'
      ) {
        return this.headerComponent.getElement();
      }
      return this.createFallbackHeaderElement();
    } catch (error) {
      console.error('Error getting header element:', error);
      return this.createFallbackHeaderElement();
    }
  }

  /**
   * Clean up event listeners and components
   */
  destroy() {
    if (typeof this.removeEventListeners === 'function') {
      this.removeEventListeners();
    }

    // Clean up sticky icons if they exist
    if (this.stickyIcons) {
      try {
        const iconElement = this.stickyIcons.getElement();
        if (iconElement && iconElement.parentNode) {
          iconElement.parentNode.removeChild(iconElement);
        }
      } catch (error) {
        console.error('Error removing sticky contact icons:', error);
      }
    }
  }
}
