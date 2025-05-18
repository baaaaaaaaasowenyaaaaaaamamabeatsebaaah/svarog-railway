// src/api/routes/authRoutes.js
import { Router } from 'express';
import AuthController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Stricter rate limiting for auth routes
const authLimiter = rateLimiter.limit({ windowMs: 15 * 60 * 1000, max: 15 });

// Public routes with rate limiting
router.post('/login', authLimiter, AuthController.login);

// Protected routes - verify is mandatory
router.get('/verify', authenticate, AuthController.verify);

// Status route - only add if the method exists to prevent errors
if (typeof AuthController.status === 'function') {
  router.get('/status', authenticate, AuthController.status);
} else {
  // Fallback status route
  router.get('/status', authenticate, (req, res) => {
    res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
      },
      expiresAt: req.user.exp ? req.user.exp * 1000 : null, // Convert to milliseconds if exp exists
    });
  });
}

export default router;
