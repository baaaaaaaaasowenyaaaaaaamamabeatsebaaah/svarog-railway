// src/components/layout/GridAdapter.js
import ComponentAdapter from '../base/ComponentAdapter.js';
import {
  createSvarogComponent,
  createComponentWrapper,
} from '../../utils/svarogFactory.js';

/**
 * Adapter for Grid component
 */
export class GridAdapter extends ComponentAdapter {
  /**
   * Get the component name to create
   * @returns {string} - Component name
   */
  getComponentName() {
    return 'Grid';
  }

  /**
   * Transform Storyblok data to Svarog component props
   * @returns {Object} - The transformed props
   */
  transformProps() {
    const data = this.storyblokData;

    // Validate alignItems value
    let alignItems = data.align_items || data.alignItems;
    const validAlignValues = ['start', 'end', 'center', 'stretch'];
    if (alignItems && !validAlignValues.includes(alignItems)) {
      console.warn(
        `Invalid alignItems value: ${alignItems}. Must be one of: ${validAlignValues.join(
          ', '
        )}. Using default.`
      );
      alignItems = undefined; // Use default
    }

    // Validate justifyItems value
    let justifyItems = data.justify_items || data.justifyItems;
    const validJustifyValues = ['start', 'end', 'center', 'stretch'];
    if (justifyItems && !validJustifyValues.includes(justifyItems)) {
      console.warn(
        `Invalid justifyItems value: ${justifyItems}. Must be one of: ${validJustifyValues.join(
          ', '
        )}. Using default.`
      );
      justifyItems = undefined; // Use default
    }

    return {
      gap: data.gap || '1rem',
      columnGap: data.column_gap || data.columnGap,
      rowGap: data.row_gap || data.rowGap,
      alignItems: alignItems,
      justifyItems: justifyItems,
      mobileReverse: !!data.mobile_reverse || !!data.mobileReverse,
      reverse: !!data.reverse,
      className: data.className || '',
    };
  }

  /**
   * Create a Grid component with columns
   * @param {Object} svarogComponents - Svarog UI components
   * @returns {Object} - Grid component with columns
   */
  createComponent(svarogComponents) {
    if (!svarogComponents) {
      throw new Error('svarogComponents is required');
    }

    const { Grid, Section } = svarogComponents;

    if (!Grid) {
      console.warn('Grid component not found, falling back to Section');
      return this.createFallbackGrid(svarogComponents);
    }

    try {
      const props = this.transformProps();
      const gridComponent = new Grid(props);

      // Check if gridComponent has getElement method
      if (typeof gridComponent.getElement !== 'function') {
        console.warn('Grid component does not have getElement method');
        return createComponentWrapper(gridComponent, 'Grid');
      }

      // Create a wrapper with additional functionality
      const wrapper = {
        ...gridComponent,
        getElement: () => gridComponent.getElement(),

        // Enhanced addColumns method
        addColumns: async () => {
          try {
            console.log('Adding columns to grid...');

            // Get columns from Storyblok data
            const columns =
              this.storyblokData.columns || this.storyblokData.items || [];

            if (columns.length === 0) {
              console.log('No columns to add');
              return;
            }

            const gridElement = gridComponent.getElement();
            if (!gridElement) {
              console.error('Could not get grid element');
              return;
            }

            // Determine if we can use Grid.Column
            const useNativeColumn = this.canUseNativeColumn(svarogComponents);

            // Process each column
            for (const column of columns) {
              try {
                // Default column width
                const columnWidth = column.width || 12; // Default to full width
                const columnSpan = Math.min(Math.max(1, columnWidth), 12); // Ensure between 1-12

                // Create column using appropriate method
                const columnElement = useNativeColumn
                  ? await this.createNativeColumn(column, svarogComponents)
                  : this.createCustomColumn(column, columnSpan);

                // Add the column to the grid
                if (columnElement) {
                  gridElement.appendChild(columnElement);
                }
              } catch (columnError) {
                console.error('Error creating column:', columnError);
                const errorElement = this.createErrorElement(
                  column,
                  columnError
                );
                gridElement.appendChild(errorElement);
              }
            }

            console.log(`Added ${columns.length} columns to grid`);
          } catch (error) {
            console.error('Error adding columns to grid:', error);
          }
        },
      };

      // If there's a registry available, automatically add columns
      if (
        this.options.registry &&
        (this.storyblokData.columns || this.storyblokData.items)
      ) {
        wrapper.addColumns();
      }

      return wrapper;
    } catch (error) {
      console.error('Error creating Grid component:', error);
      return this.createFallbackGrid(svarogComponents);
    }
  }

  /**
   * Check if we can use native Grid.Column component
   * @param {Object} svarogComponents - Svarog UI components
   * @returns {boolean} - Whether native Grid.Column can be used
   */
  canUseNativeColumn(svarogComponents) {
    // Check for Grid.Column in various places
    if (svarogComponents['Grid.Column']) {
      return true;
    }

    const Grid = svarogComponents.Grid;
    if (Grid && Grid.Column && typeof Grid.Column === 'function') {
      return true;
    }

    return false;
  }

  /**
   * Create a column using native Grid.Column component
   * @param {Object} column - Column data
   * @param {Object} svarogComponents - Svarog UI components
   * @returns {HTMLElement} - Column element
   */
  async createNativeColumn(column, svarogComponents) {
    // Get the Column component
    const Column =
      svarogComponents['Grid.Column'] || svarogComponents.Grid.Column;

    // Create props for column
    const columnProps = {
      width: column.width || 12,
      mobileWidth: column.mobileWidth,
      tabletWidth: column.tabletWidth,
      desktopWidth: column.desktopWidth,
      offset: column.offset,
      desktopOffset: column.desktopOffset,
      children: [], // Will be populated with actual content
    };

    // Create the column component
    const columnComponent = new Column(columnProps);

    // Get the element
    const columnElement = columnComponent.getElement();
    if (!columnElement) {
      throw new Error('Failed to get element from Column component');
    }

    // Add content to column if available
    if (
      column.content &&
      Array.isArray(column.content) &&
      column.content.length > 0 &&
      this.options.registry
    ) {
      for (const block of column.content) {
        try {
          const blockElement = await this.options.registry.getComponentElement(
            block
          );
          if (blockElement) {
            columnElement.appendChild(blockElement);
          }
        } catch (contentError) {
          console.error('Error creating column content:', contentError);
          columnElement.appendChild(
            this.createErrorElement(block, contentError)
          );
        }
      }
    } else if (column.children) {
      // If there's direct children content (string or element)
      const contentElement = document.createElement('div');
      contentElement.innerHTML = column.children;
      columnElement.appendChild(contentElement);
    }

    return columnElement;
  }

  /**
   * Create a custom column element when native Grid.Column is not available
   * @param {Object} column - Column data
   * @param {number} columnSpan - Column span (1-12)
   * @returns {HTMLElement} - Column element
   */
  createCustomColumn(column, columnSpan) {
    // Create column div
    const columnDiv = document.createElement('div');
    columnDiv.className = `grid-column span-${columnSpan}`;
    columnDiv.style.gridColumn = `span ${columnSpan}`;

    // Add responsive styles if available
    if (column.mobileWidth) {
      columnDiv.dataset.mobileWidth = column.mobileWidth;
    }

    if (column.tabletWidth) {
      columnDiv.dataset.tabletWidth = column.tabletWidth;
    }

    // Add any additional column styles
    if (column.offset) {
      columnDiv.style.marginLeft = `${(column.offset / 12) * 100}%`;
    }

    // Add column content if available
    if (
      column.content &&
      Array.isArray(column.content) &&
      column.content.length > 0 &&
      this.options.registry
    ) {
      // We'll handle this asynchronously in a later call
      columnDiv.dataset.hasContent = 'true';
      columnDiv.dataset.contentBlocks = column.content.length;

      // Add a loading indicator
      const loadingElement = document.createElement('div');
      loadingElement.className = 'column-content-loading';
      loadingElement.textContent = 'Loading column content...';
      columnDiv.appendChild(loadingElement);

      // Load content asynchronously
      this.loadColumnContent(columnDiv, column.content).catch((error) => {
        console.error('Error loading column content:', error);
      });
    } else if (column.children) {
      // If there's direct children content (string or element)
      const contentElement = document.createElement('div');
      contentElement.innerHTML = column.children;
      columnDiv.appendChild(contentElement);
    }

    return columnDiv;
  }

  /**
   * Load column content asynchronously
   * @param {HTMLElement} columnElement - Column element
   * @param {Array} contentBlocks - Content blocks
   * @returns {Promise<void>}
   */
  async loadColumnContent(columnElement, contentBlocks) {
    if (
      !columnElement ||
      !contentBlocks ||
      !Array.isArray(contentBlocks) ||
      !this.options.registry
    ) {
      return;
    }

    try {
      // Remove loading indicator if present
      const loadingElement = columnElement.querySelector(
        '.column-content-loading'
      );
      if (loadingElement) {
        loadingElement.remove();
      }

      // Process each content block
      for (const block of contentBlocks) {
        try {
          const blockElement = await this.options.registry.getComponentElement(
            block
          );
          if (blockElement) {
            columnElement.appendChild(blockElement);
          }
        } catch (contentError) {
          console.error('Error creating column content:', contentError);
          columnElement.appendChild(
            this.createErrorElement(block, contentError)
          );
        }
      }
    } catch (error) {
      console.error('Error loading column content:', error);

      // Show error message
      const errorElement = this.createErrorElement(null, error);
      columnElement.appendChild(errorElement);
    }
  }

  /**
   * Create an error element for displaying errors
   * @param {Object} block - Block data
   * @param {Error} error - Error object
   * @returns {HTMLElement} - Error element
   */
  createErrorElement(block, error) {
    const errorElement = document.createElement('div');
    errorElement.className = 'component-error';
    errorElement.style.padding = '10px';
    errorElement.style.margin = '10px 0';
    errorElement.style.border = '1px solid #dc3545';
    errorElement.style.borderRadius = '4px';
    errorElement.style.backgroundColor = '#f8d7da';
    errorElement.style.color = '#721c24';

    const componentType =
      block && block.component ? block.component : 'Unknown component';
    errorElement.textContent = `Error rendering ${componentType}: ${error.message}`;

    return errorElement;
  }

  /**
   * Create a fallback grid when Grid component is not available
   * @param {Object} svarogComponents - Svarog UI components
   * @returns {Object} - Fallback grid component
   */
  createFallbackGrid(svarogComponents) {
    const { Section } = svarogComponents;

    if (Section) {
      try {
        const columns =
          this.storyblokData.columns || this.storyblokData.items || [];
        const sectionProps = {
          title: this.storyblokData.title || 'Grid Section',
          children: `Grid content (${columns ? columns.length : 0} columns)`,
          className: this.storyblokData.className || '',
        };

        return createSvarogComponent('Section', sectionProps, svarogComponents);
      } catch (fallbackError) {
        console.error('Error creating fallback Section:', fallbackError);
      }
    }

    // Create a completely custom fallback
    return {
      getElement: () => {
        const gridElement = document.createElement('div');
        gridElement.className = 'fallback-grid';
        gridElement.style.display = 'grid';
        gridElement.style.gridTemplateColumns = 'repeat(12, 1fr)';
        gridElement.style.gap = this.storyblokData.gap || '1rem';
        gridElement.style.margin = '20px 0';
        gridElement.style.padding = '20px';
        gridElement.style.border = '1px solid #eee';
        gridElement.style.borderRadius = '4px';

        const titleElement = document.createElement('div');
        titleElement.style.gridColumn = 'span 12';
        titleElement.style.marginBottom = '15px';
        titleElement.innerHTML = `<h3 style="margin: 0;">Fallback Grid</h3>`;
        gridElement.appendChild(titleElement);

        const columns =
          this.storyblokData.columns || this.storyblokData.items || [];
        if (columns.length === 0) {
          const emptyMessage = document.createElement('div');
          emptyMessage.style.gridColumn = 'span 12';
          emptyMessage.textContent = 'No columns defined for this grid.';
          gridElement.appendChild(emptyMessage);
        }

        return gridElement;
      },
    };
  }
}
