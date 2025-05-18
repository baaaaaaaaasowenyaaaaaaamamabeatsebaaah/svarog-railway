// server.js - Modify to make it work as a module

import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './src/api/routes.js';

// Allow for either standalone execution or being imported by railway-start.js
export default function initializeServer() {
  console.log('Initializing main server...');

  // Create a new Express app - it won't conflict with railway-start.js
  // because we're not binding to a port in this function
  const app = express();
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Enhanced security configuration
  const helmetConfig = {
    // Your existing helmet config...
  };

  // Apply middleware
  app.use(helmet(helmetConfig));
  app.use(compression());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Add routes
  app.use('/api', apiRoutes);

  // Serve static files
  app.use(express.static('dist'));

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

  console.log('Main server initialization complete');
  return app;
}

// If this file is run directly (not imported), start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = initializeServer();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}
