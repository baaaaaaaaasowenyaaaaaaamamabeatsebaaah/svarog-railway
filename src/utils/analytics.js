// src/utils/analytics.js
export default class Analytics {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.debug = options.debug === true;
    this.initialized = false;
    this.queue = [];

    if (this.enabled) {
      this.init();
    }
  }

  /**
   * Initialize analytics
   * @returns {Promise<void>}
   */
  async init() {
    if (this.initialized) return;

    try {
      // Track page view on init
      this.trackPageView();

      // Process any queued events
      this.processQueue();

      this.initialized = true;
      if (this.debug) console.log('Analytics initialized');
    } catch (error) {
      console.error('Error initializing analytics:', error);
    }
  }

  /**
   * Process queued events
   */
  processQueue() {
    while (this.queue.length > 0) {
      const [eventType, params] = this.queue.shift();
      this.track(eventType, params, true);
    }
  }

  /**
   * Track an event
   * @param {string} eventType - Event type
   * @param {Object} [params] - Event parameters
   * @param {boolean} [fromQueue] - Whether event is from queue
   */
  track(eventType, params = {}, fromQueue = false) {
    if (!this.enabled) return;

    if (!this.initialized && !fromQueue) {
      this.queue.push([eventType, params]);
      return;
    }

    if (this.debug) {
      console.log(`Analytics event: ${eventType}`, params);
    }

    // Simple implementation - just track locally
    // In a real implementation, you would send this to your analytics service

    // Track in console if debug is enabled
    if (this.debug) {
      console.log(
        `%cAnalytics: ${eventType}`,
        'color: purple; font-weight: bold',
        params
      );
    }
  }

  /**
   * Track a page view
   * @param {string} [path] - Page path (defaults to current path)
   * @param {string} [title] - Page title (defaults to document title)
   */
  trackPageView(path, title) {
    const currentPath = path || window.location.pathname;
    const currentTitle = title || document.title;

    this.track('page_view', {
      path: currentPath,
      title: currentTitle,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track an error
   * @param {Error|string} error - Error object or message
   * @param {Object} [context] - Additional context
   */
  trackError(error, context = {}) {
    const errorData = {
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : null,
      ...context,
      timestamp: new Date().toISOString(),
    };

    this.track('error', errorData);
  }

  /**
   * Track a user interaction
   * @param {string} action - User action
   * @param {string} category - Action category
   * @param {Object} [details] - Additional details
   */
  trackInteraction(action, category, details = {}) {
    this.track('interaction', {
      action,
      category,
      ...details,
      timestamp: new Date().toISOString(),
    });
  }
}
