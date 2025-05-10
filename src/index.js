// src/index.js
import './styles.css';
import App from './app.js';

// Apply muchandy-theme immediately
document.documentElement.classList.add('muchandy-theme');

// Create and initialize the application
const app = new App();

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  app.initialize().catch((error) => {
    console.error('Failed to start application:', error);

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
  });
});
