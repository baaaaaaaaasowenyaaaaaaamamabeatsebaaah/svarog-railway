// src/services/repairService.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class RepairService {
  constructor() {
    this.prisma = prisma;
  }

  async getManufacturers() {
    try {
      return await this.prisma.manufacturer.findMany({
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
      throw new Error('Failed to fetch manufacturers');
    }
  }

  async getDevicesByManufacturer(manufacturerId) {
    try {
      const parsedId = parseInt(manufacturerId, 10);
      if (isNaN(parsedId)) {
        throw new Error('Invalid manufacturer ID');
      }

      return await this.prisma.device.findMany({
        where: { manufacturerId: parsedId },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      console.error(
        `Error fetching devices for manufacturer ${manufacturerId}:`,
        error
      );
      throw new Error(
        `Failed to fetch devices for manufacturer ${manufacturerId}`
      );
    }
  }

  async getActionsByDevice(deviceId) {
    try {
      const parsedId = parseInt(deviceId, 10);
      if (isNaN(parsedId)) {
        throw new Error('Invalid device ID');
      }

      return await this.prisma.action.findMany({
        where: { deviceId: parsedId },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      console.error(`Error fetching actions for device ${deviceId}:`, error);
      throw new Error(`Failed to fetch actions for device ${deviceId}`);
    }
  }

  async getPriceForAction(actionId) {
    try {
      const parsedId = parseInt(actionId, 10);
      if (isNaN(parsedId)) {
        throw new Error('Invalid action ID');
      }

      // Find the latest price for this action
      const latestPrice = await this.prisma.price.findFirst({
        where: { actionId: parsedId },
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

      if (!latestPrice) {
        return { price: null, message: 'No price information available' };
      }

      // Format the response with detailed information
      return {
        price: latestPrice.price,
        dateCollected: latestPrice.dateCollected,
        actionId: latestPrice.actionId,
        actionName: latestPrice.action.name,
        deviceId: latestPrice.action.deviceId,
        deviceName: latestPrice.action.device.name,
        manufacturerId: latestPrice.action.device.manufacturerId,
        manufacturerName: latestPrice.action.device.manufacturer.name,
      };
    } catch (error) {
      console.error(`Error fetching price for action ${actionId}:`, error);
      throw new Error(`Failed to fetch price for action ${actionId}`);
    }
  }

  /**
   * Get conditions for a device (for buyback)
   * @param {number} deviceId - Device ID
   * @returns {Promise<Array>} - Array of conditions
   */
  async getConditionsByDevice(deviceId) {
    try {
      const parsedId = parseInt(deviceId, 10);
      if (isNaN(parsedId)) {
        throw new Error('Invalid device ID');
      }

      // Call the API to get conditions for this device
      const response = await fetch(`/api/devices/${parsedId}/conditions`);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch conditions: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching conditions for device ${deviceId}:`, error);
      throw new Error(`Failed to fetch conditions for device ${deviceId}`);
    }
  }

  /**
   * Get buyback price for a condition
   * @param {number} conditionId - Condition ID
   * @returns {Promise<Object>} - Price information
   */
  async getPriceForCondition(conditionId) {
    try {
      const parsedId = parseInt(conditionId, 10);
      if (isNaN(parsedId)) {
        throw new Error('Invalid condition ID');
      }

      // Call the API to get price for this condition
      const response = await fetch(`/api/conditions/${parsedId}/price`);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch price: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(
        `Error fetching price for condition ${conditionId}:`,
        error
      );
      throw new Error(`Failed to fetch price for condition ${conditionId}`);
    }
  }
}

export default new RepairService();
