// src/services/apiService.js
export default class ApiService {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;

    // Get API credentials from environment variables
    this.username = process.env.API_USERNAME || 'admin';
    this.password = process.env.API_PASSWORD || '';

    if (!this.password) {
      console.warn(
        'API_PASSWORD not found in environment variables. Authentication will likely fail.'
      );
    }

    // Try to load token from localStorage if available
    const storedToken = localStorage.getItem('auth_token');
    const storedExpiry = localStorage.getItem('auth_expiry');

    if (storedToken && storedExpiry && new Date() < new Date(storedExpiry)) {
      this.token = storedToken;
      this.tokenExpiry = new Date(storedExpiry);
      console.log('Using stored authentication token');
    }
  }

  /**
   * Authenticate with the API
   * @returns {Promise<string>} - JWT token
   */
  async authenticate() {
    // If we already have a valid token, use it
    if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.token;
    }

    try {
      console.log('Authenticating with API...');

      // Use credentials from environment variables
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.username,
          password: this.password,
        }),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const data = await response.json();

      console.log('Authentication successful, token received');

      // Store token and expiry
      this.token = data.token;

      // Set expiry from token or default to 1 hour
      if (data.expiresAt) {
        this.tokenExpiry = new Date(data.expiresAt);
      } else {
        this.tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      }

      // Store in localStorage for persistence
      localStorage.setItem('auth_token', this.token);
      localStorage.setItem('auth_expiry', this.tokenExpiry.toISOString());

      return this.token;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  /**
   * Make an authenticated API request
   * @param {string} url - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<any>} - Response data
   */
  async apiRequest(url, options = {}) {
    try {
      const token = await this.authenticate();

      const headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(url, {
        ...options,
        headers,
      });

      // If token expired, clear it and try again
      if (response.status === 401) {
        console.log('Token expired, clearing and trying again');
        this.token = null;
        this.tokenExpiry = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_expiry');

        return this.apiRequest(url, options);
      }

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request error (${url}):`, error);
      throw error;
    }
  }

  // Implement the methods expected by the form components

  /**
   * Fetch all manufacturers
   */
  async fetchManufacturers() {
    return this.apiRequest('/api/manufacturers');
  }

  /**
   * Fetch devices by manufacturer
   */
  async fetchDevicesByManufacturer(manufacturerId) {
    return this.apiRequest(`/api/devices?manufacturerId=${manufacturerId}`);
  }

  /**
   * Fetch actions by device
   */
  async fetchActionsByDevice(deviceId) {
    return this.apiRequest(`/api/actions?deviceId=${deviceId}`);
  }

  /**
   * Fetch price for action
   */
  async fetchPriceForAction(actionId) {
    const prices = await this.apiRequest(
      `/api/prices/latest?actionId=${actionId}`
    );

    // Find the price for the specific action
    const actionPrice = Array.isArray(prices)
      ? prices.find(
          (price) => price.action && price.action.id === Number(actionId)
        )
      : null;

    if (!actionPrice) {
      return { price: null, message: 'No price information available' };
    }

    return {
      price: actionPrice.price,
      dateCollected: actionPrice.dateCollected,
      actionId: actionPrice.action.id,
      actionName: actionPrice.action.name,
      deviceId: actionPrice.action.device.id,
      deviceName: actionPrice.action.device.name,
      manufacturerId: actionPrice.action.device.manufacturer.id,
      manufacturerName: actionPrice.action.device.manufacturer.name,
    };
  }

  /**
   * Fetch conditions by device (uses actions as conditions)
   */
  async fetchConditionsByDevice(deviceId) {
    const actions = await this.fetchActionsByDevice(deviceId);

    // Map actions to conditions for the buyback form
    return actions.map((action) => ({
      id: action.id,
      name: action.name,
      description: `Condition for ${action.name}`,
    }));
  }

  /**
   * Fetch price for condition (uses action price)
   */
  async fetchPriceForCondition(conditionId) {
    return this.fetchPriceForAction(conditionId);
  }
}
