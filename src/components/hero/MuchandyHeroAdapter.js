// src/components/hero/MuchandyHeroAdapter.js - Update this file
import ComponentAdapter from '../base/ComponentAdapter.js';
import ApiService from '../../services/apiService.js';

export class MuchandyHeroAdapter extends ComponentAdapter {
  constructor(storyblokData, options = {}) {
    super(storyblokData, options);
    // Create a single API service instance to be shared
    this.apiService = new ApiService();
  }

  getComponentName() {
    return 'MuchandyHero';
  }

  transformProps() {
    const data = this.storyblokData || {};
    const content = data.content || data;

    // Process background image
    const backgroundImage = this.assetUrl(
      content.backgroundImage || content.BackgroundImage
    );

    // Process title and subtitle
    const title = content.title || content.Title || 'Finden Sie<br>Ihren Preis';
    const subtitle =
      content.subtitle || content.Subtitle || 'Jetzt Preis berechnen.';

    // Get tab configuration
    const defaultTab = content.defaultTab || content.DefaultTab || 'repair';

    return {
      backgroundImage,
      title,
      subtitle,
      defaultTab,
      className: content.className || '',
      // Forms will be created in createComponent
    };
  }

  createComponent(svarogComponents) {
    if (!svarogComponents.MuchandyHero) {
      console.error('MuchandyHero component not found in Svarog UI');
      return this.createFallbackHero();
    }

    try {
      // Get props
      const props = this.transformProps();

      // Create forms with our API service
      const repairForm = new svarogComponents.PhoneRepairForm({
        service: this.apiService,
        onPriceChange: (price) => console.log('Repair price:', price),
      });

      const buybackForm = new svarogComponents.UsedPhonePriceForm({
        service: this.apiService,
        onPriceChange: (price) => console.log('Buyback price:', price),
      });

      // Create the hero component
      return new svarogComponents.MuchandyHero({
        ...props,
        repairForm,
        buybackForm,
      });
    } catch (error) {
      console.error('Error creating MuchandyHero:', error);
      return this.createFallbackHero();
    }
  }

  createFallbackHero() {
    return {
      getElement: () => {
        const element = document.createElement('div');
        element.className = 'fallback-hero';
        element.style.padding = '60px 20px';
        element.style.textAlign = 'center';
        element.style.background =
          'linear-gradient(to right, #4294d0, #6a5acd)';
        element.style.color = 'white';

        const container = document.createElement('div');
        container.className = 'container';

        const title = document.createElement('h1');
        title.innerHTML = 'Welcome to<br>our Website';
        title.style.fontSize = '2.5rem';
        title.style.marginBottom = '1rem';

        const subtitle = document.createElement('p');
        subtitle.textContent = 'Find the best services for your device';
        subtitle.style.fontSize = '1.2rem';
        subtitle.style.marginBottom = '2rem';

        container.appendChild(title);
        container.appendChild(subtitle);
        element.appendChild(container);

        return element;
      },
    };
  }
}
