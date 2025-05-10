// src/utils/storyblokHelper.js
/**
 * Simple helper to transform Storyblok data for header components
 */
export default class StoryblokHelper {
  /**
   * Transform header component props
   * @param {Object} props - Original header props
   * @returns {Object} - Transformed props
   */
  static transformHeaderProps(props) {
    // Make a copy to avoid modifying the original
    const transformedProps = { ...props };

    // Handle logo and compactLogo - extract filename from objects if they exist
    if (transformedProps.logo) {
      transformedProps.logo =
        transformedProps.logo.filename || transformedProps.logo;
    }

    if (transformedProps.compactLogo) {
      transformedProps.compactLogo =
        transformedProps.compactLogo.filename || transformedProps.compactLogo;
    }

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
}
