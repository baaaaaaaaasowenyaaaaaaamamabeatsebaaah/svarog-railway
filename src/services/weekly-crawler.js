// src/services/sample-data.js
import { PrismaClient } from '@prisma/client';
import winston from 'winston';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDir = path.join(__dirname, '../../logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(logDir, 'sample-data.log'),
    }),
  ],
});

const prisma = new PrismaClient();

/**
 * Populate the database with sample data for testing purposes
 */
async function populateSampleData() {
  try {
    logger.info('Starting sample data population');

    // Sample data structure
    const sampleData = [
      {
        manufacturer: 'Apple',
        devices: [
          {
            name: 'iPhone 15 Pro Max',
            actions: [
              { name: 'Display Reparatur', price: 429 },
              { name: 'Akku Reparatur', price: 109 },
              { name: 'Rückkamera Reparatur', price: 189 },
              { name: 'Frontkamera Reparatur', price: 129 },
              { name: 'Ladebuchse Reparatur', price: 99 },
            ],
          },
          {
            name: 'iPhone 15 Pro',
            actions: [
              { name: 'Display Reparatur', price: 379 },
              { name: 'Akku Reparatur', price: 109 },
              { name: 'Rückkamera Reparatur', price: 179 },
              { name: 'Frontkamera Reparatur', price: 129 },
              { name: 'Ladebuchse Reparatur', price: 99 },
            ],
          },
          {
            name: 'iPhone 14 Pro Max',
            actions: [
              { name: 'Display Reparatur', price: 399 },
              { name: 'Akku Reparatur', price: 99 },
              { name: 'Rückkamera Reparatur', price: 169 },
              { name: 'Frontkamera Reparatur', price: 119 },
              { name: 'Ladebuchse Reparatur', price: 89 },
            ],
          },
        ],
      },
      {
        manufacturer: 'Samsung',
        devices: [
          {
            name: 'Galaxy S23 Ultra',
            actions: [
              { name: 'Display Reparatur', price: 319 },
              { name: 'Akku Reparatur', price: 89 },
              { name: 'Rückkamera Reparatur', price: 159 },
              { name: 'Frontkamera Reparatur', price: 99 },
              { name: 'Ladebuchse Reparatur', price: 79 },
            ],
          },
          {
            name: 'Galaxy S23+',
            actions: [
              { name: 'Display Reparatur', price: 279 },
              { name: 'Akku Reparatur', price: 89 },
              { name: 'Rückkamera Reparatur', price: 149 },
              { name: 'Frontkamera Reparatur', price: 99 },
              { name: 'Ladebuchse Reparatur', price: 79 },
            ],
          },
          {
            name: 'Galaxy Z Fold 5',
            actions: [
              { name: 'Display Reparatur', price: 499 },
              { name: 'Akku Reparatur', price: 149 },
              { name: 'Rückkamera Reparatur', price: 179 },
              { name: 'Frontkamera Reparatur', price: 129 },
              { name: 'Ladebuchse Reparatur', price: 99 },
            ],
          },
        ],
      },
    ];

    // Process the sample data
    for (const mfr of sampleData) {
      logger.info(`Creating manufacturer: ${mfr.manufacturer}`);

      // Create manufacturer
      const manufacturer = await prisma.manufacturer.upsert({
        where: { name: mfr.manufacturer },
        update: {},
        create: { name: mfr.manufacturer },
      });

      // Process devices
      for (const dev of mfr.devices) {
        logger.info(`Creating device: ${dev.name}`);

        // Create device
        const device = await prisma.device.upsert({
          where: {
            name_manufacturerId: {
              name: dev.name,
              manufacturerId: manufacturer.id,
            },
          },
          update: {},
          create: {
            name: dev.name,
            manufacturerId: manufacturer.id,
          },
        });

        // Process actions
        for (const act of dev.actions) {
          logger.info(`Creating action: ${act.name} with price: ${act.price}`);

          // Create action
          const action = await prisma.action.upsert({
            where: {
              name_deviceId: {
                name: act.name,
                deviceId: device.id,
              },
            },
            update: {},
            create: {
              name: act.name,
              deviceId: device.id,
            },
          });

          // Create price
          await prisma.price.create({
            data: {
              actionId: action.id,
              price: act.price,
              dateCollected: new Date(),
            },
          });
        }
      }
    }

    logger.info('Sample data population completed successfully');
  } catch (error) {
    logger.error('Error populating sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  populateSampleData()
    .then(() => {
      logger.info('Sample data population completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Fatal error in sample data population:', error);
      process.exit(1);
    });
}

export { populateSampleData };
