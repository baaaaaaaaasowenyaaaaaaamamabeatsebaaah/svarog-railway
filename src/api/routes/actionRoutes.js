// src/api/routes/actionRoutes.js
import { Router } from 'express';
import ActionController from '../controllers/actionController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Apply authentication to all routes in this router
router.use(authenticate);

// Add defensive checks to all routes
// Read operations - require authentication
router.get(
  '/',
  typeof ActionController.getAll === 'function'
    ? ActionController.getAll
    : (req, res) => res.json([])
);

router.get(
  '/:id',
  typeof ActionController.getById === 'function'
    ? ActionController.getById
    : (req, res) =>
        res
          .status(404)
          .json({
            error: 'Not Found',
            message: 'Controller method not implemented',
          })
);

// Write operations - require admin privileges
router.post(
  '/',
  requireAdmin,
  typeof ActionController.create === 'function'
    ? ActionController.create
    : (req, res) =>
        res
          .status(501)
          .json({
            error: 'Not Implemented',
            message: 'Controller method not implemented',
          })
);

router.put(
  '/:id',
  requireAdmin,
  typeof ActionController.update === 'function'
    ? ActionController.update
    : (req, res) =>
        res
          .status(501)
          .json({
            error: 'Not Implemented',
            message: 'Controller method not implemented',
          })
);

router.delete(
  '/:id',
  requireAdmin,
  typeof ActionController.delete === 'function'
    ? ActionController.delete
    : (req, res) =>
        res
          .status(501)
          .json({
            error: 'Not Implemented',
            message: 'Controller method not implemented',
          })
);

export default router;
