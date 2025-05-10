// src/index.js
import './styles.css';
import StoryblokIntegration from './storyblokIntegration.js';

// Apply muchandy-theme immediately
document.documentElement.classList.add('muchandy-theme');

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Create integration instance with token from environment variables
    const storyblok = new StoryblokIntegration({
      token: process.env.STORYBLOK_PUBLIC_TOKEN,
      version: 'published',
    });

    // Initialize with muchandy-theme
    storyblok.init();

    // Ensure theme is set
    try {
      if (SvarogUI && SvarogUI.switchTheme) {
        SvarogUI.switchTheme('muchandy-theme');
      }
    } catch (themeError) {
      console.warn('Theme switching error:', themeError);
      // Ensure theme class is applied manually
      document.documentElement.classList.remove(
        'default-theme',
        'cabalou-theme'
      );
      document.documentElement.classList.add('muchandy-theme');
    }

    // Get app container
    const appElement = document.getElementById('app');
    if (!appElement) {
      console.error('App container not found');
      return;
    }

    // Show loading state
    appElement.innerHTML = `
      <div class="loading">
        <h2>Loading content...</h2>
      </div>
    `;

    // Load and add header
    try {
      const headerElement = await storyblok.loadHeader();
      if (headerElement) {
        const headerContainer = document.createElement('header');
        headerContainer.id = 'app-header';
        headerContainer.appendChild(headerElement);
        appElement.innerHTML = '';
        appElement.appendChild(headerContainer);
      }
    } catch (headerError) {
      console.error('Error loading header:', headerError);
    }

    // Create main content container
    const mainContent = document.createElement('main');
    mainContent.id = 'main-content';
    appElement.appendChild(mainContent);

    // Add footer
    const footer = document.createElement('footer');
    footer.id = 'app-footer';
    footer.innerHTML = `
      <div class="container">
        <p>&copy; ${new Date().getFullYear()} Svarog UI</p>
      </div>
    `;
    appElement.appendChild(footer);

    // Load content for home page
    try {
      await storyblok.renderStory('home', mainContent);
    } catch (contentError) {
      console.error('Error loading content:', contentError);
      mainContent.innerHTML = `
        <div class="container">
          <div class="error">
            <h2>Error Loading Content</h2>
            <p>${contentError.message}</p>
            <button onclick="window.location.reload()">Retry</button>
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Initialization error:', error);

    // Show error in app container
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = `
        <div class="error" style="text-align: center; padding: 40px;">
          <h2>Application Error</h2>
          <p>${error.message || 'Unknown error occurred'}</p>
          <p>Check the console for more details.</p>
          <button onclick="window.location.reload()">Retry</button>
        </div>
      `;
    }
  }
});
