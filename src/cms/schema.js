// src/cms/schema.js
/**
 * Schema definitions for Storyblok components
 */
export const componentSchemas = {
  CollapsibleHeader: {
    required: ['siteName'],
    properties: {
      siteName: { type: 'string' },
      navigation: { type: 'object' },
      contactInfo: { type: 'object' },
      logo: { type: ['string', 'object'] },
      compactLogo: { type: ['string', 'object'] },
      collapseThreshold: { type: 'number' },
      callButtonText: { type: 'string' },
      showStickyIcons: { type: 'boolean' },
    },
  },
  ContactInfo: {
    required: ['location', 'phone', 'email'],
    properties: {
      location: { type: 'string' },
      phone: { type: 'string' },
      email: { type: 'string' },
      locationId: { type: 'string' },
    },
  },
  Navigation: {
    required: ['items'],
    properties: {
      items: { type: 'array' },
    },
  },
  NavigationItem: {
    required: ['label', 'href'],
    properties: {
      label: { type: 'string' },
      href: { type: ['string', 'object'] },
      items: { type: 'array' },
      disabled: { type: 'boolean' },
    },
  },
  SubNavigationItem: {
    required: ['Label', 'URL'],
    properties: {
      Label: { type: 'string' },
      URL: { type: ['string', 'object'] },
    },
  },
};

/**
 * Validate Storyblok component data against schema
 * @param {Object} data - Component data
 * @param {string} componentType - Component type
 * @returns {boolean} - Whether data is valid
 */
export function validateComponentData(data, componentType) {
  if (!data) {
    console.error('No data provided for validation');
    return false;
  }

  if (!componentType) {
    componentType = data.component;
  }

  if (!componentType) {
    console.error('No component type provided for validation');
    return false;
  }

  const schema = componentSchemas[componentType];
  if (!schema) {
    // No schema defined, assume valid
    return true;
  }

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (data[field] === undefined) {
        console.warn(`Required field ${field} missing in ${componentType}`);
        return false;
      }
    }
  }

  // Check property types
  if (schema.properties) {
    for (const [prop, definition] of Object.entries(schema.properties)) {
      if (data[prop] !== undefined) {
        const value = data[prop];
        const expectedTypes = Array.isArray(definition.type)
          ? definition.type
          : [definition.type];

        const valueType = Array.isArray(value) ? 'array' : typeof value;
        if (!expectedTypes.includes(valueType)) {
          console.warn(
            `Property ${prop} in ${componentType} has incorrect type. ` +
              `Expected ${expectedTypes.join(' or ')}, got ${valueType}`
          );
          return false;
        }
      }
    }
  }

  return true;
}
