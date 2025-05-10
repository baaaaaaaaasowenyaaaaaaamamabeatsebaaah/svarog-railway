// src/utils/storyblokHelper.js
/**
 * Simple helper to transform and clean Storyblok data for Svarog components
 */
export default class StoryblokHelper {
  /**
   * Transform and validate props from Storyblok before passing to components
   * @param {string} componentName - Name of the component
   * @param {Object} props - Original props from Storyblok
   * @returns {Object} - Cleaned props
   */
  static transformProps(componentName, props) {
    // Make a copy to avoid modifying the original
    const cleanedProps = { ...props };

    // Remove component field which Storyblok adds
    delete cleanedProps.component;

    // Handle specific component transformations
    switch (componentName) {
      case 'Grid':
        return this.transformGridProps(cleanedProps);
      case 'Grid.Column':
        return this.transformGridColumnProps(cleanedProps);
      case 'CollapsibleHeader':
        return this.transformHeaderProps(cleanedProps);
      default:
        return cleanedProps;
    }
  }

  /**
   * Transform Grid component props
   * @param {Object} props - Original Grid props
   * @returns {Object} - Transformed props
   */
  static transformGridProps(props) {
    // Ensure alignItems and justifyItems are valid
    const validAlignments = ['start', 'end', 'center', 'stretch'];

    if (props.alignItems && !validAlignments.includes(props.alignItems)) {
      console.warn(
        `Invalid alignItems value: ${
          props.alignItems
        }. Must be one of: ${validAlignments.join(', ')}. Using default.`
      );
      delete props.alignItems;
    }

    if (props.justifyItems && !validAlignments.includes(props.justifyItems)) {
      console.warn(
        `Invalid justifyItems value: ${
          props.justifyItems
        }. Must be one of: ${validAlignments.join(', ')}. Using default.`
      );
      delete props.justifyItems;
    }

    // Ensure gap values are valid CSS values
    if (props.gap === '' || props.gap === null) {
      delete props.gap;
    }

    if (props.rowGap === '' || props.rowGap === null) {
      delete props.rowGap;
    }

    if (props.columnGap === '' || props.columnGap === null) {
      delete props.columnGap;
    }

    return props;
  }

  /**
   * Transform Grid.Column component props
   * @param {Object} props - Original Grid.Column props
   * @returns {Object} - Transformed props
   */
  static transformGridColumnProps(props) {
    // Convert width to a valid number between 1-12
    if (props.width !== undefined) {
      try {
        const width = parseInt(props.width, 10);
        if (isNaN(width) || width < 1 || width > 12) {
          console.warn(
            `Invalid width value: ${props.width}. Using default (12).`
          );
          props.width = 12;
        } else {
          props.width = width;
        }
      } catch (e) {
        console.warn(`Error parsing width: ${e.message}. Using default (12).`);
        props.width = 12;
      }
    }

    // Apply the same validation for other width properties
    [
      'mobileWidth',
      'tabletWidth',
      'desktopWidth',
      'offset',
      'desktopOffset',
    ].forEach((prop) => {
      if (props[prop] !== undefined) {
        try {
          const value = parseInt(props[prop], 10);
          if (isNaN(value) || value < 1 || value > 12) {
            console.warn(
              `Invalid ${prop} value: ${props[prop]}. Removing property.`
            );
            delete props[prop];
          } else {
            props[prop] = value;
          }
        } catch (e) {
          console.warn(
            `Error parsing ${prop}: ${e.message}. Removing property.`
          );
          delete props[prop];
        }
      }
    });

    return props;
  }

  /**
   * Transform header component props
   * @param {Object} props - Original header props
   * @returns {Object} - Transformed props
   */
  static transformHeaderProps(props) {
    // Make a copy to avoid modifying the original
    const transformedProps = { ...props };

    // Handle navigation structure
    if (transformedProps.navigation) {
      // If navigation is an array, flatten it and extract items
      if (Array.isArray(transformedProps.navigation)) {
        if (transformedProps.navigation.length > 0) {
          const firstNav = transformedProps.navigation[0];

          // If this item has items property, use that
          if (firstNav.items && Array.isArray(firstNav.items)) {
            transformedProps.navigation = {
              items: firstNav.items.map((item) => ({
                id:
                  item._uid ||
                  `nav-${Math.random().toString(36).substring(2, 9)}`,
                label: item.label || 'Untitled',
                href: item.href?.cached_url ? `/${item.href.cached_url}` : '/',
                disabled: !!item.disabled,
              })),
            };
          } else {
            // Default empty items array
            transformedProps.navigation = { items: [] };
          }
        } else {
          // Empty navigation array
          transformedProps.navigation = { items: [] };
        }
      }
      // If navigation doesn't have items property, add it
      else if (!transformedProps.navigation.items) {
        transformedProps.navigation.items = [];
      }
    } else {
      // No navigation at all, create empty structure
      transformedProps.navigation = { items: [] };
    }

    // Handle contact info
    if (transformedProps.contactInfo) {
      // If contactInfo is an array, use the first item
      if (
        Array.isArray(transformedProps.contactInfo) &&
        transformedProps.contactInfo.length > 0
      ) {
        transformedProps.contactInfo = transformedProps.contactInfo[0];
      }
    } else {
      // Default contact info
      transformedProps.contactInfo = {
        location: '',
        phone: '',
        email: '',
        locationId: 'location',
      };
    }

    // Set defaults for other properties
    transformedProps.siteName = transformedProps.siteName || '';
    transformedProps.callButtonText =
      transformedProps.callButtonText || 'Anrufen';

    return transformedProps;
  }

  /**
   * Process a complete Storyblok block and its children
   * @param {Object} block - Storyblok content block
   * @returns {Object} - Processed block with transformed props
   */
  static processBlock(block) {
    if (!block || !block.component) {
      return null;
    }

    const componentName = block.component;
    const props = this.transformProps(componentName, block);

    // Process nested blocks in the 'body' property
    if (props.body && Array.isArray(props.body)) {
      props.body = props.body.map((childBlock) =>
        this.processBlock(childBlock)
      );
    }

    // Handle special case for Grid columns
    if (
      componentName === 'Grid' &&
      props.columns &&
      Array.isArray(props.columns)
    ) {
      props.columns = props.columns.map((column) =>
        this.transformProps('Grid.Column', column)
      );
    }

    return {
      componentName,
      props,
    };
  }
}
