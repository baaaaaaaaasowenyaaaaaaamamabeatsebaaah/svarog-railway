// src/api/controllers/priceController.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Controller for price-related operations
 */
export default class PriceController {
  /**
   * Get all prices
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async getAll(req, res, next) {
    try {
      const { actionId, startDate, endDate } = req.query;

      // Build where clause
      const where = {};
      if (actionId) {
        where.actionId = Number(actionId);
      }

      // Add date filters if provided
      if (startDate || endDate) {
        where.dateCollected = {};

        if (startDate) {
          where.dateCollected.gte = new Date(startDate);
        }

        if (endDate) {
          where.dateCollected.lte = new Date(endDate);
        }
      }

      const prices = await prisma.price.findMany({
        where,
        include: {
          action: {
            include: {
              device: {
                include: {
                  manufacturer: true,
                },
              },
            },
          },
        },
        orderBy: {
          dateCollected: 'desc',
        },
      });

      res.json(prices);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get latest prices for all actions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async getLatest(req, res, next) {
    try {
      // Get all actions
      const actions = await prisma.action.findMany();

      // For each action, get the latest price
      const latestPrices = await Promise.all(
        actions.map(async (action) => {
          const latestPrice = await prisma.price.findFirst({
            where: { actionId: action.id },
            orderBy: { dateCollected: 'desc' },
            include: {
              action: {
                include: {
                  device: {
                    include: {
                      manufacturer: true,
                    },
                  },
                },
              },
            },
          });

          return latestPrice;
        })
      );

      // Filter out nulls (actions with no prices)
      const filteredPrices = latestPrices.filter(Boolean);

      res.json(filteredPrices);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a price by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async getById(req, res, next) {
    try {
      const { id } = req.params;

      const price = await prisma.price.findUnique({
        where: { id: Number(id) },
        include: {
          action: {
            include: {
              device: {
                include: {
                  manufacturer: true,
                },
              },
            },
          },
        },
      });

      if (!price) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Price with ID ${id} not found`,
        });
      }

      res.json(price);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new price
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async create(req, res, next) {
    try {
      const { actionId, price, dateCollected } = req.body;

      const priceRecord = await prisma.price.create({
        data: {
          actionId: Number(actionId),
          price: price !== null ? Number(price) : null,
          dateCollected: dateCollected ? new Date(dateCollected) : new Date(),
        },
        include: {
          action: true,
        },
      });

      res.status(201).json(priceRecord);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a price
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const { price, dateCollected } = req.body;

      const priceRecord = await prisma.price.update({
        where: { id: Number(id) },
        data: {
          price: price !== null ? Number(price) : null,
          dateCollected: dateCollected ? new Date(dateCollected) : undefined,
        },
        include: {
          action: true,
        },
      });

      res.json(priceRecord);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a price
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      await prisma.price.delete({
        where: { id: Number(id) },
      });

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
}
