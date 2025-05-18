// src/services/weekly-crawler.js
import { PrismaClient } from '@prisma/client';
import puppeteer from 'puppeteer';
import winston from 'winston';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Removed cron import

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
      filename: path.join(logDir, 'weekly-crawler.log'),
    }),
  ],
});

const prisma = new PrismaClient();

/**
 * Configuration for crawler
 */
const config = {
  baseUrl: 'https://www.smartphonereparatur-muenchen.de/',
  userAgent: 'ghost/1.0 (+https://muchandy.de)', // Good that you included contact info
  requestDelay: 2500, // Increased from 1000ms to 2500ms (2.5 seconds)
  maxRetries: 3,
  // Add manufacturer limit to further reduce load if needed
  maxManufacturers: 0, // 0 means no limit, set to a number to limit
  // Add concurrency limit (keep at 1 to avoid parallel requests)
  concurrency: 1,
};

/**
 * Helper function to implement exponential backoff
 */
async function retry(
  fn,
  retries = config.maxRetries,
  delay = 1000,
  backoff = 2
) {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    logger.warn(
      `Retrying after error: ${error.message}. Retries left: ${retries}`
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * backoff);
  }
}

/**
 * Run crawler to fetch repair price data
 */
async function runCrawler() {
  let browser;
  try {
    logger.info('Starting price data crawler');
    logger.info(`Using delay between requests: ${config.requestDelay}ms`);

    // Options for browser launch, adjusted for server environments
    const options = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
      ],
    };

    // Launch the browser with the specified options
    browser = await puppeteer.launch(options);
    const page = await browser.newPage();

    // Set a reasonable timeout for navigation
    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(20000);

    // Monitor for any console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        logger.warn(`Console error: ${msg.text()}`);
      }
    });

    // Set user agent with contact information
    await page.setUserAgent(config.userAgent);

    // Navigate to the site using retry mechanism
    await retry(async () => {
      await page.goto(config.baseUrl, { waitUntil: 'networkidle2' });
      logger.info(`Navigated to ${config.baseUrl}`);
    });

    // Wait for calculator form with retry
    await retry(async () => {
      await page.waitForSelector('.calculator-wrapper', { timeout: 10000 });
      logger.info('Calculator form loaded');
    });

    const manufacturerOptions = await page.evaluate(() => {
      const select = document.querySelector('#manufacturer');
      return Array.from(select.options)
        .filter((option) => option.value)
        .map((option) => ({
          value: option.value,
          text: option.textContent.trim(),
        }));
    });

    logger.info(`Extracted ${manufacturerOptions.length} manufacturers`);

    // Optionally limit the number of manufacturers to reduce server load
    let manufacturers = manufacturerOptions;
    if (
      config.maxManufacturers > 0 &&
      manufacturers.length > config.maxManufacturers
    ) {
      logger.info(
        `Limiting to ${config.maxManufacturers} manufacturers to reduce server load`
      );
      manufacturers = manufacturers.slice(0, config.maxManufacturers);
    }

    // Process each manufacturer with more conservative rate limiting
    for (const manufacturer of manufacturers) {
      try {
        // Upsert manufacturer
        const manufacturerRecord = await prisma.manufacturer.upsert({
          where: { name: manufacturer.text },
          update: {},
          create: { name: manufacturer.text },
        });
        logger.info(`Processing manufacturer: ${manufacturer.text}`);

        // Select manufacturer with retry
        await retry(async () => {
          await page.select('#manufacturer', manufacturer.value);
          await page.waitForFunction(
            () => document.querySelector('#device').options.length > 1,
            { timeout: 10000 }
          );
        });

        await delay(config.requestDelay); // Conservative delay between actions

        const deviceOptions = await page.evaluate(() => {
          const select = document.querySelector('#device');
          return Array.from(select.options)
            .filter((option) => option.value)
            .map((option) => ({
              value: option.value,
              text: option.textContent.trim(),
            }));
        });

        logger.info(
          `Found ${deviceOptions.length} devices for manufacturer ${manufacturer.text}`
        );

        // Process each device
        for (const device of deviceOptions) {
          try {
            let deviceRecord = await prisma.device.findFirst({
              where: {
                name: device.text,
                manufacturerId: manufacturerRecord.id,
              },
            });

            if (!deviceRecord) {
              deviceRecord = await prisma.device.create({
                data: {
                  name: device.text,
                  manufacturerId: manufacturerRecord.id,
                },
              });
            }

            logger.info(`Processing device: ${device.text}`);

            // Select device with retry
            await retry(async () => {
              await page.select('#device', device.value);
              await page.waitForFunction(
                () => document.querySelector('#action').options.length > 1,
                { timeout: 10000 }
              );
            });

            await delay(config.requestDelay); // Conservative delay between actions

            const actionOptions = await page.evaluate(() => {
              const select = document.querySelector('#action');
              return Array.from(select.options)
                .filter((option) => option.value)
                .map((option) => ({
                  value: option.value,
                  text: option.textContent.trim(),
                }));
            });

            logger.info(
              `Found ${actionOptions.length} actions for device ${device.text}`
            );

            // Process each action
            for (const action of actionOptions) {
              try {
                let actionRecord = await prisma.action.findFirst({
                  where: {
                    name: action.text,
                    deviceId: deviceRecord.id,
                  },
                });

                if (!actionRecord) {
                  actionRecord = await prisma.action.create({
                    data: {
                      name: action.text,
                      deviceId: deviceRecord.id,
                    },
                  });
                }

                logger.info(`Processing action: ${action.text}`);

                // Select action with retry
                await retry(async () => {
                  await page.select('#action', action.value);
                  await page.waitForFunction(
                    () => {
                      const priceElement =
                        document.querySelector('#final-price');
                      return (
                        priceElement && priceElement.textContent.trim() !== ''
                      );
                    },
                    { timeout: 10000 }
                  );
                });

                let priceText = await page.evaluate(() => {
                  const priceElement = document.querySelector('#final-price');
                  return priceElement
                    ? priceElement.textContent.trim()
                    : 'Price not available';
                });

                const priceNumber = extractPriceNumber(priceText);

                logger.info(`Processed Price: ${priceNumber}`);

                try {
                  await prisma.price.create({
                    data: {
                      actionId: actionRecord.id,
                      price: priceNumber,
                      dateCollected: new Date(),
                    },
                  });
                } catch (error) {
                  logger.error(
                    `Error saving price for action: ${action.text} on device: ${device.text}`,
                    error
                  );
                }

                // Conservative delay between actions
                await delay(config.requestDelay);
              } catch (actionError) {
                logger.error(
                  `Error processing action ${action.text}:`,
                  actionError
                );
                // Continue with next action even if this one fails
                await delay(config.requestDelay * 2); // Extra delay after error
              }
            }
          } catch (deviceError) {
            logger.error(
              `Error processing device ${device.text}:`,
              deviceError
            );
            // Continue with next device even if this one fails
            await delay(config.requestDelay * 2); // Extra delay after error
          }
        }
      } catch (manufacturerError) {
        logger.error(
          `Error processing manufacturer ${manufacturer.text}:`,
          manufacturerError
        );
        // Continue with next manufacturer even if this one fails
        await delay(config.requestDelay * 2); // Extra delay after error
      }
    }

    logger.info('Crawler completed successfully');
  } catch (error) {
    logger.error('An error occurred during crawling:', error);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        logger.error('Error closing browser:', closeError);
      }
    }

    try {
      await prisma.$disconnect();
    } catch (dbError) {
      logger.error('Error disconnecting from database:', dbError);
    }

    logger.info('Browser and database connections closed');
  }
}

/**
 * Helper function to extract price number from text
 */
function extractPriceNumber(priceText) {
  if (!priceText || priceText.toLowerCase().includes('not available')) {
    return null;
  }
  const price = priceText.replace(/\D/g, '');
  const priceNumber = parseInt(price, 10);
  return isNaN(priceNumber) ? null : priceNumber;
}

/**
 * Helper function to add delay
 */
function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

// If called directly, run the crawler once
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCrawler()
    .then(() => {
      logger.info('Crawler execution completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Fatal error in crawler execution:', error);
      process.exit(1);
    });
}

export { runCrawler };
