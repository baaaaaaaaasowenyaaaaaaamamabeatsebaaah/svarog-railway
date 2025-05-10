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

      // If there's a registry available, create child components
      if (this.options.registry && columns.length > 0) {
        // Attach a method to add columns after creation
        wrapper.addColumns = async () => {
          try {
            for (const column of columns) {
              // Default column width
              const columnWidth = column.width || 12; // Default to full width

              // Create column config
              const columnProps = {
                width: columnWidth,
              };

              // Create column component
              const columnComponent = createSvarogComponent(
                'Grid.Column',
                columnProps,
                svarogComponents
              );
              const columnWrapper = createComponentWrapper(
                columnComponent,
                'Grid.Column'
              );

              // Add the column to the grid
              const columnElement = columnWrapper.getElement();

              // Create content for column if it has content blocks
              if (
                column.content &&
                Array.isArray(column.content) &&
                column.content.length > 0
              ) {
                for (const block of column.content) {
                  const blockElement =
                    await this.options.registry.getComponentElement(block);
                  if (blockElement) {
                    columnElement.appendChild(blockElement);
                  }
                }
              }

              // Add the column to the grid
              gridComponent.appendChild(columnElement);
            }
          } catch (error) {
            console.error('Error adding columns to grid:', error);
          }
        };

        // Call the method to add columns
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
