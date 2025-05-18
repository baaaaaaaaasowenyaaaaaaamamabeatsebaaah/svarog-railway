// server.js - update to be importable
import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './src/api/routes.js';

// Create a function that can be imported by server-debug.js
export default function initializeApp(existingApp = null) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Use existing app or create a new one
  const app = existingApp || express();
  const isRailway =
    process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_STATIC_URL;
  const PORT = isRailway ? 8080 : process.env.PORT || 3000;

  console.log(
    `Environment check: Running on Railway? ${isRailway ? 'Yes' : 'No'}`
  );
  console.log(`Setting up server on port: ${PORT}`);

  console.log('Initializing full server configuration...');

  // Enhanced security configuration with Google Fonts
  const helmetConfig = {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
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
          'fonts.googleapis.com', // Add Google Fonts
        ],
        imgSrc: ["'self'", 'data:', '*.storyblok.com', 'cdn.jsdelivr.net'],
        connectSrc: [
          "'self'",
          'api.storyblok.com',
          'cdn.storyblok.com',
          'localhost:*',
          'ws://localhost:*',
        ],
        fontSrc: [
          "'self'",
          'data:',
          'cdn.jsdelivr.net',
          'cdnjs.cloudflare.com',
          'fonts.gstatic.com', // Add Google Fonts storage
        ],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: 'same-origin' },
  };

  // CORS configuration
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

  // Health check endpoint (if not already defined)
  if (!existingApp) {
    app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok' });
    });
  }

  // API routes
  app.use('/api', apiRoutes);

  // Serve static files
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

  // Only start server if not already started by server-debug
  if (!existingApp) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  }

  return app;
}

// Allow direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeApp();
}
