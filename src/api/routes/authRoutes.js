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

// Protected routes
router.get('/verify', authenticate, AuthController.verify);
router.get('/status', authenticate, AuthController.status);

export default router;
