// src/api/controllers/manufacturerController.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Controller for manufacturer-related operations
 */
export default class ManufacturerController {
  /**
   * Get all manufacturers
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async getAll(req, res, next) {
    try {
      const manufacturers = await prisma.manufacturer.findMany({
        orderBy: { name: 'asc' },
      });

      res.json(manufacturers);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a manufacturer by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async getById(req, res, next) {
    try {
      const { id } = req.params;

      const manufacturer = await prisma.manufacturer.findUnique({
        where: { id: Number(id) },
        include: {
          devices: true,
        },
      });

      if (!manufacturer) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Manufacturer with ID ${id} not found`,
        });
      }

      res.json(manufacturer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new manufacturer
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async create(req, res, next) {
    try {
      const { name } = req.body;

      const manufacturer = await prisma.manufacturer.create({
        data: { name },
      });

      res.status(201).json(manufacturer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a manufacturer
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      const manufacturer = await prisma.manufacturer.update({
        where: { id: Number(id) },
        data: { name },
      });

      res.json(manufacturer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a manufacturer
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      await prisma.manufacturer.delete({
        where: { id: Number(id) },
      });

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
}
