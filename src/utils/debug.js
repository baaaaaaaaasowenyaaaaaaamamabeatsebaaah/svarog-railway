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
