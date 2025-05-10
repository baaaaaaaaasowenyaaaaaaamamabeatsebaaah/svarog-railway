// src/app.js
import { initializeStoryblok } from './cms/storyblok.js';
import StoryblokIntegration from './cms/storyblok-integration.js';
import { i18n } from './utils/i18n.js';

/**
 * Main application class
 */
export default class App {
  constructor() {
    this.storyblokIntegration = new StoryblokIntegration();
    this.translations = {};
    this.currentPath = '/';
    this.mainContentElement = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the application
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Get app container
      const appElement = document.getElementById('app');

      // Show loading state
      appElement.innerHTML = `
      <div class="loading">
        <h2>Loading application...</h2>
      </div>
    `;

      // Initialize Storyblok
      try {
        initializeStoryblok();
        console.log('Storyblok initialized successfully');
      } catch (storyblokError) {
        console.warn('Storyblok initialization warning:', storyblokError);
        // Continue anyway as we have fallbacks
      }

      // Initialize component integration
      try {
        await this.storyblokIntegration.initialize();
        console.log('Component integration initialized successfully');
      } catch (integrationError) {
        console.error('Component integration error:', integrationError);
        // Show a warning but continue
        appElement.innerHTML += `
        <div class="warning" style="background: #fff3cd; color: #856404; padding: 10px; margin: 10px 0; border-radius: 4px;">
          <p>Some components may not display correctly. Please check the console for details.</p>
        </div>
      `;
      }

      // Apply theme
      try {
        await this.storyblokIntegration.applyTheme('muchandy-theme');
        console.log('Theme applied successfully');
      } catch (themeError) {
        console.warn('Theme application warning:', themeError);
        // Continue with default theme
      }

      // Try to load translations
      try {
        await this.loadTranslations();
        console.log('Translations loaded successfully');
      } catch (translationsError) {
        console.warn('Translations warning:', translationsError);
        // Continue with default translations
      }

      // Create app structure
      appElement.innerHTML = `
      <div class="app-container">
        <header id="app-header"></header>
        <main id="main-content"></main>
        <footer id="app-footer">
          <div class="container">
            <p>&copy; ${new Date().getFullYear()} Svarog UI</p>
          </div>
        </footer>
      </div>
    `;

      // Store reference to main content element
      this.mainContentElement = document.getElementById('main-content');

      // Load header with fallback
      try {
        await this.loadHeader();
        console.log('Header loaded successfully');
      } catch (headerError) {
        console.error('Header loading error:', headerError);
        // Create a basic header as fallback
        const headerContainer = document.getElementById('app-header');
        if (headerContainer) {
          headerContainer.innerHTML = `
          <div class="container default-header">
            <h1>Svarog UI</h1>
            <nav>
              <a href="/">Home</a>
              <a href="/about">About</a>
              <a href="/contact">Contact</a>
            </nav>
          </div>
        `;
        }
      }

      // Setup navigation
      this.setupNavigation();

      // Load initial content
      this.currentPath = window.location.pathname;
      try {
        await this.loadContent(this.currentPath);
        console.log('Initial content loaded successfully');
      } catch (contentError) {
        console.error('Content loading error:', contentError);
        // Show error message
        if (this.mainContentElement) {
          this.mainContentElement.innerHTML = `
          <div class="container">
            <div class="error">
              <h2>Error Loading Content</h2>
              <p>${contentError.message}</p>
              <button onclick="window.location.reload()">Retry</button>
            </div>
          </div>
        `;
        }
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize application:', error);

      // Show error state
      const appElement = document.getElementById('app');
      appElement.innerHTML = `
      <div class="error">
        <h2>${i18n.t('error_loading', {
          default: 'Error Loading Application',
        })}</h2>
        <p>${error.message}</p>
        <button onclick="window.location.reload()">${i18n.t('retry', {
          default: 'Retry',
        })}</button>
      </div>
    `;
    }
  }

  /**
   * Load translations
   * @returns {Promise<void>}
   */
  async loadTranslations() {
    try {
      const api = this.storyblokIntegration.api;
      const translations = await api.getTranslations('en');

      // Load translations into i18n
      i18n.load('en', translations);
      i18n.setLanguage('en');

      this.translations = translations;
    } catch (error) {
      console.warn('Error loading translations:', error);
      // Use default translations - handled in i18n
    }
  }

  /**
   * Load header
   * @returns {Promise<void>}
   */
  async loadHeader() {
    try {
      // Get header element
      const headerContainer = document.getElementById('app-header');
      if (!headerContainer) return;

      // Get header from Storyblok integration
      const headerElement = await this.storyblokIntegration.getHeader();

      if (headerElement) {
        headerContainer.appendChild(headerElement);
      } else {
        // Show fallback header
        headerContainer.innerHTML = `
          <div class="container default-header">
            <h1>${i18n.t('site_name', { default: 'Svarog UI' })}</h1>
            <nav>
              <a href="/">${i18n.t('home', { default: 'Home' })}</a>
              <a href="/about">${i18n.t('about', { default: 'About' })}</a>
              <a href="/contact">${i18n.t('contact', {
                default: 'Contact',
              })}</a>
            </nav>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error loading header:', error);
      // Show fallback header
      const headerContainer = document.getElementById('app-header');
      if (headerContainer) {
        headerContainer.innerHTML = `
          <div class="container default-header">
            <h1>Svarog UI</h1>
            <nav>
              <a href="/">Home</a>
              <a href="/about">About</a>
              <a href="/contact">Contact</a>
            </nav>
          </div>
        `;
      }
    }
  }

  /**
   * Setup navigation
   */
  setupNavigation() {
    // Handle link clicks for SPA behavior
    document.addEventListener('click', async (event) => {
      const link = event.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');

      // Skip external links, anchors, etc.
      if (
        !href ||
        href.startsWith('http') ||
        href.startsWith('#') ||
        href.startsWith('tel:') ||
        href.startsWith('mailto:')
      ) {
        return;
      }

      event.preventDefault();

      // Update URL without page reload
      window.history.pushState({}, '', href);

      // Load content for new path
      await this.loadContent(href);
    });

    // Handle browser back/forward
    window.addEventListener('popstate', async () => {
      await this.loadContent(window.location.pathname);
    });
  }

  /**
   * Load content for a specific path
   * @param {string} path - URL path
   * @returns {Promise<void>}
   */
  async loadContent(path) {
    if (!this.mainContentElement) return;

    try {
      // Show loading indicator
      this.mainContentElement.innerHTML = `
        <div class="container">
          <div class="loading">
            <h3>${i18n.t('loading', { default: 'Loading...' })}</h3>
          </div>
        </div>
      `;

      // Normalize path to slug
      const slug = path === '/' ? 'home' : path.replace(/^\//, '');

      // Get content blocks from Storyblok
      const contentBlocks = await this.storyblokIntegration.getContentBlocks(
        slug
      );

      // Clear previous content
      this.mainContentElement.innerHTML = '';

      // Create container
      const container = document.createElement('div');
      container.className = 'container';

      if (contentBlocks.length === 0) {
        // Show a message for empty content
        container.innerHTML = `
          <div class="content-not-found">
            <h2>${i18n.t('content_not_found', {
              default: 'Content Not Found',
            })}</h2>
            <p>${i18n.t('content_not_found_message', {
              default: `The page "${slug}" does not contain any content blocks.`,
            })}</p>
          </div>
        `;
      } else {
        // Append content blocks
        contentBlocks.forEach((element) => {
          container.appendChild(element);
        });
      }

      this.mainContentElement.appendChild(container);

      // Update current path
      this.currentPath = path;

      // Scroll to top
      window.scrollTo(0, 0);
    } catch (error) {
      console.error(`Error loading content for ${path}:`, error);

      // Show error message
      this.mainContentElement.innerHTML = `
        <div class="container">
          <div class="error">
            <h2>${i18n.t('error_loading', {
              default: 'Error Loading Content',
            })}</h2>
            <p>${error.message}</p>
            <button onclick="window.location.reload()">${i18n.t('retry', {
              default: 'Retry',
            })}</button>
          </div>
        </div>
      `;
    }
  }
}
