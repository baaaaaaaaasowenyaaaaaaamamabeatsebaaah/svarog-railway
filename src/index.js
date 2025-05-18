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

// Function to initialize the application with configuration
async function initializeApp() {
  try {
    // Show initial loading state
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = `
        <div style="text-align: center; padding: 50px">
          <h1>Loading application...</h1>
        </div>
      `;
    }

    // Fetch configuration from the server
    console.log('Fetching application configuration...');
    let config = {};

    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        config = await response.json();
        console.log('Configuration loaded successfully');
      } else {
        console.warn(
          'Failed to load configuration from server:',
          response.status
        );
      }
    } catch (error) {
      console.error('Error fetching configuration:', error);
    }

    // Fallback to environment variables if available (for local development)
    const storyblokToken =
      config.STORYBLOK_PUBLIC_TOKEN || process.env.STORYBLOK_PUBLIC_TOKEN || '';

    // Log configuration state (without exposing sensitive data)
    console.log(`Storyblok token available: ${!!storyblokToken}`);
    console.log(
      `Environment: ${config.NODE_ENV || process.env.NODE_ENV || 'production'}`
    );

    // Create Storyblok integration with token
    const storyblok = new StoryblokIntegration({
      token: storyblokToken,
      version: 'published',
      theme: ThemeManager.THEMES.MUCHANDY,
    });

    // Initialize Storyblok
    storyblok.init();

    // Get app container
    if (!appElement) {
      console.error('App container not found');
      return;
    }

    // Create and render app
    const app = new App({
      storyblok: storyblok,
      theme: ThemeManager.THEMES.MUCHANDY,
      collapseThreshold: 100,
    });

    // Clear app container and add app element
    appElement.innerHTML = '';
    appElement.appendChild(app.getElement());
  } catch (error) {
    console.error('Initialization error:', error);

    // Show error in app container
    const appElement = document.getElementById('app');
    if (appElement) {
      const errorEl = document.createElement('div');
      errorEl.className = 'error';
      errorEl.style.textAlign = 'center';
      errorEl.style.padding = '40px';

      errorEl.innerHTML = `
        <h2>Application Error</h2>
        <p>${error.message || 'Unknown error occurred'}</p>
        <p>Check the console for more details.</p>
        <button class="retry-button">Retry</button>
      `;

      // Add event listener after the element is created
      setTimeout(() => {
        const retryButton = errorEl.querySelector('.retry-button');
        if (retryButton) {
          retryButton.addEventListener('click', () => {
            window.location.reload();
          });
        }
      }, 0);

      appElement.innerHTML = '';
      appElement.appendChild(errorEl);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);
