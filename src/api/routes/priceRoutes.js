// src/api/routes/priceRoutes.js
import { Router } from 'express';
import PriceController from '../controllers/priceController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Apply authentication to all routes in this router
router.use(authenticate);

// Read operations - require authentication
router.get('/', PriceController.getAll);
router.get('/latest', PriceController.getLatest);
router.get('/:id', PriceController.getById);

// Write operations - require admin privileges
router.post('/', requireAdmin, PriceController.create);
router.put('/:id', requireAdmin, PriceController.update);
router.delete('/:id', requireAdmin, PriceController.delete);

export default router;
