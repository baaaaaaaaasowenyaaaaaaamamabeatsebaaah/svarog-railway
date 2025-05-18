// src/utils/storageHelper.js
export default class StorageHelper {
  constructor(storageType = 'local', prefix = 'svarog_') {
    this.storage = storageType === 'session' ? sessionStorage : localStorage;
    this.prefix = prefix;
    this.isAvailable = this.checkStorageAvailability();
  }

  /**
   * Check if storage is available
   * @returns {boolean} - Whether storage is available
   */
  checkStorageAvailability() {
    try {
      const testKey = `${this.prefix}test`;
      this.storage.setItem(testKey, 'test');
      this.storage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn('Storage not available:', e);
      return false;
    }
  }

  /**
   * Get a value from storage
   * @param {string} key - Key to get
   * @param {any} defaultValue - Default value if not found
   * @returns {any} - Stored value or default
   */
  get(key, defaultValue = null) {
    if (!this.isAvailable) return defaultValue;

    try {
      const item = this.storage.getItem(`${this.prefix}${key}`);
      return item !== null ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn(`Error getting ${key} from storage:`, e);
      return defaultValue;
    }
  }

  /**
   * Set a value in storage
   * @param {string} key - Key to set
   * @param {any} value - Value to store
   * @returns {boolean} - Success status
   */
  set(key, value) {
    if (!this.isAvailable) return false;

    try {
      this.storage.setItem(`${this.prefix}${key}`, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`Error setting ${key} in storage:`, e);
      return false;
    }
  }

  /**
   * Remove a value from storage
   * @param {string} key - Key to remove
   * @returns {boolean} - Success status
   */
  remove(key) {
    if (!this.isAvailable) return false;

    try {
      this.storage.removeItem(`${this.prefix}${key}`);
      return true;
    } catch (e) {
      console.warn(`Error removing ${key} from storage:`, e);
      return false;
    }
  }

  /**
   * Clear all values with this prefix
   * @returns {boolean} - Success status
   */
  clear() {
    if (!this.isAvailable) return false;

    try {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key.startsWith(this.prefix)) {
          this.storage.removeItem(key);
        }
      }
      return true;
    } catch (e) {
      console.warn('Error clearing storage:', e);
      return false;
    }
  }
}
