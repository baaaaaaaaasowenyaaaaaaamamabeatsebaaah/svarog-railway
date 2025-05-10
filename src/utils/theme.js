// src/utils/theme.js

/**
 * Apply a theme to the document
 * @param {string} themeName - Name of the theme to apply
 * @param {Object} svarogUI - Svarog UI library (optional)
 */
export function applyTheme(themeName, svarogUI) {
  console.log(`Applying theme: ${themeName}`);

  // First, try to use Svarog UI's theme manager if available
  if (svarogUI) {
    try {
      // Try different theme management approaches

      // Approach 1: switchTheme function
      if (typeof svarogUI.switchTheme === 'function') {
        console.log('Using Svarog switchTheme function');
        svarogUI.switchTheme(themeName);
        return;
      }

      // Approach 2: Theme object with setTheme method
      if (svarogUI.Theme && typeof svarogUI.Theme.setTheme === 'function') {
        console.log('Using Svarog Theme.setTheme method');
        svarogUI.Theme.setTheme(themeName);
        return;
      }

      // Approach 3: themeManager object with switchTheme method
      if (
        svarogUI.themeManager &&
        typeof svarogUI.themeManager.switchTheme === 'function'
      ) {
        console.log('Using Svarog themeManager.switchTheme method');
        svarogUI.themeManager.switchTheme(themeName);
        return;
      }

      console.warn(
        'No theme management function found in Svarog UI, applying theme manually'
      );
    } catch (error) {
      console.error('Error applying theme through Svarog UI:', error);
    }
  }

  // Fallback: Apply theme class directly to the document element
  console.log('Applying theme manually to document element');

  // Remove existing theme classes
  const themeClasses = ['default-theme', 'cabalou-theme', 'muchandy-theme'];
  document.documentElement.classList.remove(...themeClasses);

  // Add the new theme class
  document.documentElement.classList.add(themeName);

  // Store in local storage for persistence
  try {
    localStorage.setItem('svarog-theme', themeName);
  } catch (e) {
    console.warn('Could not save theme to localStorage:', e);
  }
}

/**
 * Get the current theme
 * @returns {string} - Current theme name
 */
export function getCurrentTheme() {
  // First check document element classes
  const themeClasses = ['default-theme', 'cabalou-theme', 'muchandy-theme'];
  for (const themeClass of themeClasses) {
    if (document.documentElement.classList.contains(themeClass)) {
      return themeClass;
    }
  }

  // Then check localStorage
  try {
    const storedTheme = localStorage.getItem('svarog-theme');
    if (storedTheme) {
      return storedTheme;
    }
  } catch (e) {
    console.warn('Could not read theme from localStorage:', e);
  }

  // Default to muchandy-theme
  return 'muchandy-theme';
}
