// src/utils/scriptLoader.js
export default class ScriptLoader {
  constructor() {
    this.loadedScripts = new Map();
  }

  /**
   * Load a script
   * @param {string} src - Script source URL
   * @param {Object} [options] - Additional options
   * @returns {Promise<HTMLScriptElement>} - Promise resolving to script element
   */
  loadScript(src, options = {}) {
    // If already loaded, return the same promise
    if (this.loadedScripts.has(src)) {
      return this.loadedScripts.get(src);
    }

    const scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = options.async !== false;

      if (options.id) script.id = options.id;
      if (options.defer) script.defer = true;
      if (options.crossOrigin) script.crossOrigin = options.crossOrigin;
      if (options.integrity) script.integrity = options.integrity;

      // Add any data attributes
      if (options.dataAttributes) {
        Object.entries(options.dataAttributes).forEach(([key, value]) => {
          script.dataset[key] = value;
        });
      }

      script.onload = () => resolve(script);
      script.onerror = (error) =>
        reject(new Error(`Failed to load script: ${src}`));

      document.head.appendChild(script);
    });

    this.loadedScripts.set(src, scriptPromise);
    return scriptPromise;
  }

  /**
   * Load multiple scripts in parallel
   * @param {Array<string|Object>} scripts - Array of script URLs or config objects
   * @returns {Promise<HTMLScriptElement[]>} - Promise resolving to array of script elements
   */
  loadScripts(scripts) {
    return Promise.all(
      scripts.map((script) => {
        if (typeof script === 'string') {
          return this.loadScript(script);
        } else {
          return this.loadScript(script.src, script);
        }
      })
    );
  }

  /**
   * Check if a script is loaded
   * @param {string} src - Script source URL
   * @returns {boolean} - Whether script is loaded
   */
  isLoaded(src) {
    return (
      this.loadedScripts.has(src) &&
      this.loadedScripts.get(src).status === 'fulfilled'
    );
  }
}
