// src/index.js
import './styles.css';
import StoryblokIntegration from './storyblokIntegration.js';
import ThemeManager from './utils/themeManager.js';
import App from './components/App/App.js';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Create Storyblok integration with token from environment variables
    const storyblok = new StoryblokIntegration({
      token: process.env.STORYBLOK_PUBLIC_TOKEN,
      version: 'published',
      theme: ThemeManager.THEMES.MUCHANDY,
    });

    // Initialize Storyblok
    storyblok.init();

    // Get app container
    const appElement = document.getElementById('app');
    if (!appElement) {
      console.error('App container not found');
      return;
    }

    // Create and render app
    const app = new App({
      storyblok: storyblok,
      theme: ThemeManager.THEMES.MUCHANDY,
      collapseThreshold: 100, // Adjust this value to match the header's threshold
    });

    // Clear app container and add app element
    appElement.innerHTML = '';
    appElement.appendChild(app.getElement());
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
