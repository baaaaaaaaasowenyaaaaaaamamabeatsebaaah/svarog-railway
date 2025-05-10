// src/components/contact/ContactInfoAdapter.js
import ComponentAdapter from '../base/ComponentAdapter.js';

/**
 * Adapter for ContactInfo component
 */
export class ContactInfoAdapter extends ComponentAdapter {
  /**
   * Get the component name to create
   * @returns {string} - Component name
   */
  getComponentName() {
    return 'ContactInfo';
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
      // Event handlers will be set when the component is created
      onLocationClick: null,
      onPhoneClick: null,
      onEmailClick: null,
    };
  }

  /**
   * Create a ContactInfo component instance
   * @param {Object} svarogComponents - The Svarog components
   * @returns {Object} - The ContactInfo component
   */
  createComponent(svarogComponents) {
    const { ContactInfo } = svarogComponents;
    if (!ContactInfo) {
      throw new Error('ContactInfo component not found in Svarog UI');
    }

    const props = this.transformProps();

    // Add event handlers
    props.onLocationClick = (event) => {
      // Scroll to the location section
      const locationElement = document.getElementById(props.locationId);
      if (locationElement) {
        locationElement.scrollIntoView({ behavior: 'smooth' });
        return false; // Prevent default
      }
      return true;
    };

    props.onPhoneClick = (event) => {
      // Track analytics before making the call
      console.log('Phone click tracked');
      return true; // Allow default behavior (tel: link)
    };

    props.onEmailClick = (event) => {
      // Track analytics before opening email client
      console.log('Email click tracked');
      return true; // Allow default behavior (mailto: link)
    };

    // Create the component using the base method
    return super.createComponent(svarogComponents);
  }
}
