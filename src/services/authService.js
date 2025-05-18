// src/services/authService.js
export default class AuthService {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
    this.loginInProgress = false;

    // Try to load token from localStorage if available
    const storedToken = localStorage.getItem('auth_token');
    const storedExpiry = localStorage.getItem('auth_expiry');

    if (storedToken && storedExpiry && new Date() < new Date(storedExpiry)) {
      this.token = storedToken;
      this.tokenExpiry = new Date(storedExpiry);
      console.log('Loaded stored token from localStorage');
    }
  }

  /**
   * Check if token is valid
   * @returns {boolean} - Whether token is valid
   */
  isTokenValid() {
    return this.token && this.tokenExpiry && new Date() < this.tokenExpiry;
  }

  /**
   * Authenticate with the API
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<string>} - JWT token
   */
  async login(username, password) {
    if (this.loginInProgress) {
      console.log('Login already in progress, waiting...');
      // Wait for existing login to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.loginInProgress && this.isTokenValid()) {
            clearInterval(checkInterval);
            resolve(this.token);
          }
        }, 100);
      });
    }

    this.loginInProgress = true;

    try {
      console.log(`Attempting login with provided credentials`);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        console.error(
          `Authentication failed: ${response.status} ${response.statusText}`
        );
        throw new Error(
          `Authentication failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      console.log('Login successful, token received');

      // Store token and expiry information
      this.token = data.token;

      // Set expiry based on token expiration or default to 1 hour
      if (data.expiresAt) {
        this.tokenExpiry = new Date(data.expiresAt);
      } else {
        this.tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      }

      // Store the token in localStorage for persistence
      localStorage.setItem('auth_token', this.token);
      localStorage.setItem('auth_expiry', this.tokenExpiry.toISOString());

      return this.token;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      this.loginInProgress = false;
    }
  }

  /**
   * Get the current token, refreshing if necessary
   * @returns {Promise<string>} - JWT token
   */
  async getToken() {
    // Check if we have a valid token
    if (this.isTokenValid()) {
      return this.token;
    }

    // Try to get credentials from our config
    try {
      // Get API configuration from our config endpoint
      const configResponse = await fetch('/api/config');
      if (!configResponse.ok) {
        throw new Error('Could not fetch API configuration');
      }

      const config = await configResponse.json();

      // If we have demo mode enabled, try demo login
      if (config.USE_DEMO_AUTH) {
        return this.login('demo', 'demo');
      }

      // Otherwise, prompt the user for credentials
      this.promptUserForCredentials();

      // Return the token if we have one from localStorage (may be null)
      return this.token;
    } catch (error) {
      console.error('Error getting auth token:', error);

      // For development/testing, try admin/admin as last resort
      if (process.env.NODE_ENV === 'development') {
        try {
          return this.login('admin', 'admin');
        } catch (loginError) {
          console.error('Development login failed:', loginError);
        }
      }

      // No valid auth token available
      this.promptUserForCredentials();
      return null;
    }
  }

  /**
   * Prompt the user for credentials
   */
  promptUserForCredentials() {
    // In a real application, you would show a login modal here
    console.warn(
      'Authentication required. Please implement a proper login form.'
    );

    // For now, we'll create a simple alert to get credentials in development
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        alert('API authentication required. Please check console for details.');
        console.info(
          'To authenticate with the API, implement a proper login form or set up demo mode.'
        );
      }, 1000);
    }
  }

  /**
   * Make an authenticated API request
   * @param {string} url - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<any>} - Response data
   */
  async fetchWithAuth(url, options = {}) {
    try {
      const token = await this.getToken();

      if (!token) {
        throw new Error('No authentication token available');
      }

      const headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      };

      if (
        !headers['Content-Type'] &&
        (!options.method ||
          options.method === 'GET' ||
          options.method === 'POST')
      ) {
        headers['Content-Type'] = 'application/json';
      }

      console.log(`Making authenticated request to ${url}`);

      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 errors by attempting to refresh token and retry
      if (response.status === 401) {
        console.log('Received 401, attempting to refresh token and retry');

        // Clear existing token
        this.logout();

        // Show login prompt to get new credentials
        this.promptUserForCredentials();

        throw new Error('Authentication failed. Please login and try again.');
      }

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  }

  /**
   * Logout and clear token
   */
  logout() {
    this.token = null;
    this.tokenExpiry = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_expiry');
    console.log('Logged out, token cleared');
  }
}
