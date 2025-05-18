// src/api/controllers/deviceController.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Controller for device-related operations
 */
export default class DeviceController {
  /**
   * Get all devices
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async getAll(req, res, next) {
    try {
      const { manufacturerId } = req.query;

      // Build where clause
      const where = {};
      if (manufacturerId) {
        where.manufacturerId = Number(manufacturerId);
      }

      const devices = await prisma.device.findMany({
        where,
        include: {
          manufacturer: true,
        },
        orderBy: { name: 'asc' },
      });

      res.json(devices);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a device by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async getById(req, res, next) {
    try {
      const { id } = req.params;

      const device = await prisma.device.findUnique({
        where: { id: Number(id) },
        include: {
          manufacturer: true,
          actions: true,
        },
      });

      if (!device) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Device with ID ${id} not found`,
        });
      }

      res.json(device);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new device
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async create(req, res, next) {
    try {
      const { name, manufacturerId } = req.body;

      const device = await prisma.device.create({
        data: {
          name,
          manufacturerId: Number(manufacturerId),
        },
        include: {
          manufacturer: true,
        },
      });

      res.status(201).json(device);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a device
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, manufacturerId } = req.body;

      const device = await prisma.device.update({
        where: { id: Number(id) },
        data: {
          name,
          manufacturerId: manufacturerId ? Number(manufacturerId) : undefined,
        },
        include: {
          manufacturer: true,
        },
      });

      res.json(device);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a device
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      await prisma.device.delete({
        where: { id: Number(id) },
      });

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
}
