// src/api/controllers/authController.js
import { generateToken } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Controller for authentication-related operations
 */
export default class AuthController {
  /**
   * Login a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async login(req, res, next) {
    try {
      const { username, password } = req.body;

      // Find user by username
      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid username or password',
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid username or password',
        });
      }

      // Generate token
      const token = generateToken(user);

      // Return user info and token (omit password)
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register a new user (admin only can create users)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async register(req, res, next) {
    try {
      const { username, password, email, role } = req.body;

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          email,
          role: role || 'user',
        },
      });

      // Return user info (omit password)
      res.status(201).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      // Handle unique constraint violations
      if (error.code === 'P2002') {
        return res.status(409).json({
          error: 'Conflict',
          message: `A user with this ${error.meta.target.join(
            ', '
          )} already exists`,
        });
      }

      next(error);
    }
  }

  /**
   * Get all users (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async getUsers(req, res, next) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json(users);
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
}
