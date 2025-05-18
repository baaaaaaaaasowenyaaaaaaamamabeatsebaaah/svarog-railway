// src/api/routes/uniqueDeviceRoutes.js
import { Router } from 'express';
import UniqueDeviceController from '../controllers/uniqueDeviceController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Apply authentication to all routes in this router
router.use(authenticate);

// Read operations - require authentication
router.get('/', UniqueDeviceController.getAll);
router.get('/:id', UniqueDeviceController.getById);
router.get(
  '/article/:artikelNummer',
  UniqueDeviceController.getByArtikelNummer
);

// Write operations - require admin privileges
router.post('/', requireAdmin, UniqueDeviceController.create);
router.put('/:id', requireAdmin, UniqueDeviceController.update);
router.delete('/:id', requireAdmin, UniqueDeviceController.delete);

export default router;
