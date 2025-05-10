// src/components/registry.js
import { CollapsibleHeaderAdapter } from './header/CollapsibleHeaderAdapter.js';
import { HeaderAdapter } from './header/HeaderAdapter.js';
import { ContactInfoAdapter } from './contact/ContactInfoAdapter.js';
import { StickyContactIconsAdapter } from './contact/StickyContactIconsAdapter.js';
import { NavigationAdapter } from './navigation/NavigationAdapter.js';
import { TeaserAdapter } from './content/TeaserAdapter.js';
import { GridAdapter } from './layout/GridAdapter.js';
import { SectionAdapter } from './layout/SectionAdapter.js';

/**
 * Component Registry for managing Storyblok to Svarog component mappings
 */
export default class ComponentRegistry {
  constructor(svarogComponents) {
    this.svarogComponents = svarogComponents || {};
    this.adapters = this.registerAdapters();
    this.componentCache = new Map();

    // Log available components
    console.log(
      'Components available to registry:',
      Object.keys(this.svarogComponents)
    );
  }

  /**
   * Register component adapters
   * @returns {Object} - Map of Storyblok component names to adapter classes
   */
  registerAdapters() {
    return {
      // Header components
      Header: HeaderAdapter,
      CollapsibleHeader: CollapsibleHeaderAdapter,

      // Contact components
      ContactInfo: ContactInfoAdapter,
      StickyContactIcons: StickyContactIconsAdapter,

      // Navigation components
      Navigation: NavigationAdapter,

      // Content components
      teaser: TeaserAdapter,
      Teaser: TeaserAdapter,

      // Layout components
      grid: GridAdapter,
      Grid: GridAdapter,

      // Section component - Ensure both capitalizations are registered
      section: SectionAdapter,
      Section: SectionAdapter,
    };
  }

  /**
   * Get an adapter for a Storyblok component
   * @param {string} componentName - Storyblok component name
   * @returns {Class} - Adapter class
   */
  getAdapter(componentName) {
    const adapter = this.adapters[componentName];
    if (!adapter) {
      console.warn(`No adapter found for component type: ${componentName}`);
    }
    return adapter;
  }

  /**
   * Create a fallback component
   * @param {Object} data - Component data
   * @returns {Object} - Simple component with getElement method
   */
  createFallbackComponent(data) {
    const componentType = data.component || 'Unknown';

    // Create a simple container element
    const element = document.createElement('div');
    element.className = `fallback-component fallback-${componentType.toLowerCase()}`;

    // Add some basic styling
    element.style.padding = '20px';
    element.style.margin = '20px 0';
    element.style.border = '2px dashed #ccc';
    element.style.borderRadius = '4px';
    element.style.background = '#f8f8f8';

    // Add component info
    let title =
      data.title || data.headline || data.name || data.label || componentType;
    element.innerHTML = `
      <div style="margin-bottom: 10px; color: #666;">
        <strong>${componentType} Component</strong> (Fallback View)
      </div>
      <h3 style="margin-top: 0; color: #fd7e14;">${title}</h3>
    `;

    // Add basic content if available
    if (data.content || data.text || data.description || data.subheadline) {
      const content = document.createElement('p');
      content.textContent =
        data.content || data.text || data.description || data.subheadline || '';
      element.appendChild(content);
    }

    // Return an object with getElement method
    return {
      getElement: () => element,
    };
  }

  /**
   * Create a component from Storyblok data
   * @param {Object} storyblokData - Storyblok component data
   * @param {Object} options - Additional options
   * @returns {Object} - Svarog component instance or fallback
   */
  createComponent(storyblokData, options = {}) {
    if (!storyblokData || !storyblokData.component) {
      console.warn('Invalid component data:', storyblokData);
      return null;
    }

    const componentType = storyblokData.component;
    const AdapterClass = this.getAdapter(componentType);

    if (!AdapterClass) {
      console.warn(`No adapter found for component type: ${componentType}`);
      return this.createFallbackComponent(storyblokData);
    }

    try {
      // Check cache first (using component _uid as key)
      const cacheKey = storyblokData._uid;
      if (cacheKey && this.componentCache.has(cacheKey)) {
        return this.componentCache.get(cacheKey);
      }

      // Add registry to options for nested component creation
      const adapterOptions = {
        ...options,
        registry: this,
      };

      // Create adapter instance
      const adapter = new AdapterClass(storyblokData, adapterOptions);

      // Handle special case for CollapsibleHeader which might need special handling
      if (
        componentType === 'CollapsibleHeader' &&
        typeof adapter.tryCollapsibleHeader === 'function'
      ) {
        try {
          const component = adapter.tryCollapsibleHeader(this.svarogComponents);

          // Cache if it has a unique ID
          if (cacheKey) {
            this.componentCache.set(cacheKey, component);
          }

          return component;
        } catch (error) {
          console.error(
            'Error with CollapsibleHeader special handling:',
            error
          );
          // Fall through to regular component creation
        }
      }

      // Regular component creation
      const component = adapter.createComponent(this.svarogComponents);

      // Cache if it has a unique ID
      if (cacheKey) {
        this.componentCache.set(cacheKey, component);
      }

      return component;
    } catch (error) {
      console.error(`Error creating ${componentType}:`, error);
      return this.createFallbackComponent(storyblokData);
    }
  }

  /**
   * Get element for a component
   * @param {Object} storyblokData - Storyblok component data
   * @param {Object} options - Additional options
   * @returns {Promise<HTMLElement>} - DOM element or null if component creation failed
   */
  async getComponentElement(storyblokData, options = {}) {
    try {
      if (!storyblokData) {
        console.warn('Missing component data');
        return createFallbackElement('Unknown', {
          error: 'Missing component data',
        });
      }

      if (!storyblokData.component) {
        console.warn('Component type not specified in data:', storyblokData);

        // Try to determine component type from the data structure
        if (storyblokData.navigation && storyblokData.siteName) {
          console.log('Data looks like a header, using CollapsibleHeader');
          storyblokData.component = 'CollapsibleHeader';
        } else if (
          storyblokData.location &&
          storyblokData.phone &&
          storyblokData.email
        ) {
          console.log('Data looks like contact info, using ContactInfo');
          storyblokData.component = 'ContactInfo';
        } else if (storyblokData.items && Array.isArray(storyblokData.items)) {
          console.log('Data looks like navigation, using Navigation');
          storyblokData.component = 'Navigation';
        } else if (storyblokData.title || storyblokData.content) {
          console.log('Data looks like a section, using Section');
          storyblokData.component = 'Section';
        } else {
          // If we can't determine the type, create a fallback
          return createFallbackElement('Unknown', {
            error: 'Component type not specified',
            data: storyblokData,
          });
        }
      }

      const component = this.createComponent(storyblokData, options);

      if (!component) {
        console.warn(`Failed to create component: ${storyblokData.component}`);
        return createFallbackElement(storyblokData.component, storyblokData);
      }

      try {
        // Handle components with special async initialization
        if (
          component.addColumns &&
          typeof component.addColumns === 'function'
        ) {
          await component.addColumns();
        }

        if (
          component.processBodyContent &&
          typeof component.processBodyContent === 'function'
        ) {
          await component.processBodyContent();
        }

        // Get the element from the component
        if (typeof component.getElement !== 'function') {
          console.error(
            `Component ${storyblokData.component} does not have getElement method`
          );
          return createFallbackElement(storyblokData.component, storyblokData);
        }

        const element = component.getElement();

        if (!element || !(element instanceof HTMLElement)) {
          console.error(
            `Invalid element from component ${storyblokData.component}`
          );
          return createFallbackElement(storyblokData.component, storyblokData);
        }

        return element;
      } catch (elementError) {
        console.error(
          `Error getting element for ${storyblokData.component}:`,
          elementError
        );
        return createFallbackElement(storyblokData.component, storyblokData);
      }
    } catch (error) {
      console.error(
        `Error in getComponentElement for ${storyblokData?.component}:`,
        error
      );
      return createFallbackElement(
        storyblokData?.component || 'Unknown',
        storyblokData
      );
    }
  }

  /**
   * Clear component cache
   */
  clearCache() {
    this.componentCache.clear();
  }
}

/**
 * Create a fallback element for when component creation fails
 * @param {string} componentType - Type of component
 * @param {Object} data - Component data
 * @returns {HTMLElement} - Fallback element
 */
function createFallbackElement(componentType, data) {
  const element = document.createElement('div');
  element.className = `fallback-component fallback-${componentType.toLowerCase()}`;
  element.style.padding = '15px';
  element.style.margin = '10px 0';
  element.style.border = '2px dashed #ccc';
  element.style.borderRadius = '4px';
  element.style.background = '#f8f8f8';

  const title =
    data.title || data.headline || data.name || data.label || componentType;

  element.innerHTML = `
    <div style="margin-bottom: 10px; color: #666;">
      <strong>${componentType} Component</strong> (Fallback View)
    </div>
    <h3 style="margin-top: 0; color: #fd7e14;">${title}</h3>
  `;

  // Add basic content if available
  if (data.content || data.text || data.description || data.subheadline) {
    const content = document.createElement('p');
    content.textContent =
      data.content || data.text || data.description || data.subheadline || '';
    element.appendChild(content);
  }

  if (data.error) {
    const errorMsg = document.createElement('p');
    errorMsg.style.color = '#dc3545';
    errorMsg.textContent = `Error: ${data.error}`;
    element.appendChild(errorMsg);
  }

  return element;
}
