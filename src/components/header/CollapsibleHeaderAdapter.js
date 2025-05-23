// src/components/header/CollapsibleHeaderAdapter.js
import ComponentAdapter from '../base/ComponentAdapter.js';
import HeaderContainer from './HeaderContainer.js';

/**
 * Adapter for CollapsibleHeader component
 */
export class CollapsibleHeaderAdapter extends ComponentAdapter {
  /**
   * Get the component name to create
   * @returns {string} - Component name
   */
  getComponentName() {
    return 'CollapsibleHeader';
  }

  /**
   * Transform Storyblok data to Svarog component props
   * @returns {Object} - The transformed props
   */
  transformProps() {
    const data = this.storyblokData || {};

    // Check if we have nested content (when data comes directly from Storyblok API)
    const content = data.content || data;

    // Process logo URLs correctly
    const logoUrl = this.assetUrl(content.logo || content.Logo);
    const compactLogoUrl = this.assetUrl(
      content.compactLogo || content.CompactLogo
    );

    // Transform navigation data with improved handling
    const navigationData = content.navigation || content.Navigation || [];
    const transformedNavigation = this.transformNavigation(navigationData);

    // Start with basic props
    const props = {
      siteName: content.siteName || content.SiteName || '',
      navigation: transformedNavigation,
      contactInfo: this.transformContactInfo(
        content.contactInfo || content.ContactInfo
      ),
      logo: logoUrl,
      compactLogo: compactLogoUrl,
      callButtonText:
        content.callButtonText || content.CallButtonText || 'Anrufen',
      className: '',
      isCollapsed: false, // Initial state, will be managed by container
      isMobile: false, // Initial state, will be managed by container
    };

    return props;
  }

  /**
   * Transform navigation data with advanced structure handling
   * @param {Object|Array} navigationData - Navigation data from Storyblok
   * @returns {Object} - Transformed navigation data with items array
   */
  transformNavigation(navigationData) {
    if (!navigationData) {
      return { items: [] }; // Return empty items array as default
    }

    // If navigationData is an array, extract items from the first element
    if (Array.isArray(navigationData) && navigationData.length > 0) {
      const firstNav = navigationData[0];

      // If this item has items property, use that
      if (firstNav.items && Array.isArray(firstNav.items)) {
        const transformedItems = firstNav.items
          .map((item) => this.transformNavigationItem(item))
          .filter(Boolean); // Filter out null items

        return { items: transformedItems };
      }
    }

    // If navigationData is an object with items property
    if (navigationData.items && Array.isArray(navigationData.items)) {
      const transformedItems = navigationData.items
        .map((item) => this.transformNavigationItem(item))
        .filter(Boolean);

      return { items: transformedItems };
    }

    // In other cases, return empty items array
    return { items: [] };
  }

  /**
   * Transform a navigation item
   * @param {Object} item - Navigation item from Storyblok
   * @returns {Object} - Transformed navigation item
   */
  transformNavigationItem(item) {
    if (!item) return null;

    // Base navigation item properties
    const navItem = {
      id: item._uid || `nav-${Math.random().toString(36).substring(2, 9)}`,
      label: item.label || item.Label || 'Untitled',
      href: this.linkUrl(item.href || item.url || item.URL || '/'),
      disabled: !!item.disabled || !!item.Disabled,
    };

    // Process subitems if available
    if (Array.isArray(item.items) && item.items.length > 0) {
      navItem.items = item.items
        .map((subItem) => this.transformNavigationItem(subItem))
        .filter(Boolean); // Filter out null items
    }

    return navItem;
  }

  /**
   * Transform contact info data
   * @param {Object|Array} contactData - Contact info from Storyblok
   * @returns {Object} - Transformed contact info
   */
  transformContactInfo(contactData) {
    if (!contactData) {
      return {
        location: '',
        phone: '',
        email: '',
        locationId: 'location',
      };
    }

    // Handle if contactData is an array (common in Storyblok)
    if (Array.isArray(contactData) && contactData.length > 0) {
      const firstContact = contactData[0];
      return {
        location: firstContact.location || firstContact.Location || '',
        phone: firstContact.phone || firstContact.Phone || '',
        email: firstContact.email || firstContact.Email || '',
        locationId:
          firstContact.locationId || firstContact.LocationId || 'location',
      };
    }

    return {
      location: contactData.location || contactData.Location || '',
      phone: contactData.phone || contactData.Phone || '',
      email: contactData.email || contactData.Email || '',
      locationId:
        contactData.locationId || contactData.LocationId || 'location',
    };
  }

  /**
   * Create a CollapsibleHeader with proper event handling and state management
   * @param {Object} svarogComponents - Svarog UI components
   * @returns {Object} - The CollapsibleHeader component with container
   */
  createComponent(svarogComponents) {
    const CollapsibleHeader = svarogComponents.CollapsibleHeader;

    if (!CollapsibleHeader) {
      console.error('CollapsibleHeader component not found in Svarog UI');
      console.log('Available components:', Object.keys(svarogComponents));
      return this.createFallbackHeader(svarogComponents);
    }

    try {
      // Get collapse threshold from Storyblok data
      const collapseThreshold = parseInt(
        this.storyblokData.collapseThreshold ||
          this.storyblokData.CollapseThreshold ||
          100,
        10
      );

      // Check if we should show sticky icons
      const showStickyIcons =
        this.storyblokData.showStickyIcons ||
        this.storyblokData.ShowStickyIcons ||
        false;

      // Create a HeaderContainer that will manage state for the CollapsibleHeader
      const headerContainer = new HeaderContainer({
        headerData: this.storyblokData,
        headerComponent: CollapsibleHeader,
        transformProps: this.transformProps.bind(this),
        collapseThreshold,
        svarogComponents,
        showStickyIcons,
      });

      return headerContainer;
    } catch (error) {
      console.error('Error creating CollapsibleHeader:', error);
      return this.createFallbackHeader(svarogComponents);
    }
  }

  /**
   * Create a fallback header when CollapsibleHeader is not available
   * @param {Object} svarogComponents - Svarog UI components
   * @returns {Object} - Fallback header
   */
  createFallbackHeader(svarogComponents) {
    // Try to use regular Header if available
    if (svarogComponents.Header) {
      const props = {
        siteName:
          this.storyblokData.siteName ||
          this.storyblokData.SiteName ||
          'Svarog UI',
        navigation: this.transformNavigation(
          this.storyblokData.navigation || this.storyblokData.Navigation
        ),
        logo: this.assetUrl(this.storyblokData.logo || this.storyblokData.Logo),
      };

      try {
        // Create Header component
        const headerComponent = new svarogComponents.Header(props);
        return headerComponent;
      } catch (headerError) {
        console.error('Error creating fallback Header:', headerError);
      }
    }

    // If Header fails, create a completely custom fallback
    return {
      getElement: () => {
        const element = document.createElement('header');
        element.className = 'fallback-header';
        element.style.padding = '20px';
        element.style.background = '#fff';
        element.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        element.style.position = 'sticky';
        element.style.top = '0';
        element.style.zIndex = '100';

        const container = document.createElement('div');
        container.className = 'container';
        container.style.display = 'flex';
        container.style.justifyContent = 'space-between';
        container.style.alignItems = 'center';

        const siteName =
          this.storyblokData.siteName ||
          this.storyblokData.SiteName ||
          'Svarog UI';

        container.innerHTML = `
          <div class="header-logo">
            <h1 style="margin: 0; font-size: 1.5rem; color: var(--theme-primary, #fd7e14);">
              ${siteName}
            </h1>
          </div>
          <nav class="header-nav">
            <a href="/" style="margin: 0 10px; text-decoration: none; color: var(--theme-text, #333);">Home</a>
            <a href="/about" style="margin: 0 10px; text-decoration: none; color: var(--theme-text, #333);">About</a>
            <a href="/contact" style="margin: 0 10px; text-decoration: none; color: var(--theme-text, #333);">Contact</a>
          </nav>
        `;

        element.appendChild(container);
        return element;
      },
    };
  }
}
