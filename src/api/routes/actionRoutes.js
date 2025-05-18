// src/api/routes/actionRoutes.js
import { Router } from 'express';
import ActionController from '../controllers/actionController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Apply authentication to all routes in this router
router.use(authenticate);

// Defensive route handling
router.get('/', (req, res, next) => {
  try {
    if (typeof ActionController.getAll === 'function') {
      return ActionController.getAll(req, res, next);
    }
    // Fallback if method doesn't exist
    console.warn('ActionController.getAll is not defined');
    return res.json([]);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    if (typeof ActionController.getById === 'function') {
      return ActionController.getById(req, res, next);
    }
    console.warn('ActionController.getById is not defined');
    return res
      .status(404)
      .json({ error: 'Not found', message: 'Method not implemented' });
  } catch (error) {
    next(error);
  }
});

// Similar pattern for other routes
router.post('/', requireAdmin, (req, res, next) => {
  try {
    if (typeof ActionController.create === 'function') {
      return ActionController.create(req, res, next);
    }
    console.warn('ActionController.create is not defined');
    return res.status(501).json({ error: 'Not implemented' });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAdmin, (req, res, next) => {
  try {
    if (typeof ActionController.update === 'function') {
      return ActionController.update(req, res, next);
    }
    console.warn('ActionController.update is not defined');
    return res.status(501).json({ error: 'Not implemented' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAdmin, (req, res, next) => {
  try {
    if (typeof ActionController.delete === 'function') {
      return ActionController.delete(req, res, next);
    }
    console.warn('ActionController.delete is not defined');
    return res.status(501).json({ error: 'Not implemented' });
  } catch (error) {
    next(error);
  }
});

export default router;
