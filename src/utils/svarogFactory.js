// src/utils/svarogFactory.js

/**
 * Factory function to create Svarog UI components
 *
 * This handles different component patterns that may exist in Svarog UI
 */
export function createSvarogComponent(componentName, props, svarogUI) {
  if (!svarogUI) {
    throw new Error('Svarog UI library not provided');
  }

  const component = svarogUI[componentName];

  if (!component) {
    throw new Error(`Component "${componentName}" not found in Svarog UI`);
  }

  // Try different approaches to instantiate the component
  try {
    // Check what type of component we're dealing with
    console.log(`Creating component: ${componentName}`);

    // Approach 1: Component is a constructor function (class)
    if (
      typeof component === 'function' &&
      /^\s*class\s+/.test(component.toString())
    ) {
      return new component(props);
    }

    // Approach 2: Component is a factory function that returns an object
    if (typeof component === 'function') {
      return component(props);
    }

    // Approach 3: Component is an object with a create method
    if (
      typeof component === 'object' &&
      component !== null &&
      typeof component.create === 'function'
    ) {
      return component.create(props);
    }

    // Approach 4: Component has a default property that is a constructor or factory
    if (component.default) {
      if (typeof component.default === 'function') {
        if (/^\s*class\s+/.test(component.default.toString())) {
          return new component.default(props);
        }
        return component.default(props);
      }
    }

    throw new Error(
      `Cannot instantiate component "${componentName}": Unknown component structure`
    );
  } catch (error) {
    console.error(`Error creating component "${componentName}":`, error);
    throw error;
  }
}

/**
 * Create a wrapper for a component that may not have getElement method
 * @param {Object} component - Original component instance
 * @param {string} componentName - Name of the component for debugging
 * @returns {Object} - Component with getElement method
 */
export function createComponentWrapper(component, componentName) {
  if (!component) {
    throw new Error(
      `Cannot create wrapper for null component: ${componentName}`
    );
  }

  // If component already has getElement, return it
  if (typeof component.getElement === 'function') {
    return component;
  }

  // Create a wrapper that provides getElement
  return {
    _original: component,
    getElement: () => {
      // Try various properties that might contain the element
      if (component.element) {
        return component.element;
      }

      if (component.el) {
        return component.el;
      }

      if (component.dom) {
        return component.dom;
      }

      if (component.node) {
        return component.node;
      }

      // Try render method
      if (typeof component.render === 'function') {
        return component.render();
      }

      // Create fallback element
      console.warn(`Component ${componentName} has no identifiable element`);
      const fallback = document.createElement('div');
      fallback.className = `fallback-${componentName.toLowerCase()}`;
      fallback.innerHTML = `
        <div style="padding: 20px; border: 1px dashed #ccc; margin: 10px 0;">
          <strong>${componentName}</strong> (Fallback View)
        </div>
      `;
      return fallback;
    },
  };
}
