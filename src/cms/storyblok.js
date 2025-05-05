// src/cms/storyblok.js
import StoryblokClient from 'storyblok-js-client';
import { storyblokInit, apiPlugin } from '@storyblok/js';

// Initialize Storyblok client
const client = new StoryblokClient({
  accessToken:
    process.env.NODE_ENV === 'production'
      ? process.env.STORYBLOK_PUBLIC_TOKEN
      : process.env.STORYBLOK_PREVIEW_TOKEN,
  cache: {
    clear: 'auto',
    type: 'memory',
  },
});

/**
 * Initialize Storyblok
 */
export function initializeStoryblok() {
  storyblokInit({
    accessToken:
      process.env.NODE_ENV === 'production'
        ? process.env.STORYBLOK_PUBLIC_TOKEN
        : process.env.STORYBLOK_PREVIEW_TOKEN,
    use: [apiPlugin],
  });
}

/**
 * CMS API integration for fetching content from Storyblok
 */
export default class StoryblokApi {
  constructor() {
    this.client = client;
    this.version =
      process.env.NODE_ENV === 'production' ? 'published' : 'draft';
  }

  /**
   * Get story by slug
   * @param {string} slug - The story slug
   * @param {Object} options - Additional options
   * @returns {Promise} - The story data
   */
  async getStory(slug, options = {}) {
    try {
      const { data } = await this.client.get(`cdn/stories/${slug}`, {
        version: this.version,
        ...options,
      });
      return data?.story;
    } catch (error) {
      console.error(`Error fetching story ${slug}:`, error);
      return null; // Return null instead of throwing
    }
  }

  /**
   * Get multiple stories
   * @param {Object} options - Filter options
   * @returns {Promise} - Stories data
   */
  async getStories(options = {}) {
    try {
      const { data } = await this.client.get('cdn/stories', {
        version: this.version,
        ...options,
      });
      return data?.stories || [];
    } catch (error) {
      console.error('Error fetching stories:', error);
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Get site configuration
   * @returns {Promise} - Site config data
   */
  async getSiteConfig() {
    try {
      const story = await this.getStory('config');
      if (!story) {
        // Return default config if config story not found
        return this.getDefaultConfig();
      }
      return this.transformSiteConfig(story);
    } catch (error) {
      console.error('Error fetching site configuration:', error);
      return this.getDefaultConfig(); // Return default config on error
    }
  }

  /**
   * Get default configuration if Storyblok config is not available
   * @returns {Object} - Default config
   */
  getDefaultConfig() {
    return {
      id: 'default',
      siteName: 'Svarog Site',
      siteDescription:
        'Storyblok configuration not found. Please create a "config" content entry.',
      logo: null,
      navigation: { items: [] },
      footer: {
        copyright: `© ${new Date().getFullYear()} Svarog Site`,
        links: [],
        social: [],
      },
      theme: 'default-theme',
    };
  }

  /**
   * Transform Storyblok site configuration
   * @param {Object} story - The raw story data
   * @returns {Object} - Transformed config
   */
  transformSiteConfig(story) {
    if (!story) {
      return this.getDefaultConfig();
    }

    const content = story.content;

    // Extract site configuration
    let siteConfig = content;
    if (
      content.body &&
      Array.isArray(content.body) &&
      content.body.length > 0
    ) {
      const configComponent = content.body.find(
        (item) => item.component === 'Site Configuration'
      );
      siteConfig = configComponent || content.body[0];
    }

    const siteName = siteConfig.SiteName || 'Svarog Site';
    const siteDescription = siteConfig.SiteDescription || '';
    const logo = siteConfig.Logo?.filename || null;
    const theme = siteConfig.Theme || 'default-theme';

    // Transform navigation
    let navigationItems = [];
    if (
      siteConfig.PrimaryNavigation &&
      Array.isArray(siteConfig.PrimaryNavigation)
    ) {
      navigationItems = siteConfig.PrimaryNavigation.map(
        this.transformNavigationItem
      );
    }

    // Transform footer navigation
    let footerLinks = [];
    if (
      siteConfig.FooterNavigation &&
      Array.isArray(siteConfig.FooterNavigation)
    ) {
      footerLinks = siteConfig.FooterNavigation.map(
        this.transformNavigationItem
      );
    }

    return {
      id: story.uuid,
      siteName,
      siteDescription,
      logo,
      navigation: { items: navigationItems },
      footer: {
        copyright: `© ${new Date().getFullYear()} ${siteName}`,
        links: footerLinks,
        social: siteConfig.SocialLinks || [],
      },
      theme,
    };
  }

  /**
   * Transform a navigation item
   * @param {Object} item - Navigation item from Storyblok
   * @returns {Object} - Transformed item
   */
  transformNavigationItem(item) {
    let url = '/';
    if (item.URL) {
      if (item.URL.cached_url) {
        url = '/' + item.URL.cached_url;
      } else if (item.URL.url) {
        url = item.URL.url;
      }
    }
    return {
      label: item.Label || 'Unknown',
      url: url,
    };
  }

  /**
   * Get translations from Storyblok
   * @param {string} language - Language code
   * @returns {Promise} - Translations data
   */
  async getTranslations(language = 'en') {
    try {
      const { data } = await this.client.get(`cdn/datasource_entries`, {
        datasource: `translations_${language}`,
      });

      const translations = {};
      if (data && data.datasource_entries) {
        data.datasource_entries.forEach((entry) => {
          translations[entry.name] = entry.value;
        });
      }

      return translations;
    } catch (error) {
      console.error(`Error fetching translations for ${language}:`, error);
      // Return default translations instead of empty object
      return this.getDefaultTranslations(language);
    }
  }

  /**
   * Get default translations if Storyblok translations are not available
   * @param {string} language - Language code
   * @returns {Object} - Default translations
   */
  getDefaultTranslations(language) {
    // Default translations for English
    if (language === 'en') {
      return {
        loading: 'Loading...',
        error_loading: 'Error Loading Content',
        retry: 'Retry',
        connected: 'Successfully connected to Storyblok!',
        page_not_found: 'Page Not Found',
        back_to_home: 'Back to Home',
        storyblok_setup_needed: 'Storyblok setup needed',
      };
    }

    // For other languages, return English defaults
    return this.getDefaultTranslations('en');
  }
}
