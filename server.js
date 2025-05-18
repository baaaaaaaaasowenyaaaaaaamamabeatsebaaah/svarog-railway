// server.js
import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './src/api/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Early in the file, add:
console.log('Server starting...');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT: ${process.env.PORT || 3000}`);

// Early health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Enhanced security configuration
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Add 'unsafe-eval' to scriptSrc
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        'cdn.jsdelivr.net',
        'cdnjs.cloudflare.com',
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'cdn.jsdelivr.net',
        'cdnjs.cloudflare.com',
      ],
      imgSrc: ["'self'", 'data:', '*.storyblok.com', 'cdn.jsdelivr.net'],
      // Expand connectSrc to include localhost and any API endpoints
      connectSrc: [
        "'self'",
        'api.storyblok.com',
        'cdn.storyblok.com',
        'localhost:*',
        'ws://localhost:*',
      ],
      fontSrc: ["'self'", 'data:', 'cdn.jsdelivr.net', 'cdnjs.cloudflare.com'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'same-origin' },
};

// CORS configuration with more restrictive settings for production
const corsOptions = {
  origin:
    process.env.NODE_ENV === 'production'
      ? [process.env.ALLOWED_ORIGIN || 'http://localhost:3000']
      : true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

// Apply middleware
app.use(helmet(helmetConfig));
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy if behind a reverse proxy
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// API routes
app.use('/api', apiRoutes);

// Serve static files - with cache control for production
if (process.env.NODE_ENV === 'production') {
  app.use(
    express.static('dist', {
      maxAge: '1d',
      setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      },
    })
  );
} else {
  app.use(express.static('dist'));
}

// Handle all non-API routes
app.get('*', (req, res, next) => {
  // Skip API routes which should be handled by the API router
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Central error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message:
      process.env.NODE_ENV === 'production'
        ? 'Something went wrong'
        : err.message,
  });
});

// ONLY ONE app.listen - at the end after all configuration
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // In production, you might want to restart the process here
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});
