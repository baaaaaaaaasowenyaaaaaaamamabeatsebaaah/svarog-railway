// src/components/content/ContentBlockRenderer.js
import { createComponentWrapper } from '../../utils/svarogFactory.js';

/**
 * Component for rendering content blocks with better error handling and loading states
 */
export default class ContentBlockRenderer {
  constructor(registry) {
    this.registry = registry;
  }

  /**
   * Render multiple content blocks
   * @param {Array} blocks - Content blocks to render
   * @param {HTMLElement} container - Container element
   * @returns {Promise<void>}
   */
  async renderBlocks(blocks, container) {
    if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
      this.renderEmptyState(container);
      return;
    }

    // Clear container if needed
    if (container.innerHTML !== '') {
      container.innerHTML = '';
    }

    // Add loading indicator
    const loadingElement = this.createLoadingElement();
    container.appendChild(loadingElement);

    // Process each block
    const elements = [];
    const errors = [];

    for (const block of blocks) {
      try {
        const element = await this.registry.getComponentElement(block);
        if (element) {
          elements.push(element);
        }
      } catch (error) {
        console.error(`Error rendering block ${block.component}:`, error);
        errors.push({
          block,
          error,
        });
      }
    }

    // Remove loading indicator
    container.removeChild(loadingElement);

    // Add successfully rendered elements
    for (const element of elements) {
      container.appendChild(element);
    }

    // Add error elements if any
    if (errors.length > 0) {
      const errorContainer = document.createElement('div');
      errorContainer.className = 'content-errors';
      errorContainer.style.margin = '20px 0';

      for (const { block, error } of errors) {
        const errorElement = this.createErrorElement(block, error);
        errorContainer.appendChild(errorElement);
      }

      container.appendChild(errorContainer);
    }
  }

  /**
   * Render empty state
   * @param {HTMLElement} container - Container element
   */
  renderEmptyState(container) {
    container.innerHTML = '';

    const emptyElement = document.createElement('div');
    emptyElement.className = 'content-empty';
    emptyElement.style.padding = '30px';
    emptyElement.style.margin = '20px 0';
    emptyElement.style.textAlign = 'center';
    emptyElement.style.backgroundColor = '#f8f8f8';
    emptyElement.style.borderRadius = '4px';

    emptyElement.innerHTML = `
      <h3 style="margin-top: 0; color: #666;">No Content</h3>
      <p>There are no content blocks available for this page.</p>
    `;

    container.appendChild(emptyElement);
  }

  /**
   * Create loading element
   * @returns {HTMLElement} - Loading element
   */
  createLoadingElement() {
    const element = document.createElement('div');
    element.className = 'content-loading';
    element.style.padding = '20px';
    element.style.margin = '20px 0';
    element.style.textAlign = 'center';

    element.innerHTML = `
      <div class="loading-spinner" style="display: inline-block; width: 40px; height: 40px; border: 4px solid rgba(0, 0, 0, 0.1); border-radius: 50%; border-top-color: var(--theme-primary, #0066cc); animation: spin 1s ease-in-out infinite;"></div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
      <p>Loading content...</p>
    `;

    return element;
  }

  /**
   * Create error element for a block
   * @param {Object} block - Content block
   * @param {Error} error - Error object
   * @returns {HTMLElement} - Error element
   */
  createErrorElement(block, error) {
    const element = document.createElement('div');
    element.className = 'content-error';
    element.style.padding = '15px';
    element.style.margin = '10px 0';
    element.style.backgroundColor = '#f8d7da';
    element.style.color = '#721c24';
    element.style.borderRadius = '4px';
    element.style.border = '1px solid #f5c6cb';

    const componentName = block?.component || 'Unknown';
    const componentId = block?._uid || 'unknown-id';

    element.innerHTML = `
      <h4 style="margin-top: 0;">Error rendering ${componentName}</h4>
      <p>${error.message}</p>
      <details>
        <summary>Component details</summary>
        <pre style="margin: 10px 0; padding: 10px; background: rgba(0,0,0,0.05); overflow: auto;">${JSON.stringify(
          block,
          null,
          2
        )}</pre>
      </details>
    `;

    return element;
  }

  /**
   * Create a wrapper component
   * @param {Function} render - Render function
   * @returns {Object} - Component with getElement method
   */
  createComponent(render) {
    const component = {
      render,
    };

    return createComponentWrapper(component, 'ContentBlockRenderer');
  }
}
