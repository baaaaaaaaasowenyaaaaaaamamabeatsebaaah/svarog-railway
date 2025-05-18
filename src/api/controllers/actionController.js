// src/api/controllers/actionController.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Controller for action-related operations
 */
export default class ActionController {
  /**
   * Get all actions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async getAll(req, res, next) {
    try {
      const { deviceId } = req.query;

      // Build where clause
      const where = {};
      if (deviceId) {
        where.deviceId = Number(deviceId);
      }

      const actions = await prisma.action.findMany({
        where,
        include: {
          device: {
            include: {
              manufacturer: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      res.json(actions);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get an action by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async getById(req, res, next) {
    try {
      const { id } = req.params;

      const action = await prisma.action.findUnique({
        where: { id: Number(id) },
        include: {
          device: {
            include: {
              manufacturer: true,
            },
          },
          prices: {
            orderBy: {
              dateCollected: 'desc',
            },
            take: 10,
          },
        },
      });

      if (!action) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Action with ID ${id} not found`,
        });
      }

      res.json(action);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new action
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async create(req, res, next) {
    try {
      const { name, deviceId } = req.body;

      const action = await prisma.action.create({
        data: {
          name,
          deviceId: Number(deviceId),
        },
        include: {
          device: true,
        },
      });

      res.status(201).json(action);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an action
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, deviceId } = req.body;

      const action = await prisma.action.update({
        where: { id: Number(id) },
        data: {
          name,
          deviceId: deviceId ? Number(deviceId) : undefined,
        },
        include: {
          device: true,
        },
      });

      res.json(action);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an action
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      await prisma.action.delete({
        where: { id: Number(id) },
      });

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
}
