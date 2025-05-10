// src/components/header/HeaderAdapter.js
import ComponentAdapter from '../base/ComponentAdapter.js';
import {
  createSvarogComponent,
  createComponentWrapper,
} from '../../utils/svarogFactory.js';

/**
 * Adapter for Header component
 */
export class HeaderAdapter extends ComponentAdapter {
  /**
   * Get the component name to create
   * @returns {string} - Component name
   */
  getComponentName() {
    // Try Header first, then CollapsibleHeader if available
    return 'Header';
  }

  /**
   * Transform Storyblok data to Svarog component props
   * @returns {Object} - The transformed props
   */
  transformProps() {
    const data = this.storyblokData;

    // Start with basic props
    const props = {
      siteName: data.siteName || data.SiteName || '',
      navigation: this.transformNavigation(data.navigation || data.Navigation),
      logo: this.assetUrl(data.logo || data.Logo),
      className: '',
    };

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
      return navigationData;
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

    return {
      id: item._uid || `nav-${Math.random().toString(36).substring(2, 9)}`,
      label: item.Label || item.label || 'Untitled',
      href: this.linkUrl(item.URL || item.href || '/'),
      disabled: !!item.disabled || !!item.Disabled,
    };
  }

  /**
   * Try to create a CollapsibleHeader if available, or fallback to Header
   * @param {Object} svarogComponents - Svarog UI components
   * @returns {Object} - Component instance
   */
  tryCollapsibleHeader(svarogComponents) {
    // Check if CollapsibleHeader is available
    if (svarogComponents.CollapsibleHeader) {
      try {
        const props = this.transformCollapsibleHeaderProps();
        const component = createSvarogComponent(
          'CollapsibleHeader',
          props,
          svarogComponents
        );
        return createComponentWrapper(component, 'CollapsibleHeader');
      } catch (error) {
        console.warn(
          'Error creating CollapsibleHeader, falling back to Header:',
          error
        );
      }
    }

    // Fallback to regular Header
    return this.createComponent(svarogComponents);
  }

  /**
   * Transform props specifically for CollapsibleHeader
   * @returns {Object} - CollapsibleHeader props
   */
  transformCollapsibleHeaderProps() {
    const data = this.storyblokData;
    const baseProps = this.transformProps();

    // Add CollapsibleHeader specific props
    return {
      ...baseProps,
      compactLogo: this.assetUrl(data.compactLogo || data.CompactLogo),
      contactInfo: this.transformContactInfo(
        data.contactInfo || data.ContactInfo
      ),
      callButtonText:
        data.callButtonText || data.CallButtonText || 'Contact Us',
      collapseThreshold:
        data.collapseThreshold || data.CollapseThreshold || 100,
      showStickyIcons: !!data.showStickyIcons || !!data.ShowStickyIcons,
      isCollapsed: false,
      isMobile: false,
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
}
