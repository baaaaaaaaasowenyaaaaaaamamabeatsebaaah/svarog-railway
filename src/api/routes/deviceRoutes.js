// src/api/routes/deviceRoutes.js
import { Router } from 'express';
import DeviceController from '../controllers/deviceController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Apply authentication to all routes in this router
router.use(authenticate);

// Read operations - require authentication
router.get('/', DeviceController.getAll);
router.get('/:id', DeviceController.getById);

// Write operations - require admin privileges
router.post('/', requireAdmin, DeviceController.create);
router.put('/:id', requireAdmin, DeviceController.update);
router.delete('/:id', requireAdmin, DeviceController.delete);

export default router;
