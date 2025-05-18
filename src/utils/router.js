// src/utils/router.js
export default class Router {
  constructor(options = {}) {
    this.routes = new Map();
    this.contentElement =
      options.contentElement || document.getElementById('main-content');
    this.defaultRoute = options.defaultRoute || '/';
    this.beforeRoute = options.beforeRoute || (() => true);
    this.afterRoute = options.afterRoute || (() => {});
    this.loadingTemplate =
      options.loadingTemplate ||
      '<div class="loading-content">Loading...</div>';
    this.errorTemplate =
      options.errorTemplate ||
      '<div class="error-content">Error loading content</div>';

    this.defaultHandler = null;
    this.wildcardHandler = null;
    this.currentPath = window.location.pathname;
    this.initialized = false;
    this.navigationInProgress = false; // Add flag to track navigation status

    // Bind methods
    this.handleNavigation = this.handleNavigation.bind(this);
    this.navigate = this.navigate.bind(this);
  }

  init() {
    // Handle popstate events (browser back/forward)
    window.addEventListener('popstate', this.handleNavigation);

    // Intercept link clicks
    document.addEventListener('click', (event) => {
      // Only handle links
      const link = event.target.closest('a');
      if (!link) return;

      // Ignore external links or links with modifiers
      const url = new URL(link.href, window.location.origin);
      if (
        url.origin !== window.location.origin ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      )
        return;

      // Prevent default link behavior
      event.preventDefault();

      // Navigate to the link's href
      this.navigate(link.pathname);
    });

    this.initialized = true;

    // Only handle initial route if already initialized
    if (this.initialized) {
      this.handleNavigation();
    }
  }

  registerRoute(path, handler) {
    // Handle different route types correctly
    if (path === '/') {
      this.defaultHandler = handler;
    } else if (path === '*') {
      this.wildcardHandler = handler;
    } else {
      this.routes.set(path, handler);
    }
    return this;
  }

  async handleNavigation() {
    // Prevent concurrent navigation
    if (this.navigationInProgress) {
      console.log('Navigation already in progress, ignoring request');
      return;
    }

    this.navigationInProgress = true;

    try {
      const path = window.location.pathname;

      // Check if navigation allowed
      if (!this.beforeRoute(path, this.currentPath)) {
        this.navigationInProgress = false;
        return;
      }

      // Show loading state
      this.contentElement.innerHTML = this.loadingTemplate;

      let handler = null;

      // Try to find a specific route handler first
      if (this.routes.has(path)) {
        handler = this.routes.get(path);
      }
      // For root path, use the default handler if available
      else if (path === '/' && this.defaultHandler) {
        handler = this.defaultHandler;
      }
      // For any other path, use the wildcard handler if available
      else if (this.wildcardHandler) {
        handler = this.wildcardHandler;
      }

      if (!handler) {
        console.error(`No handler for route: ${path}`);
        this.contentElement.innerHTML = this.errorTemplate;
        this.navigationInProgress = false;
        return;
      }

      // Execute route handler with the current path
      const content = await handler(path);

      // Check if navigation was canceled or changed during content loading
      if (path !== window.location.pathname) {
        console.log(
          'Navigation changed during content loading, aborting update'
        );
        this.navigationInProgress = false;
        return;
      }

      // Update content
      if (typeof content === 'string') {
        this.contentElement.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        this.contentElement.innerHTML = '';
        this.contentElement.appendChild(content);
      } else {
        throw new Error('Route handler must return string or HTMLElement');
      }

      // Update current path
      this.currentPath = path;

      // Scroll to top of content
      this.contentElement.scrollTop = 0;
      window.scrollTo(0, 0);

      // Execute after route callback
      this.afterRoute(path, this.currentPath);
    } catch (error) {
      console.error('Error loading route:', error);
      this.contentElement.innerHTML =
        this.errorTemplate + `<p>${error.message}</p>`;
    } finally {
      // Make sure to always reset the flag
      this.navigationInProgress = false;
    }
  }

  navigate(path) {
    if (path === this.currentPath) return;

    // Update URL
    window.history.pushState({}, '', path);

    // Handle navigation
    this.handleNavigation();
  }
}
