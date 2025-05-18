// src/api/controllers/uniqueDeviceController.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Controller for uniqueDevice-related operations
 */
export default class UniqueDeviceController {
  /**
   * Get all unique devices
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async getAll(req, res, next) {
    try {
      const { uniqueManufacturerId } = req.query;

      // Build where clause
      const where = {};
      if (uniqueManufacturerId) {
        where.uniqueManufacturerId = Number(uniqueManufacturerId);
      }

      const devices = await prisma.uniqueDevice.findMany({
        where,
        include: {
          uniqueManufacturer: true,
        },
        orderBy: { artikelBezeichnung: 'asc' },
      });

      res.json(devices);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a unique device by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async getById(req, res, next) {
    try {
      const { id } = req.params;

      const device = await prisma.uniqueDevice.findUnique({
        where: { id: Number(id) },
        include: {
          uniqueManufacturer: true,
        },
      });

      if (!device) {
        return res.status(404).json({
          error: 'Not Found',
          message: `UniqueDevice with ID ${id} not found`,
        });
      }

      res.json(device);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a unique device by artikelNummer
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async getByArtikelNummer(req, res, next) {
    try {
      const { artikelNummer } = req.params;

      const device = await prisma.uniqueDevice.findUnique({
        where: { artikelNummer },
        include: {
          uniqueManufacturer: true,
        },
      });

      if (!device) {
        return res.status(404).json({
          error: 'Not Found',
          message: `UniqueDevice with artikelNummer ${artikelNummer} not found`,
        });
      }

      res.json(device);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new unique device
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async create(req, res, next) {
    try {
      const {
        artikelNummer,
        artikelBezeichnung,
        ean,
        beschreibung,
        herstellerArtikelNummer,
        einkaufsPreis,
        nettPreis,
        gewicht,
        uniqueManufacturerId,
      } = req.body;

      const device = await prisma.uniqueDevice.create({
        data: {
          artikelNummer,
          artikelBezeichnung,
          ean,
          beschreibung,
          herstellerArtikelNummer,
          einkaufsPreis: Number(einkaufsPreis),
          nettPreis: Number(nettPreis),
          gewicht: gewicht ? Number(gewicht) : null,
          uniqueManufacturerId: Number(uniqueManufacturerId),
        },
        include: {
          uniqueManufacturer: true,
        },
      });

      res.status(201).json(device);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a unique device
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async update(req, res, next) {
    try {
      const { id } = req.params;
      const {
        artikelNummer,
        artikelBezeichnung,
        ean,
        beschreibung,
        herstellerArtikelNummer,
        einkaufsPreis,
        nettPreis,
        gewicht,
        uniqueManufacturerId,
      } = req.body;

      const device = await prisma.uniqueDevice.update({
        where: { id: Number(id) },
        data: {
          artikelNummer,
          artikelBezeichnung,
          ean,
          beschreibung,
          herstellerArtikelNummer,
          einkaufsPreis:
            einkaufsPreis !== undefined ? Number(einkaufsPreis) : undefined,
          nettPreis: nettPreis !== undefined ? Number(nettPreis) : undefined,
          gewicht:
            gewicht !== undefined
              ? gewicht !== null
                ? Number(gewicht)
                : null
              : undefined,
          uniqueManufacturerId: uniqueManufacturerId
            ? Number(uniqueManufacturerId)
            : undefined,
        },
        include: {
          uniqueManufacturer: true,
        },
      });

      res.json(device);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a unique device
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      await prisma.uniqueDevice.delete({
        where: { id: Number(id) },
      });

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
}
