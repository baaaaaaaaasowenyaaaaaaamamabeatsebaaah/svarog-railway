// src/api/controllers/authController.js
import { generateToken } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Controller for authentication-related operations
 */
export default class AuthController {
  /**
   * Login a user using environment variables
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async login(req, res, next) {
    try {
      const { username, password } = req.body;

      // Get credentials from environment variables
      const envUsername = process.env.API_USERNAME;
      const envPasswordHash = process.env.API_PASSWORD_HASH;

      // Validate that environment variables are set
      if (!envUsername || !envPasswordHash) {
        console.error(
          'Environment variables for authentication are not properly set'
        );
        return res.status(500).json({
          error: 'Server Configuration Error',
          message: 'Authentication is not properly configured',
        });
      }

      // Check username
      if (username !== envUsername) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid username or password',
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, envPasswordHash);

      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid username or password',
        });
      }

      // Create user object
      const user = {
        id: 1, // Simple ID for env-based auth
        username: envUsername,
        role: 'admin', // Env-based auth users are admins
      };

      // Generate token
      const token = generateToken(user);

      // Return user info and token
      res.json({
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify current token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static verify(req, res) {
    // Auth middleware already verified the token
    res.json({
      user: req.user,
      valid: true,
    });
  }

  /**
   * Check authentication status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static status(req, res) {
    res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
      },
      expiresAt: req.user.exp * 1000, // Convert to milliseconds
    });
  }
}
