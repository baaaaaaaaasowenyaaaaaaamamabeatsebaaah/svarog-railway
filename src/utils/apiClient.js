// src/utils/apiClient.js
/**
 * Enhanced API client wrapper for Storyblok API
 * Adds better error handling, caching, and retry logic
 */
export default class ApiClient {
  constructor(baseClient) {
    this.client = baseClient;
    this.cache = new Map();
    this.retryConfig = {
      maxRetries: 2,
      initialDelay: 300,
      retryMultiplier: 2,
    };
    this.pendingRequests = new Map();
  }

  /**
   * Get story with retry and caching
   * @param {string} slug - Story slug
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - Story data
   */
  async getStory(slug, options = {}) {
    const cacheKey = `story:${slug}:${JSON.stringify(options)}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Check if this request is already in progress
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    // Create promise for this request
    const requestPromise = this._executeWithRetry(async () => {
      const response = await this.client.get(`cdn/stories/${slug}`, options);
      if (response && response.data && response.data.story) {
        return response.data.story;
      }
      throw new Error('Story not found in API response');
    }, `Story ${slug}`);

    // Store promise in pending requests
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      // Await the result
      const result = await requestPromise;

      // Cache successful result
      this.cache.set(cacheKey, result);

      // Remove from pending requests
      this.pendingRequests.delete(cacheKey);

      return result;
    } catch (error) {
      // Remove from pending requests on error
      this.pendingRequests.delete(cacheKey);
      throw error;
    }
  }

  /**
   * Get multiple stories with retry and caching
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} - Stories data
   */
  async getStories(options = {}) {
    const cacheKey = `stories:${JSON.stringify(options)}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Check if this request is already in progress
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    // Create promise for this request
    const requestPromise = this._executeWithRetry(async () => {
      const response = await this.client.get('cdn/stories', options);
      if (response && response.data && response.data.stories) {
        return response.data.stories;
      }
      return [];
    }, 'Stories list');

    // Store promise in pending requests
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      // Await the result
      const result = await requestPromise;

      // Cache successful result
      this.cache.set(cacheKey, result);

      // Remove from pending requests
      this.pendingRequests.delete(cacheKey);

      return result;
    } catch (error) {
      // Remove from pending requests on error
      this.pendingRequests.delete(cacheKey);
      throw error;
    }
  }

  /**
   * Execute a function with retry logic
   * @param {Function} fn - Function to execute
   * @param {string} operationName - Name of operation for logging
   * @returns {Promise<any>} - Function result
   */
  async _executeWithRetry(fn, operationName = 'API call') {
    let lastError;
    let delay = this.retryConfig.initialDelay;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(
            `Retrying ${operationName} (attempt ${attempt}/${this.retryConfig.maxRetries})...`
          );
        }

        return await fn();
      } catch (error) {
        console.warn(
          `Error in ${operationName} (attempt ${attempt}/${this.retryConfig.maxRetries}):`,
          error
        );
        lastError = error;

        if (attempt < this.retryConfig.maxRetries) {
          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= this.retryConfig.retryMultiplier;
        }
      }
    }

    throw lastError;
  }

  /**
   * Clear cache
   * @param {string} pattern - Optional pattern to clear specific entries
   */
  clearCache(pattern = null) {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get proxy method that forwards to original client
   * @param {string} method - Method name
   * @returns {Function} - Proxy method
   */
  _getProxyMethod(method) {
    return (...args) => this.client[method](...args);
  }

  /**
   * Proxy any missing methods to the underlying client
   * @param {string} methodName - Method name
   */
  get(path, params) {
    return this.client.get(path, params);
  }
}
