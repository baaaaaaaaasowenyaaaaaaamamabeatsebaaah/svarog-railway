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

    // Fix the variant - only allow "minor" or leave it undefined
    let variant = undefined;
    if (data.variant === 'minor') {
      variant = 'minor';
    }

    return {
      title: data.title || data.headline || '',
      description: data.description || data.subheadline || '',
      children,
      id: data.id || data._uid,
      variant, // Only using 'minor' or undefined
      className: data.className || '',
      noPaddingBottom: !!data.noPaddingBottom,
    };
  }

  /**
   * Create Section component with nested content if available
   * @param {Object} svarogComponents - Svarog UI components
   * @returns {Object} - Section component
   */
  createComponent(svarogComponents) {
    if (!svarogComponents) {
      throw new Error('svarogComponents is required');
    }

    const { Section } = svarogComponents;

    if (!Section) {
      console.error('Section component not found in Svarog UI');
      console.log('Available components:', Object.keys(svarogComponents));
      return this.createFallbackSection();
    }

    try {
      // Prepare props with extra validation to avoid errors
      const rawProps = this.transformProps();

      // Create a clean props object with only the properties the Section component expects
      const props = {
        title: rawProps.title || '',
        description: rawProps.description || '',
        children: rawProps.children || '',
        id: rawProps.id,
        variant: rawProps.variant, // Should be 'minor' or undefined after transformProps
        className: rawProps.className || '',
      };

      // Only add noPaddingBottom if it's a boolean
      if (typeof rawProps.noPaddingBottom === 'boolean') {
        props.noPaddingBottom = rawProps.noPaddingBottom;
      }

      // Log the cleaned props for debugging
      console.log('Creating Section with props:', props);

      // Create a new instance of the Section component
      const sectionInstance = new Section(props);

      // Ensure it has a getElement method
      if (typeof sectionInstance.getElement !== 'function') {
        console.error('Section component does not have a getElement method');
        return this.createFallbackSection();
      }

      // Create a simple wrapper that preserves the getElement method
      const wrapper = {
        ...sectionInstance,
        getElement: () => sectionInstance.getElement(),

        // Add the processBodyContent method for handling nested content
        processBodyContent: async () => {
          const data = this.storyblokData;
          const sectionElement = sectionInstance.getElement();

          if (
            this.options.registry &&
            data.body &&
            Array.isArray(data.body) &&
            data.body.length > 0
          ) {
            try {
              // Find the content container
              const contentContainer =
                sectionElement.querySelector('.section__content');
              if (!contentContainer) {
                console.warn('Could not find .section__content element');
                return;
              }

              // Clear placeholder content if any
              if (
                contentContainer.textContent === 'Loading section content...'
              ) {
                contentContainer.textContent = '';
              }

              // Process each block
              for (const block of data.body) {
                try {
                  const blockElement =
                    await this.options.registry.getComponentElement(block);
                  if (blockElement) {
                    contentContainer.appendChild(blockElement);
                  }
                } catch (blockError) {
                  console.error(
                    'Error processing block in section:',
                    blockError
                  );
                }
              }
            } catch (error) {
              console.error('Error processing section body:', error);
            }
          }
        },
      };

      return wrapper;
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

    // Return a simple object with getElement method
    return {
      getElement: () => element,
    };
  }
}
