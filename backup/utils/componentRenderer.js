// src/utils/componentRenderer.js
/**
 * Simple component renderer for Storyblok components
 */
export default class ComponentRenderer {
  constructor(svarogComponents) {
    this.components = {};
    this.svarogComponents = svarogComponents || {};
  }

  /**
   * Register a component mapping
   * @param {string} storyblokName - Component name in Storyblok
   * @param {string} svarogName - Component name in Svarog
   * @param {Object} options - Component options
   */
  register(storyblokName, svarogName, options = {}) {
    this.components[storyblokName] = {
      component: svarogName,
      mapping: options.mapping || {},
      defaults: options.defaults || {},
    };
    return this;
  }

  /**
   * Render Storyblok blocks using Svarog components
   * @param {Array} blocks - Content blocks from Storyblok
   * @returns {Array} - Array of DOM elements
   */
  renderBlocks(blocks) {
    if (!blocks || !Array.isArray(blocks)) {
      return [];
    }

    return blocks.map((block) => this.renderBlock(block)).filter(Boolean);
  }

  /**
   * Render a single Storyblok block
   * @param {Object} block - Storyblok block data
   * @returns {HTMLElement} - DOM element
   */
  renderBlock(block) {
    if (!block || !block.component) {
      return null;
    }

    const mapping = this.components[block.component];
    if (!mapping) {
      console.warn(`No component mapping for "${block.component}"`);
      return null;
    }

    const SvarogComponent = this.svarogComponents[mapping.component];
    if (!SvarogComponent) {
      console.warn(`Svarog component "${mapping.component}" not found`);
      return null;
    }

    // Map Storyblok properties to Svarog component props
    const props = { ...mapping.defaults };

    Object.entries(block).forEach(([key, value]) => {
      if (key.startsWith('_')) return;

      const propName = mapping.mapping[key] || key;

      // Handle nested components
      if (Array.isArray(value) && value[0]?.component) {
        props[propName] = this.renderBlocks(value);
      } else {
        props[propName] = value;
      }
    });

    try {
      // Create Svarog component
      const component = new SvarogComponent(props);
      return component.getElement();
    } catch (error) {
      console.error(`Error creating ${mapping.component}:`, error);
      return null;
    }
  }
}

// Export factory function
export function createRenderer(components) {
  return new ComponentRenderer(components);
}
