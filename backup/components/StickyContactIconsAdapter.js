// src/components/contact/StickyContactIconsAdapter.js
import ComponentAdapter from '../base/ComponentAdapter.js';

/**
 * Adapter for StickyContactIcons component
 */
export class StickyContactIconsAdapter extends ComponentAdapter {
  /**
   * Get the component name to create
   * @returns {string} - Component name
   */
  getComponentName() {
    return 'StickyContactIcons';
  }

  /**
   * Transform Storyblok data to Svarog component props
   * @returns {Object} - The transformed props
   */
  transformProps() {
    const data = this.storyblokData;

    return {
      location: data.location || data.Location || '',
      phone: data.phone || data.Phone || '',
      email: data.email || data.Email || '',
      locationId: data.locationId || data.LocationId || 'location',
      className: '',
      // Optional callbacks
      onLocationClick: (event) => {
        // Scroll to the location section
        const locationElement = document.getElementById(
          data.locationId || data.LocationId || 'location'
        );
        if (locationElement) {
          locationElement.scrollIntoView({ behavior: 'smooth' });
          return false; // Prevent default
        }
        return true;
      },
      onPhoneClick: (event) => {
        // Track analytics before making the call
        console.log('Phone click tracked');
        return true; // Allow default behavior (tel: link)
      },
      onEmailClick: (event) => {
        // Track analytics before opening email client
        console.log('Email click tracked');
        return true; // Allow default behavior (mailto: link)
      },
      position: data.position || 'right', // 'right' or 'bottom'
      showTooltips: data.showTooltips !== false, // Default to true
    };
  }
}
