// src/index.js
import './styles.css';
import { initializeStoryblok } from './cms/storyblok.js';
import StoryblokApi from './cms/storyblok.js';

// Initialize Storyblok
initializeStoryblok();

// Create API instance
const storyblokApi = new StoryblokApi();

// Default translations
const defaultTranslations = {
  loading: 'Loading...',
  error_loading: 'Error Loading Content',
  retry: 'Retry',
  connected: 'Successfully connected to Storyblok!',
  storyblok_setup_needed:
    'Storyblok setup needed. Please check the documentation.',
};

// Initialize the app
async function initApp() {
  const app = document.getElementById('app');

  try {
    // Show loading state
    app.innerHTML = `
      <div class="loading">
        <h2>${defaultTranslations.loading}</h2>
      </div>
    `;

    // Fetch site configuration
    const siteConfig = await storyblokApi.getSiteConfig();

    // Try to load translations but don't fail if they don't exist
    let translations = defaultTranslations;
    try {
      const loadedTranslations = await storyblokApi.getTranslations('en');
      if (Object.keys(loadedTranslations).length > 0) {
        translations = { ...defaultTranslations, ...loadedTranslations };
      }
    } catch (error) {
      console.warn('Using default translations:', error);
    }

    // Apply theme if specified
    applyTheme(siteConfig.theme || 'default-theme');

    // Render the app with site configuration
    app.innerHTML = `
      <div class="container">
        <header>
          ${
            siteConfig.logo
              ? `<img src="${siteConfig.logo}" alt="logo" width="120px"/>`
              : ''
          }
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
        
        <main id="main-content">
          <p>${siteConfig.siteDescription}</p>
          <p>${translations.connected}</p>
          ${
            !siteConfig.logo && siteConfig.navigation.items.length === 0
              ? `<div class="notice">
              <h3>${translations.storyblok_setup_needed}</h3>
              <p>It looks like your Storyblok setup is not complete. Please make sure to:</p>
              <ol>
                <li>Create a Content Type named "Config" with fields for SiteName, SiteDescription, Logo, etc.</li>
                <li>Create a Config entry with your site details</li>
                <li>Create NavigationItem components for your site navigation</li>
                <li>Optionally create a translations_en datasource for localizations</li>
              </ol>
            </div>`
              : ''
          }
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

    // Setup SPA navigation
    setupNavigation();
  } catch (error) {
    console.error('Error initializing app:', error);
    app.innerHTML = `
      <div class="error">
        <h2>${defaultTranslations.error_loading}</h2>
        <p>${error.message}</p>
        <button onclick="window.location.reload()">${defaultTranslations.retry}</button>
      </div>
    `;
  }
}

/**
 * Apply a theme class to the document
 * @param {string} theme - Theme name
 */
function applyTheme(theme) {
  // Remove existing theme classes
  document.documentElement.classList.remove(
    'default-theme',
    'cabalou-theme',
    'muchandy-theme'
  );
  // Add the new theme class
  document.documentElement.classList.add(theme || 'default-theme');
}

/**
 * Set up SPA navigation
 */
function setupNavigation() {
  // Handle link clicks
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    // Skip external links, anchors, etc.
    if (!href || href.startsWith('http') || href.startsWith('#')) {
      return;
    }

    event.preventDefault();

    // Update URL without page reload
    window.history.pushState({}, '', href);

    // Load content
    loadContent(href);
  });

  // Handle browser back/forward
  window.addEventListener('popstate', () => {
    loadContent(window.location.pathname);
  });
}

/**
 * Load content for a specific path
 * @param {string} path - URL path
 */
async function loadContent(path) {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  try {
    // Show loading indicator
    mainContent.innerHTML = `<div class="loading"><h3>${defaultTranslations.loading}</h3></div>`;

    // Normalize path to slug
    const slug = path === '/' ? 'home' : path.replace(/^\//, '');

    // Fetch content from Storyblok
    const story = await storyblokApi.getStory(slug);

    if (!story) {
      throw new Error(`Page ${slug} not found`);
    }

    // Update document title
    document.title = story.name;

    // Clear previous content
    mainContent.innerHTML = '';

    // Render content
    if (story.content.body && Array.isArray(story.content.body)) {
      story.content.body.forEach((block) => {
        const section = document.createElement('section');

        if (block.headline) {
          const heading = document.createElement('h2');
          heading.textContent = block.headline;
          section.appendChild(heading);
        }

        if (block.text) {
          const text = document.createElement('p');
          text.textContent = block.text;
          section.appendChild(text);
        }

        mainContent.appendChild(section);
      });
    } else {
      // Fallback for pages without body content
      const content = document.createElement('p');
      content.textContent = story.content.intro || story.name;
      mainContent.appendChild(content);
    }
  } catch (error) {
    console.error('Error loading content:', error);
    mainContent.innerHTML = `
      <div class="error">
        <h2>${defaultTranslations.page_not_found}</h2>
        <p>${error.message}</p>
        <a href="/">${defaultTranslations.back_to_home}</a>
      </div>
    `;
  }
}

// Start the app
initApp();
