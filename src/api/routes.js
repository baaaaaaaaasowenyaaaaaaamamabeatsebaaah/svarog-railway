// src/api/routes.js
import { Router } from 'express';
import authRoutes from './routes/authRoutes.js';
import manufacturerRoutes from './routes/manufacturerRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import actionRoutes from './routes/actionRoutes.js';
import priceRoutes from './routes/priceRoutes.js';
import uniqueManufacturerRoutes from './routes/uniqueManufacturerRoutes.js';
import uniqueDeviceRoutes from './routes/uniqueDeviceRoutes.js';
import { rateLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';
import ConfigController from './controllers/configController.js';

const router = Router();

// Apply rate limiting to all API routes
router.use(rateLimiter.limit());

// API Status
router.get('/status', (req, res) => {
  res.json({
    status: 'API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Public config endpoint - no authentication required
router.get('/config', ConfigController.getPublicConfig);

// Mount routes
router.use('/auth', authRoutes);
router.use('/manufacturers', manufacturerRoutes);
router.use('/devices', deviceRoutes);
router.use('/actions', actionRoutes);
router.use('/prices', priceRoutes);
router.use('/unique-manufacturers', uniqueManufacturerRoutes);
router.use('/unique-devices', uniqueDeviceRoutes);

// Error handler
router.use(errorHandler);

export default router;
