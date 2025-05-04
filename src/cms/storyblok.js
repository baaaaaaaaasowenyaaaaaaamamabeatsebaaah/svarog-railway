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
  }

  /**
   * Get site configuration
   */
  async getSiteConfig() {
    try {
      const response = await this.client.get('cdn/stories/config', {
        version: process.env.NODE_ENV === 'production' ? 'published' : 'draft',
      });

      if (!response.data.story) {
        throw new Error('Site configuration not found');
      }

      return this.transformSiteConfig(response.data.story);
    } catch (error) {
      console.error('Error fetching site configuration:', error);
      throw error;
    }
  }

  /**
   * Transform Storyblok site configuration
   */
  transformSiteConfig(story) {
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

    const siteName = siteConfig.SiteName || 'Default Site Name';
    const siteDescription = siteConfig.SiteDescription || '';
    const logo = siteConfig.Logo?.filename || null;

    // Transform navigation
    let navigationItems = [];
    if (
      siteConfig.PrimaryNavigation &&
      Array.isArray(siteConfig.PrimaryNavigation)
    ) {
      navigationItems = siteConfig.PrimaryNavigation.map((item) => {
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
      });
    }

    // Transform footer navigation
    let footerLinks = [];
    if (
      siteConfig.FooterNavigation &&
      Array.isArray(siteConfig.FooterNavigation)
    ) {
      footerLinks = siteConfig.FooterNavigation.map((item) => {
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
      });
    }

    return {
      id: story.uuid,
      siteName: siteName,
      siteDescription: siteDescription,
      logo: logo,
      navigation: { items: navigationItems },
      footer: {
        copyright: `© ${new Date().getFullYear()} ${siteName}`,
        links: footerLinks,
        social: [],
      },
    };
  }
}
