// src/api/routes/manufacturerRoutes.js
import { Router } from 'express';
import ManufacturerController from '../controllers/manufacturerController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Apply authentication to all routes in this router
router.use(authenticate);

// Read operations - require authentication
router.get('/', ManufacturerController.getAll);
router.get('/:id', ManufacturerController.getById);

// Write operations - require admin privileges
router.post('/', requireAdmin, ManufacturerController.create);
router.put('/:id', requireAdmin, ManufacturerController.update);
router.delete('/:id', requireAdmin, ManufacturerController.delete);

export default router;
