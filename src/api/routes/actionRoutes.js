// src/api/routes/actionRoutes.js
import { Router } from 'express';
import ActionController from '../controllers/actionController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Apply authentication to all routes in this router
router.use(authenticate);

// Read operations - require authentication
router.get('/', ActionController.getAll);
router.get('/:id', ActionController.getById);

// Write operations - require admin privileges
router.post('/', requireAdmin, ActionController.create);
router.put('/:id', requireAdmin, ActionController.update);
router.delete('/:id', requireAdmin, ActionController.delete);

export default router;
