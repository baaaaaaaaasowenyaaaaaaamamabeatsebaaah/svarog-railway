// src/components/base/ComponentAdapter.js
import {
  createSvarogComponent,
  createComponentWrapper,
} from '../../utils/svarogFactory.js';

/**
 * Base adapter class for converting Storyblok components to Svarog UI components
 */
export default class ComponentAdapter {
  /**
   * Create a new component adapter
   * @param {Object} storyblokData - The Storyblok component data
   * @param {Object} options - Additional options
   */
  constructor(storyblokData, options = {}) {
    this.storyblokData = storyblokData || {};
    this.options = options;
    this.svarogComponent = null;
  }

  /**
   * Transform Storyblok data to Svarog component props
   * @returns {Object} - The transformed props
   */
  transformProps() {
    throw new Error('transformProps must be implemented by subclass');
  }

  /**
   * Get component name to create (used for overriding in subclasses)
   * @returns {string} - Component name
   */
  getComponentName() {
    // Default implementation gets component name from Storyblok data
    return this.storyblokData.component;
  }

  /**
   * Create a Svarog component instance
   * @param {Object} svarogComponents - The Svarog components
   * @returns {Object} - The Svarog component instance
   */
  createComponent(svarogComponents) {
    if (!svarogComponents) {
      throw new Error('svarogComponents is required');
    }

    const componentName = this.getComponentName();
    if (!componentName) {
      throw new Error('Component name is required');
    }

    try {
      // Transform Storyblok data to Svarog props
      const props = this.transformProps();

      // Create the component
      const component = createSvarogComponent(
        componentName,
        props,
        svarogComponents
      );

      // Create a wrapper if needed to provide getElement method
      this.svarogComponent = createComponentWrapper(component, componentName);

      return this.svarogComponent;
    } catch (error) {
      console.error(`Error creating component ${componentName}:`, error);
      throw error;
    }
  }

  /**
   * Get the DOM element for the component
   * @returns {HTMLElement} - The DOM element
   */
  getElement() {
    if (!this.svarogComponent) {
      throw new Error('Component has not been created yet');
    }

    return this.svarogComponent.getElement();
  }

  /**
   * Get asset URL from Storyblok asset object
   * @param {Object|string} asset - Storyblok asset object or URL string
   * @returns {string|null} - URL or null if not available
   */
  assetUrl(asset) {
    if (!asset) return null;

    // Handle different asset formats from Storyblok
    if (typeof asset === 'string') return asset;
    if (asset.filename) return asset.filename;
    if (asset.url) return asset.url;

    return null;
  }

  /**
   * Convert a Storyblok link to a URL
   * @param {Object} link - Storyblok link object
   * @returns {string} - URL
   */
  linkUrl(link) {
    if (!link) return '/';

    // Handle different link formats from Storyblok
    if (typeof link === 'string') return link;
    if (link.url) return link.url;
    if (link.cached_url) return `/${link.cached_url}`;
    if (link.story && link.story.url) return link.story.url;

    return '/';
  }
}
