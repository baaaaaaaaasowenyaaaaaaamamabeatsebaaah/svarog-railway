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

    return {
      gap: data.gap || '1rem',
      columnGap: data.column_gap || data.columnGap,
      rowGap: data.row_gap || data.rowGap,
      alignItems: data.align_items || data.alignItems,
      justifyItems: data.justify_items || data.justifyItems,
      mobileReverse: !!data.mobile_reverse || !!data.mobileReverse,
      reverse: !!data.reverse,
      className: data.className || '',
    };
  }

  /**
   * Special handling for creating grid component with children
   * @param {Object} svarogComponents - Svarog UI components
   * @returns {Object} - Grid component with children
   */
  createComponent(svarogComponents) {
    if (!svarogComponents) {
      throw new Error('svarogComponents is required');
    }

    const { Grid, Section } = svarogComponents;

    if (!Grid) {
      console.warn('Grid component not found, falling back to Section');
      return super.createComponent(svarogComponents);
    }

    try {
      const props = this.transformProps();
      const gridComponent = createSvarogComponent(
        'Grid',
        props,
        svarogComponents
      );

      // Create a wrapper with additional functionality
      const wrapper = createComponentWrapper(gridComponent, 'Grid');

      // Get columns from Storyblok data
      const columns =
        this.storyblokData.columns || this.storyblokData.items || [];

      // Attach a method to add columns after creation
      wrapper.addColumns = async () => {
        try {
          console.log('Adding columns to grid...');

          if (columns.length === 0) {
            console.log('No columns to add');
            return;
          }

          const gridElement = wrapper.getElement();
          if (!gridElement) {
            console.error('Could not get grid element');
            return;
          }

          // Create DIV column elements instead of trying to use Grid.Column
          for (const column of columns) {
            // Default column width
            const columnWidth = column.width || 12; // Default to full width
            const columnSpan = Math.min(Math.max(1, columnWidth), 12); // Ensure between 1-12

            // Create column div
            const columnDiv = document.createElement('div');
            columnDiv.className = `grid-column span-${columnSpan}`;
            columnDiv.style.gridColumn = `span ${columnSpan}`;

            // Add any additional column styles
            if (column.offset) {
              columnDiv.style.marginLeft = `${(column.offset / 12) * 100}%`;
            }

            // Create content for column if it has content blocks
            if (
              column.content &&
              Array.isArray(column.content) &&
              column.content.length > 0 &&
              this.options.registry
            ) {
              for (const block of column.content) {
                try {
                  const blockElement =
                    await this.options.registry.getComponentElement(block);
                  if (blockElement) {
                    columnDiv.appendChild(blockElement);
                  }
                } catch (contentError) {
                  console.error('Error creating column content:', contentError);

                  // Add error message to the column
                  const errorElement = document.createElement('div');
                  errorElement.className = 'component-error';
                  errorElement.style.padding = '10px';
                  errorElement.style.margin = '10px 0';
                  errorElement.style.border = '1px solid #dc3545';
                  errorElement.style.borderRadius = '4px';
                  errorElement.style.backgroundColor = '#f8d7da';
                  errorElement.style.color = '#721c24';
                  errorElement.textContent = `Error rendering component: ${contentError.message}`;
                  columnDiv.appendChild(errorElement);
                }
              }
            } else if (column.children) {
              // If there's direct children content (string or element)
              const contentElement = document.createElement('div');
              contentElement.innerHTML = column.children;
              columnDiv.appendChild(contentElement);
            }

            // Add the column to the grid
            gridElement.appendChild(columnDiv);
          }

          console.log(`Added ${columns.length} columns to grid`);
        } catch (error) {
          console.error('Error adding columns to grid:', error);
        }
      };

      // If there's a registry available, automatically add columns
      if (this.options.registry && columns.length > 0) {
        wrapper.addColumns();
      }

      return wrapper;
    } catch (error) {
      console.error('Error creating Grid component:', error);

      // Fallback to Section component
      if (Section) {
        try {
          const sectionProps = {
            children: `Grid content (${columns ? columns.length : 0} columns)`,
            title: this.storyblokData.title || 'Grid Section',
            className: this.storyblokData.className || '',
          };

          const sectionComponent = createSvarogComponent(
            'Section',
            sectionProps,
            svarogComponents
          );
          return createComponentWrapper(sectionComponent, 'Section');
        } catch (fallbackError) {
          console.error('Error creating fallback Section:', fallbackError);
        }
      }

      throw error;
    }
  }
}
