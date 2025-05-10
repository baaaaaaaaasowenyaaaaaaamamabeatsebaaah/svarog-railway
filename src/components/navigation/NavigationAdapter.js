// src/components/navigation/NavigationAdapter.js
import ComponentAdapter from '../base/ComponentAdapter.js';

/**
 * Adapter for Navigation component
 */
export class NavigationAdapter extends ComponentAdapter {
  /**
   * Get the component name to create
   * @returns {string} - Component name
   */
  getComponentName() {
    return 'Navigation';
  }

  /**
   * Transform Storyblok data to Svarog component props
   * @returns {Object} - The transformed props
   */
  transformProps() {
    const data = this.storyblokData;

    // Transform navigation items
    const items = Array.isArray(data.items)
      ? data.items.map((item) => this.transformNavigationItem(item))
      : [];

    return {
      items,
      responsive: true,
      activeId: null, // Will be set based on current page
      horizontal: true,
      expandable: true,
      className: '',
      burgerPosition: 'right',
      submenuShadow: true,
    };
  }

  /**
   * Transform a navigation item
   * @param {Object} item - Storyblok navigation item
   * @returns {Object} - Transformed item for Svarog
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
}
