// src/main.js
import StoryblokIntegration from './storyblokIntegration.js';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Create integration instance
    const storyblok = new StoryblokIntegration({
      token: 'DITBZ0vdEovMYJLoYwPf2gtt',
      version: 'published',
    });

    // Initialize
    storyblok.init();

    // Load and add header
    const headerElement = await storyblok.loadHeader();
    if (headerElement) {
      document.body.prepend(headerElement);
    }

    // Find content container
    const contentContainer = document.getElementById('main-content');
    if (contentContainer) {
      // Get story slug from data attribute or default to 'home'
      const storySlug = contentContainer.dataset.story || 'home';

      // Render content
      await storyblok.renderStory(storySlug, contentContainer);
    }
  } catch (error) {
    console.error('Initialization error:', error);
  }
});
