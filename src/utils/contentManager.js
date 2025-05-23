// src/utils/contentManager.js
import Router from './router.js';
import DebugHelper from './debugHelper.js';

export default class ContentManager {
  constructor(options = {}) {
    this.contentElement =
      options.contentElement || document.getElementById('main-content');
    this.storyblok = options.storyblok || null;
    this.loadingTemplate =
      options.loadingTemplate ||
      `
      <div class="content-loading">
        <div class="loading-spinner"></div>
        <p>Loading content...</p>
      </div>
    `;
    this.errorTemplate =
      options.errorTemplate ||
      `
      <div class="content-error">
        <h2>Error Loading Content</h2>
        <p>There was a problem loading this page. Please try again later.</p>
        <button class="retry-button">Retry</button>
      </div>
    `;

    // Create router
    this.router = new Router({
      contentElement: this.contentElement,
      defaultRoute: '/',
      loadingTemplate: this.loadingTemplate,
      errorTemplate: this.errorTemplate,
      afterRoute: (newPath) => {
        this.updateActiveNavigation(newPath);
      },
    });

    // Bind methods
    this.loadPage = this.loadPage.bind(this);
    this.updateActiveNavigation = this.updateActiveNavigation.bind(this);

    // Initialize
    this.init();

    // Add this to bind additional methods
    this.renderComponent = this.renderComponent.bind(this);
    this.createErrorContent = this.createErrorContent.bind(this);
  }

  init() {
    // Register routes first
    this.registerRoutes();

    // Initialize router after routes are registered
    this.router.init();

    // Add event listeners for retry buttons
    this.contentElement.addEventListener('click', (event) => {
      if (event.target.classList.contains('retry-button')) {
        this.router.handleNavigation();
      }
    });
  }

  registerRoutes() {
    try {
      // Register home route explicitly
      this.router.registerRoute('/', async () => {
        console.log('Loading home page');
        return this.loadPage('home');
      });

      // Common routes
      [
        { path: '/about', slug: 'about' },
        { path: '/contact', slug: 'contact' },
        { path: '/services', slug: 'services' },
      ].forEach((route) => {
        this.router.registerRoute(route.path, async () => {
          console.log(`Loading page for path: ${route.path}`);
          return this.loadPage(route.slug);
        });
      });

      // Default dynamic route handler for all other routes
      this.router.registerRoute('*', async (path) => {
        // Extract slug from path
        const slug = path.substring(1) || 'home'; // Remove leading slash
        console.log(`Loading dynamic page for slug: ${slug}`);
        return this.loadPage(slug);
      });

      // Add debug logs
      DebugHelper.logRoutes(this.router);
      console.log('Routes registered successfully');
    } catch (error) {
      console.error('Error registering routes:', error);
    }
  }

  async loadPage(slug) {
    try {
      // Set a flag to track if this request is still valid
      const requestId = Math.random().toString(36).substring(7);
      this.currentRequestId = requestId;

      // Show loading state first
      if (this.contentElement) {
        this.contentElement.innerHTML = this.loadingTemplate;
      }

      // Add a small delay to ensure loading state is rendered
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Check if this request is still the current one
      if (this.currentRequestId !== requestId) {
        console.log('Request cancelled, another navigation started');
        return null;
      }

      // Use Storyblok if available, otherwise create placeholder content
      if (this.storyblok) {
        try {
          const story = await this.storyblok.fetchStory(slug);

          // Check again if this request is still valid
          if (this.currentRequestId !== requestId) {
            console.log('Story fetch completed but request no longer current');
            return null;
          }

          return this.renderStoryContent(story);
        } catch (error) {
          // Only throw if this is still the current request
          if (this.currentRequestId === requestId) {
            throw error;
          }
          return null;
        }
      } else {
        // Placeholder content for testing without Storyblok
        return this.createPlaceholderContent(slug);
      }
    } catch (error) {
      console.error(`Error loading page ${slug}:`, error);
      // Return error content instead of throwing
      return this.createErrorContent(error.message);
    }
  }

  renderStoryContent(story) {
    const content = document.createElement('div');
    content.className = 'page-content';

    if (story && story.content) {
      // Create container
      const container = document.createElement('div');
      container.className = 'container';

      // Check if this is the home page and it has a hero component
      if (story.slug === 'home' || story.slug === '') {
        try {
          // Add hero component if on home page
          if (
            story.content.hero &&
            Array.isArray(story.content.hero) &&
            story.content.hero.length > 0
          ) {
            const heroData = story.content.hero[0];
            if (heroData && this.storyblok) {
              const AdapterClass =
                this.storyblok.componentAdapters.MuchandyHero;
              if (AdapterClass) {
                const adapter = new AdapterClass(heroData);
                const heroComponent = adapter.createComponent(
                  this.storyblok.componentsRegistry
                );
                const heroElement = heroComponent.getElement();
                content.appendChild(heroElement);
              }
            }
          }
        } catch (error) {
          console.error('Error rendering hero:', error);
        }
      }

      // Add page title if available and not home page
      if (
        story.slug !== 'home' &&
        story.slug !== '' &&
        (story.name || story.content.title)
      ) {
        const title = document.createElement('h1');
        title.className = 'content-title';
        title.textContent = story.content.title || story.name;
        container.appendChild(title);
      }

      // Add rest of content
      if (story.content.body && Array.isArray(story.content.body)) {
        story.content.body.forEach((component) => {
          const componentElement = this.renderComponent(component);
          if (componentElement) {
            container.appendChild(componentElement);
          }
        });
      } else if (story.content.text) {
        const textContainer = document.createElement('div');
        textContainer.className = 'content-text';
        textContainer.innerHTML = story.content.text;
        container.appendChild(textContainer);
      }

      content.appendChild(container);
    } else {
      content.innerHTML =
        '<div class="container"><p>No content found</p></div>';
    }

    return content;
  }

  renderComponent(component) {
    if (!component || !component.component) {
      console.warn('Invalid component data:', component);
      return null;
    }

    try {
      // Check if storyblok is available and has componentAdapters
      if (!this.storyblok || !this.storyblok.componentAdapters) {
        return this.createGenericComponent(component);
      }

      // Check if we have an adapter for this component
      const AdapterClass =
        this.storyblok.componentAdapters[component.component];

      if (AdapterClass) {
        // Create adapter instance
        const adapter = new AdapterClass(component);
        // Create component using the adapter
        const svarogComponent = adapter.createComponent(
          this.storyblok.componentsRegistry
        );
        // Return the element
        return svarogComponent.getElement();
      }

      // For components without adapters, create a generic element
      return this.createGenericComponent(component);
    } catch (error) {
      console.error(`Error rendering component ${component.component}:`, error);
      return this.createErrorComponent(component.component, error.message);
    }
  }

  createGenericComponent(component) {
    const genericElement = document.createElement('div');
    genericElement.className = `sb-component sb-component-${component.component.toLowerCase()}`;

    // Create title if component has one
    if (component.title || component.headline) {
      const title = document.createElement('h2');
      title.className = 'component-title';
      title.textContent = component.title || component.headline;
      genericElement.appendChild(title);
    }

    // Create content if component has it
    if (component.text || component.content) {
      const content = document.createElement('div');
      content.className = 'component-content';
      content.innerHTML = component.text || component.content || '';
      genericElement.appendChild(content);
    }

    // If component has children, render them
    if (component.body && Array.isArray(component.body)) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'component-children';

      component.body.forEach((child) => {
        const childElement = this.renderComponent(child);
        if (childElement) {
          childrenContainer.appendChild(childElement);
        }
      });

      genericElement.appendChild(childrenContainer);
    }

    return genericElement;
  }

  // Add this method
  createErrorComponent(componentName, errorMessage) {
    const errorElement = document.createElement('div');
    errorElement.className = 'component-error';
    errorElement.style.padding = '15px';
    errorElement.style.margin = '10px 0';
    errorElement.style.backgroundColor = '#fff0f0';
    errorElement.style.border = '1px solid #ffcece';
    errorElement.style.borderRadius = '4px';

    errorElement.innerHTML = `
      <p><strong>Error rendering component: ${componentName}</strong></p>
      <p>${errorMessage}</p>
    `;

    return errorElement;
  }

  createErrorContent(errorMessage) {
    const errorContent = document.createElement('div');
    errorContent.className = 'error-content';

    errorContent.innerHTML = `
      <div class="container" style="text-align: center; padding: 60px 20px;">
        <h2>Error Loading Content</h2>
        <p>${errorMessage || 'An error occurred while loading the content.'}</p>
        <button class="retry-button">Retry</button>
      </div>
    `;

    // Add event listener programmatically
    setTimeout(() => {
      const retryButton = errorContent.querySelector('.retry-button');
      if (retryButton) {
        retryButton.addEventListener('click', () => {
          window.location.reload();
        });
      }
    }, 0);

    return errorContent;
  }

  createPlaceholderContent(slug) {
    const content = document.createElement('div');
    content.className = 'page-content';

    content.innerHTML = `
      <div class="container">
        <section class="content-section hero-section" style="text-align: center; padding: 120px 20px; background-color: #f8f9fa; margin-bottom: 40px; border-radius: 8px;">
          <h2 style="font-size: 2.5rem; margin-bottom: 1.5rem;">${
            slug.charAt(0).toUpperCase() + slug.slice(1)
          } Page</h2>
          <p style="font-size: 1.2rem; max-width: 600px; margin: 0 auto;">This is a placeholder for the ${slug} page. In production, this content would come from Storyblok.</p>
        </section>
        
        <section class="content-section" style="height: 400px; background-color: #e9ecef; margin-bottom: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-direction: column;">
          <h3 style="font-size: 2rem;">Section 1</h3>
          <p>Content for ${slug} page</p>
        </section>
        
        <section class="content-section" style="height: 500px; background-color: #dee2e6; margin-bottom: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-direction: column;">
          <h3 style="font-size: 2rem;">Section 2</h3>
          <p>More content for ${slug} page</p>
        </section>
      </div>
    `;

    return content;
  }

  updateActiveNavigation(path) {
    // Find all navigation items
    const navItems = document.querySelectorAll('.nav__item');

    // Remove active class from all
    navItems.forEach((item) => {
      item.classList.remove('nav__item--active');
    });

    // Add active class to matching item
    navItems.forEach((item) => {
      const link = item.querySelector('.nav__link');
      if (
        link &&
        (link.getAttribute('href') === path ||
          (path === '/' && link.getAttribute('href') === '/'))
      ) {
        item.classList.add('nav__item--active');
      }
    });
  }
}
