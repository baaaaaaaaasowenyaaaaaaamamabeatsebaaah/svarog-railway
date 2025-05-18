// src/api/middleware/rateLimit.js

/**
 * Simple in-memory rate limiter
 * For production, consider using Redis-based solution
 */
export default class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  /**
   * Rate limiting middleware
   * @param {Object} options - Rate limiting options
   * @param {number} options.windowMs - Time window in milliseconds
   * @param {number} options.max - Maximum requests per window
   * @returns {Function} - Express middleware
   */
  limit(options = { windowMs: 60000, max: 100 }) {
    const { windowMs, max } = options;

    return (req, res, next) => {
      // Get client identifier (IP address or user ID if authenticated)
      const key = req.user?.id || req.ip;
      const now = Date.now();

      // Get or initialize client entry
      if (!this.requests.has(key)) {
        this.requests.set(key, {
          count: 0,
          resetTime: now + windowMs,
        });
      }

      const client = this.requests.get(key);

      // Reset if time window has passed
      if (now > client.resetTime) {
        client.count = 0;
        client.resetTime = now + windowMs;
      }

      // Increment request count
      client.count += 1;

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': max,
        'X-RateLimit-Remaining': Math.max(0, max - client.count),
        'X-RateLimit-Reset': new Date(client.resetTime).toISOString(),
      });

      // Check if over limit
      if (client.count > max) {
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((client.resetTime - now) / 1000),
        });
      }

      next();
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, client] of this.requests.entries()) {
      if (now > client.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  /**
   * Stop the cleanup interval
   */
  stop() {
    clearInterval(this.cleanupInterval);
  }
}

// Create and export instance
export const rateLimiter = new RateLimiter();
