// src/components/content/TeaserAdapter.js
import ComponentAdapter from '../base/ComponentAdapter.js';

/**
 * Adapter for Teaser component
 * Maps Storyblok Teaser to Svarog Card or Hero component
 */
export class TeaserAdapter extends ComponentAdapter {
  /**
   * Get the component name to create
   * @returns {string} - Component name
   */
  getComponentName() {
    const data = this.storyblokData;

    // Use Hero component if there's a background image or if explicitly styled as a hero
    if (
      data.background_image ||
      data.backgroundImage ||
      (data.style && (data.style === 'hero' || data.style === 'full'))
    ) {
      return 'Hero';
    }

    // Otherwise use Card component
    return 'Card';
  }

  /**
   * Transform Storyblok data to Svarog component props
   * @returns {Object} - The transformed props
   */
  transformProps() {
    const data = this.storyblokData;
    const componentName = this.getComponentName();

    if (componentName === 'Hero') {
      return this.transformHeroProps(data);
    } else {
      return this.transformCardProps(data);
    }
  }

  /**
   * Transform props for Hero component
   * @param {Object} data - Storyblok data
   * @returns {Object} - Props for Hero component
   */
  transformHeroProps(data) {
    return {
      title: data.headline || data.title || '',
      subtitle: data.subheadline || data.subtitle || data.text || '',
      ctaText: data.cta_text || data.ctaText || '',
      ctaLink: data.cta_link || data.ctaLink || '',
      backgroundImage: this.assetUrl(
        data.background_image || data.backgroundImage
      ),
      align: data.align || 'center',
      className: data.className || '',
    };
  }

  /**
   * Transform props for Card component
   * @param {Object} data - Storyblok data
   * @returns {Object} - Props for Card component
   */
  transformCardProps(data) {
    // Create title element and content for card
    const title = data.headline || data.title || '';

    // Create content from text or subheadline
    const content = data.text || data.subheadline || data.subtitle || '';

    return {
      title: title,
      children: content,
      image: this.assetUrl(data.image),
      elevated: data.elevated || false,
      outlined: data.outlined || true,
      className: data.className || '',
    };
  }
}
