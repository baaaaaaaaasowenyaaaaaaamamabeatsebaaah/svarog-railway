import './styles.css';
import { initializeStoryblok } from './cms/storyblok.js';
import StoryblokApi from './cms/storyblok.js';

// Initialize Storyblok
initializeStoryblok();

// Create API instance
const storyblokApi = new StoryblokApi();

// Initialize the app
async function initApp() {
  const app = document.getElementById('app');

  try {
    // Show loading state
    app.innerHTML = `
      <div class="loading">
        <h2>Loading...</h2>
      </div>
    `;

    // Fetch site configuration
    const siteConfig = await storyblokApi.getSiteConfig();

    // Render the app with site configuration
    app.innerHTML = `
      <div class="container">
        <header>
          <h1>${siteConfig.siteName}</h1>
          <nav>
            ${siteConfig.navigation.items
              .map(
                (item) => `
              <a href="${item.url}">${item.label}</a>
            `
              )
              .join('')}
          </nav>
        </header>
        
        <main>
          <p>${siteConfig.siteDescription}</p>
          <p>Successfully connected to Storyblok!</p>
        </main>
        
        <footer>
          <p>${siteConfig.footer.copyright}</p>
          <nav>
            ${siteConfig.footer.links
              .map(
                (link) => `
              <a href="${link.url}">${link.label}</a>
            `
              )
              .join('')}
          </nav>
        </footer>
      </div>
    `;
  } catch (error) {
    console.error('Error initializing app:', error);
    app.innerHTML = `
      <div class="error">
        <h2>Error Loading Content</h2>
        <p>${error.message}</p>
        <button onclick="window.location.reload()">Retry</button>
      </div>
    `;
  }
}

// Start the app
initApp();
