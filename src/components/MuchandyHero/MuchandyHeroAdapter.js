// src/components/MuchandyHero/MuchandyHeroAdapter.js
import ComponentAdapter from '../base/ComponentAdapter.js';
import MuchandyHero from './MuchandyHero.js';

export class MuchandyHeroAdapter extends ComponentAdapter {
  getComponentName() {
    return 'MuchandyHero';
  }

  transformProps() {
    const data = this.storyblokData || {};
    const content = data.content || data;

    return {
      backgroundImage:
        this.assetUrl(content.backgroundImage) ||
        'https://picsum.photos/1920/1080',
      title: content.title || 'Finden Sie<br>Ihren Preis',
      subtitle: content.subtitle || 'Jetzt Preis berechnen.',
      className: content.className || '',
      defaultTab: content.defaultTab || 'repair',
      // Note: repairForm and buybackForm will be added in createComponent
    };
  }

  createComponent(svarogComponents) {
    if (!svarogComponents) {
      throw new Error('svarogComponents is required');
    }

    // Get the MuchandyHero component
    const MuchandyHeroComponent = svarogComponents.MuchandyHero || MuchandyHero;

    if (!MuchandyHeroComponent) {
      throw new Error('MuchandyHero component not found');
    }

    try {
      // Create mock forms or real service forms
      const forms = this.createFormComponents(svarogComponents);

      // Transform Storyblok data to Svarog props and add forms
      const props = {
        ...this.transformProps(),
        repairForm: forms.repairForm,
        buybackForm: forms.buybackForm,
      };

      // Create the component instance
      this.svarogComponent = new MuchandyHeroComponent(props);

      return this.svarogComponent;
    } catch (error) {
      console.error('Error creating MuchandyHero component:', error);
      return this.createFallbackComponent();
    }
  }

  createFormComponents(svarogComponents) {
    // Create a repair form
    let repairForm;
    try {
      if (svarogComponents.PhoneRepairForm) {
        repairForm = new svarogComponents.PhoneRepairForm({
          onPriceChange: (price) => console.log('Repair price updated:', price),
        });
      } else {
        repairForm = this.createMockForm('Repair Form');
      }
    } catch (error) {
      console.warn('Error creating repair form:', error);
      repairForm = this.createMockForm('Repair Form');
    }

    // Create a buyback form
    let buybackForm;
    try {
      if (svarogComponents.UsedPhonePriceForm) {
        buybackForm = new svarogComponents.UsedPhonePriceForm({
          onPriceChange: (price) =>
            console.log('Buyback price updated:', price),
        });
      } else {
        buybackForm = this.createMockForm('Buyback Form');
      }
    } catch (error) {
      console.warn('Error creating buyback form:', error);
      buybackForm = this.createMockForm('Buyback Form');
    }

    return { repairForm, buybackForm };
  }

  createMockForm(label) {
    return {
      getElement: () => {
        const element = document.createElement('div');
        element.className = `mock-form mock-${label
          .toLowerCase()
          .replace(/\s+/g, '-')}`;

        const formTitle = document.createElement('h3');
        formTitle.textContent = label;
        element.appendChild(formTitle);

        const formDescription = document.createElement('p');
        formDescription.textContent = `This is a placeholder for the ${label}. Connect to real data services to enable functionality.`;
        element.appendChild(formDescription);

        // Add some mock form fields
        const formFields = document.createElement('div');
        formFields.innerHTML = `
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;">Device</label>
            <select style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ccc;">
              <option>Select a device</option>
              <option>iPhone 13</option>
              <option>Samsung Galaxy S22</option>
            </select>
          </div>
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px;">Service</label>
            <select style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ccc;">
              <option>Select a service</option>
              <option>Screen Repair</option>
              <option>Battery Replacement</option>
            </select>
          </div>
          <div>
            <button style="background: var(--color-primary, #4294d0); color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
              Calculate Price
            </button>
          </div>
        `;
        element.appendChild(formFields);

        return element;
      },
    };
  }

  createFallbackComponent() {
    return {
      getElement: () => {
        const element = document.createElement('div');
        element.className = 'fallback-muchandy-hero';
        element.style.background =
          'linear-gradient(to right, #3a7bd5, #3a6073)';
        element.style.padding = '40px';
        element.style.borderRadius = '8px';
        element.style.color = '#fff';
        element.style.textAlign = 'center';

        element.innerHTML = `
          <h2 style="margin-bottom: 20px;">MuchandyHero Component</h2>
          <p>This is a fallback for the MuchandyHero component.</p>
          <p>Please check the console for errors.</p>
        `;

        return element;
      },
    };
  }
}
