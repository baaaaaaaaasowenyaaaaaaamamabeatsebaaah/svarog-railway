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

    // Start with basic props
    const props = {
      siteName: content.siteName || content.SiteName || '',
      navigation: this.transformNavigation(
        content.navigation || content.Navigation
      ),
      contactInfo: this.transformContactInfo(
        content.contactInfo || content.ContactInfo
      ),
      logo: this.assetUrl(content.logo || content.Logo),
      compactLogo: this.assetUrl(content.compactLogo || content.CompactLogo),
      callButtonText:
        content.callButtonText || content.CallButtonText || 'Contact Us',
      className: '',
      isCollapsed: false, // Initial state, will be managed by container
      isMobile: false, // Initial state, will be managed by container
    };

    console.log('CollapsibleHeader props transformed:', props);
    return props;
  }

  /**
   * Transform navigation data
   * @param {Object} navigationData - Navigation data from Storyblok
   * @returns {Object} - Transformed navigation data
   */
  transformNavigation(navigationData) {
    if (!navigationData) {
      return { items: [] };
    }

    // If navigationData is already an object with items, use it
    if (navigationData.items) {
      return {
        items: Array.isArray(navigationData.items)
          ? navigationData.items.map(this.transformNavigationItem.bind(this))
          : [],
      };
    }

    // Otherwise, try to transform items if they exist
    const items = Array.isArray(navigationData)
      ? navigationData.map(this.transformNavigationItem.bind(this))
      : [];

    return { items };
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
      href: this.linkUrl(item.href || item.URL || '/'),
      disabled: !!item.disabled || !!item.Disabled,
    };

    // Process subitems if available
    if (Array.isArray(item.items) && item.items.length > 0) {
      navItem.items = item.items.map((subItem) =>
        this.transformSubNavigationItem(subItem)
      );
    }

    return navItem;
  }

  /**
   * Transform a sub-navigation item
   * @param {Object} subItem - Storyblok sub-navigation item
   * @returns {Object} - Transformed item
   */
  transformSubNavigationItem(subItem) {
    return {
      id:
        subItem._uid || `subnav-${Math.random().toString(36).substring(2, 9)}`,
      label: subItem.label || subItem.Label || 'Untitled',
      href: this.linkUrl(subItem.href || subItem.URL || '/'),
      disabled: !!subItem.disabled || !!subItem.Disabled,
    };
  }

  /**
   * Transform contact info data
   * @param {Object} contactData - Contact info from Storyblok
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
    // Look for the CollapsibleHeader component in different places
    const CollapsibleHeader =
      this.findCollapsibleHeaderComponent(svarogComponents);

    if (!CollapsibleHeader) {
      console.error('CollapsibleHeader component not found in Svarog UI');
      return this.createFallbackHeader(svarogComponents);
    }

    try {
      // Get collapse threshold from Storyblok data
      const collapseThreshold =
        this.storyblokData.collapseThreshold ||
        this.storyblokData.CollapseThreshold ||
        100;

      // Create a new HeaderContainer that will manage the state and events
      const headerContainer = new HeaderContainer({
        headerData: this.storyblokData,
        headerComponent: CollapsibleHeader,
        transformProps: this.transformProps.bind(this),
        collapseThreshold,
        svarogComponents,
      });

      return headerContainer;
    } catch (error) {
      console.error('Error creating CollapsibleHeader:', error);
      return this.createFallbackHeader(svarogComponents);
    }
  }

  /**
   * Find the CollapsibleHeader component in the Svarog components
   * @param {Object} svarogComponents - Svarog UI components
   * @returns {Function|null} - The CollapsibleHeader component or null if not found
   */
  findCollapsibleHeaderComponent(svarogComponents) {
    // Check if it's directly in the components object
    if (svarogComponents.CollapsibleHeader) {
      return svarogComponents.CollapsibleHeader;
    }

    // Look for it in different casing formats
    if (svarogComponents.collapsibleHeader) {
      return svarogComponents.collapsibleHeader;
    }

    // Import from the found path
    try {
      // Import from the path we have in the documents
      const collapsibleHeaderPath = './CollapsibleHeader/CollapsibleHeader.js';
      return svarogComponents[collapsibleHeaderPath] || null;
    } catch (error) {
      console.warn('Error importing CollapsibleHeader:', error);
      return null;
    }

    return null;
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
