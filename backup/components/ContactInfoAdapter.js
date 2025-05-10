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
    };
  }

  /**
   * Create a ContactInfo component instance
   * @param {Object} svarogComponents - The Svarog components
   * @returns {Object} - The ContactInfo component
   */
  createComponent(svarogComponents) {
    // Try to find the component with different capitalizations
    const ContactInfo =
      svarogComponents.ContactInfo ||
      svarogComponents.Contactinfo ||
      svarogComponents.contactInfo ||
      svarogComponents.contactinfo;

    if (!ContactInfo) {
      console.warn('ContactInfo component not found in Svarog UI');
      console.log('Available components:', Object.keys(svarogComponents));
      return this.createFallbackContactInfo();
    }

    try {
      const props = this.transformProps();

      // Create a new instance of the ContactInfo component
      const contactInfoInstance = new ContactInfo(props);

      // Verify it has a getElement method
      if (typeof contactInfoInstance.getElement !== 'function') {
        console.error('ContactInfo instance does not have getElement method');
        return this.createFallbackContactInfo();
      }

      return contactInfoInstance;
    } catch (error) {
      console.error('Error creating ContactInfo component:', error);
      return this.createFallbackContactInfo();
    }
  }

  /**
   * Create a fallback ContactInfo component
   * @returns {Object} - Fallback component
   */
  createFallbackContactInfo() {
    const data = this.storyblokData;

    // Create a simple container element
    const element = document.createElement('div');
    element.className = 'fallback-contact-info';
    element.style.padding = '20px';
    element.style.margin = '20px 0';
    element.style.border = '1px solid #eee';
    element.style.borderRadius = '4px';
    element.style.background = '#f8f8f8';

    const location = data.location || data.Location || '';
    const phone = data.phone || data.Phone || '';
    const email = data.email || data.Email || '';

    element.innerHTML = `
      <h3 style="margin-top: 0; color: #fd7e14;">Contact Information</h3>
      <div style="margin-bottom: 10px;">
        <strong>Location:</strong> ${location}
      </div>
      <div style="margin-bottom: 10px;">
        <strong>Phone:</strong> <a href="tel:${phone}">${phone}</a>
      </div>
      <div>
        <strong>Email:</strong> <a href="mailto:${email}">${email}</a>
      </div>
    `;

    // Return a simple object with getElement method
    return {
      getElement: () => element,
    };
  }
}
