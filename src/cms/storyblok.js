// src/cms/storyblok.js (modified)
import StoryblokClient from 'storyblok-js-client';
import { storyblokInit, apiPlugin } from '@storyblok/js';
import ApiClient from '../utils/apiClient.js';

// Get tokens from environment variables
const previewToken = process.env.STORYBLOK_PREVIEW_TOKEN;
const publicToken = process.env.STORYBLOK_PUBLIC_TOKEN;

// Select the appropriate token based on environment
const accessToken =
  process.env.NODE_ENV === 'production' ? publicToken : previewToken;

// Initialize Storyblok client with the token from env vars
const client = new StoryblokClient({
  accessToken,
  cache: {
    clear: 'auto',
    type: 'memory',
  },
});

// Create enhanced API client
const enhancedClient = new ApiClient(client);

/**
 * Initialize Storyblok
 */
export function initializeStoryblok() {
  storyblokInit({
    accessToken,
    use: [apiPlugin],
  });
}

/**
 * CMS API integration for fetching content from Storyblok
 */
export default class StoryblokApi {
  constructor() {
    this.client = enhancedClient;
    // Use published version in production, draft in development
    this.version =
      process.env.NODE_ENV === 'production' ? 'published' : 'draft';
    // Store fallback content for development
    this.fallbackContent = this.createFallbackContent();
  }

  /**
   * Create fallback content for development when Storyblok is not available
   * @returns {Object} - Fallback content
   */
  createFallbackContent() {
    return {
      config: {
        name: 'Site Configuration',
        content: {
          siteName: 'Svarog UI Demo',
          siteDescription: 'Built with Svarog UI and Storyblok CMS',
          theme: 'muchandy-theme',
          header: {
            component: 'CollapsibleHeader',
            _uid: 'fallback-header',
            siteName: 'Svarog UI Demo',
            navigation: {
              items: [
                { label: 'Home', href: '/' },
                { label: 'About', href: '/about' },
                { label: 'Contact', href: '/contact' },
              ],
            },
            contactInfo: {
              location: '123 Main Street',
              phone: '+1 (555) 123-4567',
              email: 'info@example.com',
            },
          },
        },
      },
      header: {
        name: 'Site Header',
        content: {
          component: 'Header',
          _uid: 'fallback-header',
          siteName: 'Svarog UI Demo',
          navigation: {
            items: [
              { label: 'Home', href: '/' },
              { label: 'About', href: '/about' },
              { label: 'Contact', href: '/contact' },
            ],
          },
        },
      },
      home: {
        name: 'Home Page',
        content: {
          body: [
            {
              component: 'Section',
              _uid: 'home-section-1',
              title: 'Welcome to Svarog UI',
              content:
                'This is a fallback home page created when Storyblok content is unavailable.',
            },
            {
              component: 'Grid',
              _uid: 'home-grid-1',
              columns: [
                {
                  width: 6,
                  content: [
                    {
                      component: 'Teaser',
                      _uid: 'home-teaser-1',
                      headline: 'Feature 1',
                      text: 'First amazing feature',
                    },
                  ],
                },
                {
                  width: 6,
                  content: [
                    {
                      component: 'Teaser',
                      _uid: 'home-teaser-2',
                      headline: 'Feature 2',
                      text: 'Second amazing feature',
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      about: {
        name: 'About Page',
        content: {
          body: [
            {
              component: 'Section',
              _uid: 'about-section-1',
              title: 'About Svarog UI',
              content:
                'This is a fallback about page created when Storyblok content is unavailable.',
            },
          ],
        },
      },
      contact: {
        name: 'Contact Page',
        content: {
          body: [
            {
              component: 'Section',
              _uid: 'contact-section-1',
              title: 'Contact Us',
              content:
                'This is a fallback contact page created when Storyblok content is unavailable.',
            },
            {
              component: 'ContactInfo',
              _uid: 'contact-info-1',
              location: '123 Main Street',
              phone: '+1 (555) 123-4567',
              email: 'info@example.com',
            },
          ],
        },
      },
    };
  }

  /**
   * Get story by slug
   * @param {string} slug - The story slug
   * @param {Object} options - Additional options
   * @returns {Promise} - The story data
   */
  async getStory(slug, options = {}) {
    try {
      console.log(`Fetching story: ${slug}`);
      const { data } = await this.client.get(`cdn/stories/${slug}`, {
        version: this.version,
        ...options,
      });

      if (data && data.story) {
        console.log(`Story found: ${slug}`);
        return data.story;
      }

      throw new Error('Story not found in API response');
    } catch (error) {
      console.error(`Error fetching story ${slug}:`, error);

      // Return fallback content if available
      if (this.fallbackContent[slug]) {
        console.log(`Using fallback content for: ${slug}`);
        return this.fallbackContent[slug];
      }

      return null;
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

      // Return fallback stories if no real ones are available
      if (options.starts_with || options.filter_query) {
        // Try to guess which stories to return based on filter
        const filteredFallbacks = Object.values(this.fallbackContent).filter(
          (story) =>
            story.name &&
            story.name
              .toLowerCase()
              .includes((options.starts_with || '').toLowerCase())
        );

        if (filteredFallbacks.length > 0) {
          return filteredFallbacks;
        }
      }

      return [];
    }
  }

  /**
   * Get site configuration
   * @returns {Promise} - Site config data
   */
  async getSiteConfig() {
    try {
      console.log('Fetching site configuration');
      // First try to get from the config story
      const story = await this.getStory('config');

      if (!story) {
        console.warn('Config story not found');

        // If no config story, try to get site details
        try {
          const { data } = await this.client.get('cdn/spaces/me');
          console.log('Got space details:', data);

          // Create a config from space details
          if (data && data.space) {
            return {
              id: data.space.id,
              siteName: data.space.name,
              siteDescription: `${data.space.name} - Powered by Storyblok`,
              logo: null,
              navigation: { items: [] },
              theme: 'muchandy-theme',
            };
          }
        } catch (spaceError) {
          console.error('Error fetching space details:', spaceError);
        }

        return this.getDefaultConfig();
      }

      console.log('Config story found:', story);
      return this.transformSiteConfig(story);
    } catch (error) {
      console.error('Error fetching site configuration:', error);
      return this.getDefaultConfig();
    }
  }

  /**
   * Get default configuration if Storyblok config is not available
   * @returns {Object} - Default config
   */
  getDefaultConfig() {
    return {
      id: 'default',
      siteName: 'Svarog UI',
      siteDescription: 'Built with Svarog UI and Storyblok CMS',
      logo: null,
      navigation: {
        items: [
          { id: 'home', label: 'Home', href: '/' },
          { id: 'about', label: 'About', href: '/about' },
          { id: 'contact', label: 'Contact', href: '/contact' },
        ],
      },
      footer: {
        copyright: `© ${new Date().getFullYear()} Svarog UI`,
        links: [],
        social: [],
      },
      theme: 'muchandy-theme',
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

    const content = story.content || {};

    // Extract site configuration fields
    const siteName = content.siteName || content.SiteName || 'Svarog UI';
    const siteDescription =
      content.siteDescription || content.SiteDescription || '';
    const logo = this.getAssetUrl(content.logo || content.Logo);
    const theme = content.theme || content.Theme || 'muchandy-theme';

    // Transform navigation if available
    let navigationItems = [];
    if (content.navigation && content.navigation.items) {
      navigationItems = content.navigation.items;
    } else if (content.Navigation && content.Navigation.items) {
      navigationItems = content.Navigation.items;
    }

    // Create header from config if a header component is defined
    let header = null;
    if (content.header || content.Header) {
      header = content.header || content.Header;
    }

    // Look for a header in the components field
    if (!header && content.components && Array.isArray(content.components)) {
      header = content.components.find(
        (c) =>
          c.component === 'header' ||
          c.component === 'Header' ||
          c.component === 'CollapsibleHeader'
      );
    }

    // Look for a header in the body field
    if (!header && content.body && Array.isArray(content.body)) {
      header = content.body.find(
        (c) =>
          c.component === 'header' ||
          c.component === 'Header' ||
          c.component === 'CollapsibleHeader'
      );
    }

    return {
      id: story.uuid,
      siteName,
      siteDescription,
      logo,
      navigation: { items: navigationItems },
      header,
      theme,
    };
  }

  /**
   * Create a header component from site config
   * @param {Object} config - Site configuration
   * @returns {Object} - Header component data
   */
  createHeaderFromConfig(config) {
    return {
      component: 'Header',
      _uid: 'generated-header',
      siteName: config.siteName,
      navigation: config.navigation,
      logo: config.logo,
    };
  }

  /**
   * Get header data
   * @returns {Promise<Object>} - Header component data
   */
  async getHeaderData() {
    try {
      // Try to get header from site config first
      const config = await this.getSiteConfig();

      if (config.header) {
        return config.header;
      }

      // Try to get a standalone header story
      const headerStory = await this.getStory('header');
      if (headerStory && headerStory.content) {
        return headerStory.content;
      }

      // Create a header from config
      return this.createHeaderFromConfig(config);
    } catch (error) {
      console.error('Error fetching header data:', error);

      // Return a minimal header
      return {
        component: 'Header',
        siteName: 'Svarog UI',
        navigation: {
          items: [
            { id: 'home', label: 'Home', href: '/' },
            { id: 'about', label: 'About', href: '/about' },
            { id: 'contact', label: 'Contact', href: '/contact' },
          ],
        },
      };
    }
  }

  /**
   * Get asset URL from Storyblok asset object
   * @param {Object|string} asset - Asset object or string URL
   * @returns {string|null} - Asset URL or null
   */
  getAssetUrl(asset) {
    if (!asset) return null;

    if (typeof asset === 'string') return asset;
    if (asset.filename) return asset.filename;
    return null;
  }

  /**
   * Get translations from Storyblok
   * @param {string} language - Language code
   * @returns {Promise} - Translations data
   */
  async getTranslations(language = 'en') {
    try {
      // Try to get translations from datasource
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
      console.warn(`Error fetching translations for ${language}:`, error);

      // Return default translations
      return {
        loading: 'Loading...',
        error_loading: 'Error Loading Content',
        retry: 'Retry',
        page_not_found: 'Page Not Found',
        back_to_home: 'Back to Home',
        site_name: 'Svarog UI',
        home: 'Home',
        about: 'About',
        contact: 'Contact',
        content_not_found: 'Content Not Found',
        content_not_found_message:
          "This page doesn't contain any content blocks.",
      };
    }
  }
}
