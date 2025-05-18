// src/utils/contentCache.js
export default class ContentCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.maxAge = options.maxAge || 5 * 60 * 1000; // 5 minutes by default
    this.enabled = options.enabled !== false;
  }

  /**
   * Get an item from cache
   * @param {string} key - Cache key
   * @returns {any|null} - Cached item or null if not found/expired
   */
  get(key) {
    if (!this.enabled) return null;

    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Set an item in cache
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} [ttl] - Custom time-to-live in ms
   */
  set(key, data, ttl) {
    if (!this.enabled) return;

    const expires = Date.now() + (ttl || this.maxAge);
    this.cache.set(key, { data, expires });
  }

  /**
   * Clear the entire cache or a specific item
   * @param {string} [key] - Optional key to clear specific item
   */
  clear(key) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}
