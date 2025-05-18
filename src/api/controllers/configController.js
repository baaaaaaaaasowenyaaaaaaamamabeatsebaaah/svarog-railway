// src/api/controllers/configController.js
/**
 * Controller for exposing public configuration to the client
 */
export default class ConfigController {
  /**
   * Get public configuration
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static getPublicConfig(req, res) {
    // Only expose safe, public environment variables
    const publicConfig = {
      STORYBLOK_PUBLIC_TOKEN: process.env.STORYBLOK_PUBLIC_TOKEN || '',
      STORYBLOK_SPACE_ID: process.env.STORYBLOK_SPACE_ID || '',
      NODE_ENV: process.env.NODE_ENV || 'production',
      // Add any other public-safe environment variables here
    };

    res.json(publicConfig);
  }
}
