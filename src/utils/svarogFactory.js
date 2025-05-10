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
    // Log component creation for debugging
    console.log(`Creating component: ${componentName}`);

    // Log component structure for debugging
    logComponentStructure(component, componentName);

    let instance = null;

    // Approach 1: Component is a constructor function (class)
    if (typeof component === 'function') {
      try {
        // Create a new instance
        instance = new component(props);

        // Check if the instance has getElement method
        if (typeof instance.getElement !== 'function') {
          return createComponentWrapper(instance, componentName);
        }

        return instance;
      } catch (error) {
        console.warn(
          `Error instantiating ${componentName} as a constructor:`,
          error
        );

        // Try as a factory function instead
        try {
          const result = component(props);

          if (result && typeof result.getElement === 'function') {
            return result;
          }

          return createComponentWrapper(result, componentName);
        } catch (factoryError) {
          console.error(
            `Error using ${componentName} as a factory:`,
            factoryError
          );
          throw error; // Throw the original error if both approaches fail
        }
      }
    }

    // Approach 2: Component is an object with a create method
    if (
      typeof component === 'object' &&
      component !== null &&
      typeof component.create === 'function'
    ) {
      try {
        instance = component.create(props);

        if (typeof instance.getElement !== 'function') {
          return createComponentWrapper(instance, componentName);
        }

        return instance;
      } catch (error) {
        console.error(`Error using ${componentName}.create:`, error);
        throw error;
      }
    }

    // Approach 3: Component has a default property that is a constructor or factory
    if (component.default) {
      if (typeof component.default === 'function') {
        try {
          instance = new component.default(props);

          if (typeof instance.getElement !== 'function') {
            return createComponentWrapper(instance, componentName);
          }

          return instance;
        } catch (error) {
          console.warn(
            `Error instantiating ${componentName}.default as a constructor:`,
            error
          );

          try {
            const result = component.default(props);

            if (result && typeof result.getElement === 'function') {
              return result;
            }

            return createComponentWrapper(result, componentName);
          } catch (factoryError) {
            console.error(
              `Error using ${componentName}.default as a factory:`,
              factoryError
            );
            throw error;
          }
        }
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
    console.log(`Component ${componentName} already has getElement method`);
    return component;
  }

  // Create a wrapper object with getElement method
  const wrapper = {
    _original: component,
    _componentName: componentName,

    getElement() {
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
        try {
          const rendered = component.render();
          if (rendered instanceof HTMLElement) {
            return rendered;
          }
        } catch (error) {
          console.warn(
            `Error calling render method for ${componentName}:`,
            error
          );
        }
      }

      // Create fallback element if all else fails
      console.warn(
        `Component ${componentName} has no identifiable element, creating fallback`
      );
      const fallback = document.createElement('div');
      fallback.className = `fallback-${componentName.toLowerCase()}`;
      fallback.style.padding = '15px';
      fallback.style.margin = '10px 0';
      fallback.style.border = '2px dashed #ccc';
      fallback.style.borderRadius = '4px';
      fallback.style.background = '#f8f8f8';

      fallback.innerHTML = `
        <div style="margin-bottom: 10px; color: #666;">
          <strong>${componentName}</strong> (Fallback View)
        </div>
        <p>Unable to get element from component.</p>
      `;
      return fallback;
    },
  };

  // Copy all methods from original component to wrapper
  if (component) {
    Object.getOwnPropertyNames(component).forEach((prop) => {
      if (typeof component[prop] === 'function' && !wrapper[prop]) {
        wrapper[prop] = component[prop].bind(component);
      }
    });

    // Copy methods from prototype if available
    const proto = Object.getPrototypeOf(component);
    if (proto && proto !== Object.prototype) {
      Object.getOwnPropertyNames(proto).forEach((prop) => {
        if (
          typeof proto[prop] === 'function' &&
          prop !== 'constructor' &&
          !wrapper[prop]
        ) {
          wrapper[prop] = proto[prop].bind(component);
        }
      });
    }
  }

  console.log(`Created wrapper for ${componentName} with getElement method`);
  return wrapper;
}

/**
 * Log the structure of a component for debugging
 * @param {any} component - The component to analyze
 * @param {string} name - The name of the component
 */
function logComponentStructure(component, name) {
  console.group(`Component Structure: ${name}`);

  console.log('Type:', typeof component);

  if (typeof component === 'function') {
    console.log('Function name:', component.name);
    console.log('Is ES6 class:', /^\s*class\s+/.test(component.toString()));
    console.log(
      'Prototype methods:',
      Object.getOwnPropertyNames(component.prototype || {})
    );
  }

  if (typeof component === 'object' && component !== null) {
    console.log('Has create method:', typeof component.create === 'function');
    console.log('Has default property:', component.default !== undefined);
    console.log('Properties:', Object.keys(component));
  }

  console.groupEnd();
}
