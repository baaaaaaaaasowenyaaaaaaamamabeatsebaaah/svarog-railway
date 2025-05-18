// src/index.js
import './styles.css';
import StoryblokIntegration from './storyblokIntegration.js';
import ThemeManager from './utils/themeManager.js';
import App from './components/App/App.js';

// Add global error handling for message channel errors
window.addEventListener('unhandledrejection', (event) => {
  // Only suppress message channel errors
  if (
    event.reason &&
    event.reason.message &&
    event.reason.message.includes(
      'message channel closed before a response was received'
    )
  ) {
    // This error is due to navigation, it's expected and safe to ignore
    console.log('Suppressing navigation-related message channel error');
    event.preventDefault(); // Prevent it from appearing in console
  }
});

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
