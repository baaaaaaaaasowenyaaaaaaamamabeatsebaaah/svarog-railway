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

    this.currentPath = window.location.pathname;

    // Bind methods
    this.handleNavigation = this.handleNavigation.bind(this);
    this.navigate = this.navigate.bind(this);

    // Initialize
    this.init();
  }

  init() {
    // Handle initial route
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

    // Handle initial route
    this.handleNavigation();
  }

  registerRoute(path, handler) {
    // Special case for the default route
    if (path === '/' || path === '*') {
      // Store default route handler separately
      this.defaultHandler = handler;
    } else {
      this.routes.set(path, handler);
    }
    return this;
  }

  // Update the handleNavigation method
  async handleNavigation() {
    const path = window.location.pathname;

    // Check if navigation allowed
    if (!this.beforeRoute(path, this.currentPath)) {
      return;
    }

    // Show loading state
    this.contentElement.innerHTML = this.loadingTemplate;

    // Find route handler
    let handler = this.routes.get(path);

    // If no specific handler is found, use the default handler
    if (!handler && this.defaultHandler) {
      handler = this.defaultHandler;
    }

    if (!handler) {
      console.error(`No handler for route: ${path}`);
      this.contentElement.innerHTML = this.errorTemplate;
      return;
    }

    try {
      // Execute route handler
      const content = await handler(path);

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
