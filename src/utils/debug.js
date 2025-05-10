// src/utils/debug.js

/**
 * Display debug information about Svarog UI
 * @param {Object} svarogComponents - Loaded Svarog UI components
 */
export function logSvarogInfo(svarogComponents) {
  if (!svarogComponents) {
    console.warn('No Svarog UI components loaded');
    return;
  }

  console.group('Svarog UI Debug Info');

  // Log available components
  console.log('Available components:', Object.keys(svarogComponents));

  // Check for theme manager
  if (svarogComponents.Theme) {
    console.log('Theme manager available:', svarogComponents.Theme);
  } else if (svarogComponents.switchTheme) {
    console.log('Theme switcher available:', svarogComponents.switchTheme);
  } else {
    console.warn('No theme management found in Svarog UI');
  }

  // Check for specific components
  const componentNames = [
    'Header',
    'CollapsibleHeader',
    'Navigation',
    'ContactInfo',
    'Button',
    'Card',
    'Form',
    'Input',
    'Component',
  ];

  console.log('Component availability:');
  componentNames.forEach((name) => {
    console.log(
      `- ${name}: ${svarogComponents[name] ? 'Available' : 'Not found'}`
    );
  });

  console.groupEnd();
}

/**
 * Create a debug panel element
 * @param {Object} svarogComponents - Loaded Svarog UI components
 * @returns {HTMLElement} - Debug panel element
 */
export function createDebugPanel(svarogComponents) {
  const panel = document.createElement('div');
  panel.className = 'debug-panel';
  panel.style.position = 'fixed';
  panel.style.bottom = '10px';
  panel.style.right = '10px';
  panel.style.padding = '10px';
  panel.style.background = 'rgba(0,0,0,0.8)';
  panel.style.color = 'white';
  panel.style.zIndex = '9999';
  panel.style.fontSize = '12px';
  panel.style.borderRadius = '4px';
  panel.style.maxWidth = '300px';
  panel.style.maxHeight = '400px';
  panel.style.overflow = 'auto';

  // Create title
  const title = document.createElement('h3');
  title.textContent = 'Svarog UI Debug';
  title.style.margin = '0 0 10px 0';
  title.style.fontSize = '14px';
  panel.appendChild(title);

  // Create content
  const content = document.createElement('div');

  // Add theme info
  const themeInfo = document.createElement('div');
  themeInfo.style.marginBottom = '10px';
  themeInfo.innerHTML = `
    <strong>Current Theme:</strong> ${
      document.documentElement.className || 'None'
    }<br>
  `;
  content.appendChild(themeInfo);

  // Add component info
  const componentInfo = document.createElement('div');
  componentInfo.innerHTML = '<strong>Available Components:</strong><br>';

  if (svarogComponents) {
    const componentNames = Object.keys(svarogComponents);
    const componentList = document.createElement('ul');
    componentList.style.margin = '5px 0';
    componentList.style.paddingLeft = '20px';

    componentNames.forEach((name) => {
      const item = document.createElement('li');
      item.textContent = name;
      componentList.appendChild(item);
    });

    componentInfo.appendChild(componentList);
  } else {
    componentInfo.innerHTML += 'No components loaded';
  }

  content.appendChild(componentInfo);

  // Add theme selector
  const themeSelector = document.createElement('div');
  themeSelector.style.marginTop = '10px';
  themeSelector.innerHTML = '<strong>Switch Theme:</strong><br>';

  const themes = ['default-theme', 'cabalou-theme', 'muchandy-theme'];
  themes.forEach((theme) => {
    const button = document.createElement('button');
    button.textContent = theme;
    button.style.margin = '5px 5px 0 0';
    button.style.padding = '3px 6px';
    button.style.fontSize = '12px';
    button.addEventListener('click', () => {
      document.documentElement.classList.remove(...themes);
      document.documentElement.classList.add(theme);
      themeInfo.innerHTML = `<strong>Current Theme:</strong> ${theme}<br>`;
    });
    themeSelector.appendChild(button);
  });

  content.appendChild(themeSelector);

  // Add close button
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.style.marginTop = '10px';
  closeButton.style.padding = '5px 10px';
  closeButton.addEventListener('click', () => {
    panel.remove();
  });
  content.appendChild(closeButton);

  panel.appendChild(content);

  return panel;
}

/**
 * Add debug panel to document
 * @param {Object} svarogComponents - Loaded Svarog UI components
 */
export function addDebugPanel(svarogComponents) {
  const panel = createDebugPanel(svarogComponents);
  document.body.appendChild(panel);
}

/**
 * Display debug information about component creation
 * @param {string} componentName - Component name
 * @param {Object} componentData - Storyblok component data
 * @param {Object} svarogComponent - Created Svarog component
 */
export function logComponentCreation(
  componentName,
  componentData,
  svarogComponent
) {
  console.group(`Component Creation: ${componentName}`);

  console.log('Storyblok Data:', componentData);
  console.log('Svarog Component:', svarogComponent);

  if (svarogComponent) {
    console.log(
      'Has getElement method:',
      typeof svarogComponent.getElement === 'function'
    );
    try {
      const element = svarogComponent.getElement();
      console.log('Element:', element);
      console.log('Element type:', element.tagName);
      console.log('Element class:', element.className);
    } catch (error) {
      console.error('Error getting element:', error);
    }
  }

  console.groupEnd();
}

/**
 * Create a debug toolbar for component inspection
 * @returns {HTMLElement} - Debug toolbar element
 */
export function createDebugToolbar() {
  // Create toolbar container
  const toolbar = document.createElement('div');
  toolbar.id = 'debug-toolbar';
  toolbar.style.position = 'fixed';
  toolbar.style.bottom = '0';
  toolbar.style.left = '0';
  toolbar.style.right = '0';
  toolbar.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  toolbar.style.color = 'white';
  toolbar.style.padding = '5px 10px';
  toolbar.style.fontSize = '12px';
  toolbar.style.fontFamily = 'monospace';
  toolbar.style.zIndex = '9999';
  toolbar.style.display = 'flex';
  toolbar.style.justifyContent = 'space-between';
  toolbar.style.alignItems = 'center';

  // Add theme switcher
  const themeSelector = document.createElement('div');
  themeSelector.innerHTML = 'Theme: ';

  ['default-theme', 'cabalou-theme', 'muchandy-theme'].forEach((theme) => {
    const button = document.createElement('button');
    button.textContent = theme.replace('-theme', '');
    button.style.marginLeft = '5px';
    button.style.padding = '3px 5px';
    button.style.background = '#333';
    button.style.color = 'white';
    button.style.border = '1px solid #666';
    button.style.borderRadius = '3px';
    button.style.cursor = 'pointer';
    button.style.fontSize = '10px';

    button.addEventListener('click', () => {
      document.documentElement.classList.remove(
        'default-theme',
        'cabalou-theme',
        'muchandy-theme'
      );
      document.documentElement.classList.add(theme);
      localStorage.setItem('svarog-theme', theme);
      statusText.textContent = `Theme switched to: ${theme}`;
    });

    themeSelector.appendChild(button);
  });

  // Add status text
  const statusText = document.createElement('div');
  statusText.textContent = `Current theme: ${
    document.documentElement.className || 'none'
  }`;

  // Add toggle visibility button
  const toggleButton = document.createElement('button');
  toggleButton.textContent = 'Hide';
  toggleButton.style.padding = '3px 8px';
  toggleButton.style.background = '#333';
  toggleButton.style.color = 'white';
  toggleButton.style.border = '1px solid #666';
  toggleButton.style.borderRadius = '3px';
  toggleButton.style.cursor = 'pointer';

  let isVisible = true;
  toggleButton.addEventListener('click', () => {
    if (isVisible) {
      themeSelector.style.display = 'none';
      statusText.style.display = 'none';
      toolbar.style.padding = '3px';
      toggleButton.textContent = 'Show';
    } else {
      themeSelector.style.display = 'block';
      statusText.style.display = 'block';
      toolbar.style.padding = '5px 10px';
      toggleButton.textContent = 'Hide';
    }
    isVisible = !isVisible;
  });

  // Add elements to toolbar
  toolbar.appendChild(themeSelector);
  toolbar.appendChild(statusText);
  toolbar.appendChild(toggleButton);

  return toolbar;
}

/**
 * Analyze available components in Svarog UI
 * @param {Object} svarogComponents - Svarog UI components
 */
export function analyzeComponents(svarogComponents) {
  if (!svarogComponents) {
    console.warn('No Svarog UI components provided');
    return;
  }

  console.group('Svarog UI Component Analysis');

  console.log(`Found ${Object.keys(svarogComponents).length} components`);

  // Check for specific components
  const componentNames = [
    'Section',
    'Grid',
    'ContactInfo',
    'Header',
    'Card',
    'Button',
  ];

  const results = {};

  componentNames.forEach((name) => {
    const component = svarogComponents[name];
    const result = {
      found: !!component,
      type: component ? typeof component : 'not found',
      isClass:
        component &&
        typeof component === 'function' &&
        /^\s*class\s+/.test(component.toString()),
      methods:
        component && typeof component === 'function'
          ? Object.getOwnPropertyNames(component.prototype || {})
          : [],
      hasGetElement:
        component &&
        typeof component === 'function' &&
        component.prototype &&
        typeof component.prototype.getElement === 'function',
    };

    results[name] = result;

    console.log(`Component "${name}": 
      Found: ${result.found}
      Type: ${result.type}
      Is Class: ${result.isClass}
      Methods: ${result.methods.join(', ')}
      Has getElement: ${result.hasGetElement}
    `);

    // Check for nested components (especially for Grid.Column)
    if (name === 'Grid' && component) {
      console.group('Checking for Grid.Column');

      const hasColumn = component.Column !== undefined;
      console.log(`Grid.Column exists: ${hasColumn}`);

      if (hasColumn) {
        console.log('Type:', typeof component.Column);
        console.log(
          'Is Class:',
          typeof component.Column === 'function' &&
            /^\s*class\s+/.test(component.Column.toString())
        );
      } else {
        // Check if Column might be a property on the prototype
        const gridProto = Object.getPrototypeOf(component);
        const protoHasColumn = gridProto && gridProto.Column !== undefined;

        console.log(`Grid prototype has Column: ${protoHasColumn}`);

        if (protoHasColumn) {
          console.log('Type:', typeof gridProto.Column);
        }
      }

      console.groupEnd();
    }
  });

  console.groupEnd();

  return results;
}
