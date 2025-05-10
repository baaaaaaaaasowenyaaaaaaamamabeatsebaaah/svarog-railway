// src/components/layout/SectionAdapter.js
import ComponentAdapter from '../base/ComponentAdapter.js';

/**
 * Adapter for Section component
 */
export class SectionAdapter extends ComponentAdapter {
  /**
   * Get the component name to create
   * @returns {string} - Component name
   */
  getComponentName() {
    return 'Section';
  }

  /**
   * Transform Storyblok data to Svarog component props
   * @returns {Object} - The transformed props
   */
  transformProps() {
    const data = this.storyblokData;

    // Handle children based on data available
    let children = '';

    // Use text, content, or body for the content
    if (data.text || data.content) {
      children = data.text || data.content;
    }
    // If there's a body array, try to use it
    else if (data.body && Array.isArray(data.body) && data.body.length > 0) {
      // If registry is available, we'll handle children later
      if (this.options.registry) {
        // Placeholder for now
        children = 'Loading section content...';
      } else {
        // Simple text representation of components
        children = `Section contains ${data.body.length} components`;
      }
    }

    return {
      title: data.title || data.headline || '',
      description: data.description || data.subheadline || '',
      children,
      id: data.id || data._uid,
      variant: data.variant || data.style,
      className: data.className || '',
      noPaddingBottom: !!data.noPaddingBottom,
    };
  }

  /**
   * Create Section component with nested content if available
   * @param {Object} svarogComponents - Svarog UI components
   * @returns {Object} - Section component
   */
  async createComponent(svarogComponents) {
    if (!svarogComponents) {
      throw new Error('svarogComponents is required');
    }

    const { Section } = svarogComponents;

    if (!Section) {
      console.warn('Section component not found in Svarog UI');
      return this.createFallbackSection();
    }

    try {
      const props = this.transformProps();

      // Create the section component
      const component = super.createComponent(svarogComponents);

      // If there's nested content and a registry, handle it
      const data = this.storyblokData;
      if (
        this.options.registry &&
        data.body &&
        Array.isArray(data.body) &&
        data.body.length > 0
      ) {
        // Add a method to process body content
        component.processBodyContent = async () => {
          try {
            const sectionElement = component.getElement();

            // Clear placeholder content
            sectionElement.innerHTML = '';

            // Create a content container
            const contentContainer = document.createElement('div');
            contentContainer.className = 'section-content';

            // Add title and description if available
            if (props.title) {
              const titleElement = document.createElement('h2');
              titleElement.textContent = props.title;
              contentContainer.appendChild(titleElement);
            }

            if (props.description) {
              const descriptionElement = document.createElement('p');
              descriptionElement.textContent = props.description;
              contentContainer.appendChild(descriptionElement);
            }

            // Process each content block
            for (const block of data.body) {
              try {
                const blockElement =
                  await this.options.registry.getComponentElement(block);
                if (blockElement) {
                  contentContainer.appendChild(blockElement);
                }
              } catch (blockError) {
                console.error(`Error processing block in section:`, blockError);
              }
            }

            // Add the content container to the section
            sectionElement.appendChild(contentContainer);
          } catch (error) {
            console.error('Error processing section body content:', error);
          }
        };

        // Process content
        await component.processBodyContent();
      }

      return component;
    } catch (error) {
      console.error('Error creating Section component:', error);
      return this.createFallbackSection();
    }
  }

  /**
   * Create a fallback section
   * @returns {Object} - Fallback section with getElement method
   */
  createFallbackSection() {
    const data = this.storyblokData;

    // Create a simple container element
    const element = document.createElement('section');
    element.className = 'fallback-section';
    element.style.padding = '30px 20px';
    element.style.margin = '20px 0';
    element.style.border = '1px solid #eee';
    element.style.borderRadius = '4px';

    // Add title if available
    if (data.title || data.headline) {
      const title = document.createElement('h2');
      title.textContent = data.title || data.headline;
      title.style.marginTop = '0';
      title.style.color = '#fd7e14'; // muchandy theme color
      element.appendChild(title);
    }

    // Add description if available
    if (data.description || data.subheadline) {
      const description = document.createElement('p');
      description.textContent = data.description || data.subheadline;
      element.appendChild(description);
    }

    // Add content if available
    if (data.content || data.text) {
      const content = document.createElement('div');
      content.textContent = data.content || data.text;
      element.appendChild(content);
    }

    // If there's body content, add a placeholder
    if (data.body && Array.isArray(data.body) && data.body.length > 0) {
      const bodyInfo = document.createElement('p');
      bodyInfo.textContent = `This section contains ${data.body.length} component(s) that could not be rendered.`;
      bodyInfo.style.fontStyle = 'italic';
      bodyInfo.style.color = '#666';
      element.appendChild(bodyInfo);
    }

    // Return an object with getElement method
    return {
      getElement: () => element,
    };
  }
}
