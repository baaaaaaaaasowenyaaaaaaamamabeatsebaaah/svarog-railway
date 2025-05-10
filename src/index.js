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
      token: process.env.STORYBLOK_PUBLIC_TOKEN || 'DITBZ0vdEovMYJLoYwPf2gtt',
      version: 'published',
    });

    // Initialize
    storyblok.init();

    // Get app container
    const appElement = document.getElementById('app');
    if (!appElement) {
      console.error('App container not found');
      return;
    }

    // Show loading state
    appElement.innerHTML = `
      <div class="loading">
        <h2>Loading header...</h2>
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

      // Show error in app container
      appElement.innerHTML = `
        <div class="error" style="text-align: center; padding: 40px;">
          <h2>Header Loading Error</h2>
          <p>${headerError.message || 'Unknown error occurred'}</p>
          <p>Check the console for more details.</p>
          <button onclick="window.location.reload()">Retry</button>
        </div>
      `;
    }

    // Add a placeholder content section that's tall enough for scrolling
    const placeholderContent = document.createElement('main');
    placeholderContent.id = 'main-content';
    placeholderContent.innerHTML = `
  <div class="container">
    <section class="content-section hero-section" style="text-align: center; padding: 120px 20px; background-color: #f8f9fa; margin-bottom: 40px; border-radius: 8px;">
      <h2 style="font-size: 2.5rem; margin-bottom: 1.5rem;">Content Area</h2>
      <p style="font-size: 1.2rem; max-width: 600px; margin: 0 auto;">Content will be added later. Scroll down to see more sections and test the header collapse behavior.</p>
    </section>
    
    <section class="content-section" style="height: 500px; background-color: #e9ecef; margin-bottom: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-direction: column;">
      <h3 style="font-size: 2rem;">Section 1</h3>
      <p>Scroll down to see the header collapse</p>
    </section>
    
    <section class="content-section" style="height: 600px; background-color: #dee2e6; margin-bottom: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-direction: column;">
      <h3 style="font-size: 2rem;">Section 2</h3>
      <p>Keep scrolling to test the header behavior</p>
    </section>
    
    <section class="content-section" style="height: 700px; background-color: #ced4da; margin-bottom: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-direction: column;">
      <h3 style="font-size: 2rem;">Section 3</h3>
      <p>Continue scrolling to ensure the header collapses properly</p>
    </section>
    
    <section class="content-section" style="height: 800px; background-color: #adb5bd; margin-bottom: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-direction: column; color: white;">
      <h3 style="font-size: 2rem;">Section 4</h3>
      <p>Keep scrolling to test the header behavior on long pages</p>
    </section>
    
    <section class="content-section" style="height: 500px; background-color: #6c757d; margin-bottom: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-direction: column; color: white;">
      <h3 style="font-size: 2rem;">Section 5</h3>
      <p>Final section to ensure plenty of scrolling space</p>
    </section>
  </div>
`;
    appElement.appendChild(placeholderContent);
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
