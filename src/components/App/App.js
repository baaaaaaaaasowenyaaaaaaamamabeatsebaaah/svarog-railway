// src/components/App/App.js
import './App.css';
import ContentManager from '../../utils/contentManager.js';
import ThemeManager from '../../utils/themeManager.js';

export default class App {
  constructor(options = {}) {
    this.options = {
      storyblok: null,
      theme: ThemeManager.THEMES.MUCHANDY,
      collapseThreshold: 100, // Default collapse threshold
      ...options,
    };

    // Root element that will contain the app
    this.element = document.createElement('div');
    this.element.id = 'app-root';
    this.element.className = 'app-container';

    // Create layout elements
    this.headerContainer = document.createElement('header');
    this.headerContainer.id = 'app-header';
    this.headerContainer.className = 'app-header';

    this.contentContainer = document.createElement('main');
    this.contentContainer.id = 'main-content';
    this.contentContainer.className = 'app-content';

    this.footerContainer = document.createElement('footer');
    this.footerContainer.id = 'app-footer';
    this.footerContainer.className = 'app-footer';

    // Build DOM
    this.element.appendChild(this.headerContainer);
    this.element.appendChild(this.contentContainer);
    this.element.appendChild(this.footerContainer);

    // References to components
    this.header = null;
    this.contentManager = null;
    this.footer = null;
    this.stickyIcons = null;

    // State
    this.state = {
      headerCollapsed: false,
      isMobile: this.checkIsMobile(),
    };

    // Bind methods
    this.handleScroll = this.handleScroll.bind(this);
    this.handleResize = this.handleResize.bind(this);

    // Initialize
    this.init();
  }

  async init() {
    try {
      // Set theme
      ThemeManager.initializeTheme(null, this.options.theme);

      // Initialize content manager
      this.contentManager = new ContentManager({
        contentElement: this.contentContainer,
        storyblok: this.options.storyblok,
      });

      // Load header
      await this.loadHeader();

      // Set up scroll and resize listeners
      window.addEventListener('scroll', this.handleScroll, { passive: true });
      window.addEventListener('resize', this.handleResize);

      // Setup sticky icons
      await this.setupStickyIcons();

      // Load footer (placeholder for now)
      this.loadFooter();

      // Initial state check
      this.handleScroll();
      this.handleResize();
    } catch (error) {
      console.error('App initialization error:', error);
      this.showError('Application Error', error.message);
    }
  }

  async loadHeader() {
    try {
      // Show loading state
      this.headerContainer.innerHTML =
        '<div class="loading">Loading header...</div>';

      // Load header from Storyblok
      if (this.options.storyblok) {
        const headerElement = await this.options.storyblok.loadHeader();
        if (headerElement) {
          this.headerContainer.innerHTML = '';
          this.headerContainer.appendChild(headerElement);
          return;
        }
      }

      // Fallback header if Storyblok load fails
      this.headerContainer.innerHTML = this.createFallbackHeader();
    } catch (error) {
      console.error('Error loading header:', error);
      this.headerContainer.innerHTML = this.createFallbackHeader();
    }
  }

  async setupStickyIcons() {
    if (!this.options.storyblok) return;

    try {
      // Get config to extract contact info
      const configStory = await this.options.storyblok.fetchStory('config');

      if (!configStory || !configStory.content) {
        console.warn('Config story not found, cannot create sticky icons');
        return;
      }

      // Try to find contactInfo in different places
      let contactInfo = {};

      if (configStory.content.contactInfo) {
        contactInfo = Array.isArray(configStory.content.contactInfo)
          ? configStory.content.contactInfo[0]
          : configStory.content.contactInfo;
      } else if (configStory.content.header) {
        const header = Array.isArray(configStory.content.header)
          ? configStory.content.header[0]
          : configStory.content.header;

        if (header && header.contactInfo) {
          contactInfo = Array.isArray(header.contactInfo)
            ? header.contactInfo[0]
            : header.contactInfo;
        }
      }

      // Check if we have the required contact data
      if (!contactInfo.location || !contactInfo.phone || !contactInfo.email) {
        console.warn('Contact info incomplete, cannot create sticky icons');
        return;
      }

      // Create sticky icons
      const StickyContactIcons =
        this.options.storyblok.componentsRegistry.StickyContactIcons;

      if (!StickyContactIcons) {
        console.warn(
          'StickyContactIcons component not found in Svarog registry'
        );
        return;
      }

      this.stickyIcons = new StickyContactIcons({
        location: contactInfo.location,
        phone: contactInfo.phone,
        email: contactInfo.email,
        locationId: contactInfo.locationId || 'location',
        position: 'right',
        className: 'app-sticky-contact-icons',
      });

      // Initially hide icons - visibility will be updated in handleScroll
      const iconElement = this.stickyIcons.getElement();
      iconElement.style.display = 'none';
      iconElement.style.zIndex = '1001'; // Above header

      // Add to DOM
      document.body.appendChild(iconElement);
    } catch (error) {
      console.error('Error setting up sticky icons:', error);
    }
  }

  loadFooter() {
    // Simple footer placeholder - would be loaded from Storyblok in real implementation
    this.footerContainer.innerHTML = `
      <div class="container">
        <div class="footer-content">
          <div class="footer-logo">
            <h3>Svarog UI</h3>
          </div>
          <div class="footer-links">
            <a href="/">Home</a>
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
          </div>
          <div class="footer-copyright">
            &copy; ${new Date().getFullYear()} Svarog UI. All rights reserved.
          </div>
        </div>
      </div>
    `;
  }

  createFallbackHeader() {
    return `
      <div class="fallback-header">
        <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
          <h1 style="margin: 0; font-size: 1.5rem; color: var(--theme-primary, #fd7e14);">Svarog UI</h1>
          <nav>
            <a href="/" style="margin: 0 10px; text-decoration: none; color: var(--theme-text, #333);">Home</a>
            <a href="/about" style="margin: 0 10px; text-decoration: none; color: var(--theme-text, #333);">About</a>
            <a href="/contact" style="margin: 0 10px; text-decoration: none; color: var(--theme-text, #333);">Contact</a>
          </nav>
        </div>
      </div>
    `;
  }

  showError(title, message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'error';
    errorEl.style.textAlign = 'center';
    errorEl.style.padding = '40px';

    errorEl.innerHTML = `
    <h2>${title}</h2>
    <p>${message || 'Unknown error occurred'}</p>
    <p>Check the console for more details.</p>
    <button class="retry-button">Retry</button>
  `;

    // Add event listener after the element is created
    setTimeout(() => {
      const retryButton = errorEl.querySelector('.retry-button');
      if (retryButton) {
        retryButton.addEventListener('click', () => {
          window.location.reload();
        });
      }
    }, 0);

    this.contentContainer.innerHTML = '';
    this.contentContainer.appendChild(errorEl);
  }

  handleScroll() {
    // Only process if we have sticky icons
    if (!this.stickyIcons) return;

    const scrollY = window.scrollY;
    const shouldCollapse = scrollY > this.options.collapseThreshold;

    // Update state only if changed
    if (shouldCollapse !== this.state.headerCollapsed) {
      this.state.headerCollapsed = shouldCollapse;
      this.updateStickyIcons();
      this.updateHeaderState();
    }
  }

  handleResize() {
    const isMobile = this.checkIsMobile();

    // Update state only if changed
    if (isMobile !== this.state.isMobile) {
      this.state.isMobile = isMobile;
      this.updateStickyIcons();
      this.updateHeaderState();
    }
  }

  checkIsMobile() {
    return window.innerWidth <= 768;
  }

  updateStickyIcons() {
    if (!this.stickyIcons) return;

    const iconElement = this.stickyIcons.getElement();
    const shouldShow = this.state.headerCollapsed || this.state.isMobile;

    // Update visibility
    iconElement.style.display = shouldShow ? 'flex' : 'none';

    // Position differently on mobile
    if (this.state.isMobile) {
      iconElement.style.position = 'fixed';
      iconElement.style.bottom = '16px';
      iconElement.style.right = '16px';
      iconElement.style.top = 'auto';
      iconElement.style.flexDirection = 'row';
    } else {
      iconElement.style.position = 'fixed';
      const headerHeight = this.headerContainer.offsetHeight || 120;
      iconElement.style.top = `${headerHeight + 16}px`;
      iconElement.style.right = '16px';
      iconElement.style.bottom = 'auto';
      iconElement.style.flexDirection = 'column';
    }
  }

  updateHeaderState() {
    // Update header component if it has update method
    if (this.options.storyblok && this.options.storyblok.headerComponent) {
      const headerComponent = this.options.storyblok.headerComponent;

      if (typeof headerComponent.update === 'function') {
        headerComponent.update({
          isCollapsed: this.state.headerCollapsed,
          isMobile: this.state.isMobile,
        });
      }
    }
  }

  getElement() {
    return this.element;
  }

  destroy() {
    // Clean up event listeners
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('resize', this.handleResize);

    // Remove sticky icons if present
    if (this.stickyIcons) {
      const iconElement = this.stickyIcons.getElement();
      if (iconElement.parentNode) {
        iconElement.parentNode.removeChild(iconElement);
      }
    }
  }
}
