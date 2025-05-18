// src/api/routes/uniqueManufacturerRoutes.js
import { Router } from 'express';
import UniqueManufacturerController from '../controllers/uniqueManufacturerController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Apply authentication to all routes in this router
router.use(authenticate);

// Read operations - require authentication
router.get('/', UniqueManufacturerController.getAll);
router.get('/:id', UniqueManufacturerController.getById);

// Write operations - require admin privileges
router.post('/', requireAdmin, UniqueManufacturerController.create);
router.put('/:id', requireAdmin, UniqueManufacturerController.update);
router.delete('/:id', requireAdmin, UniqueManufacturerController.delete);

export default router;
