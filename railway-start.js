// railway-start.js
import express from 'express';
import http from 'http';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Setup basic app for health checks
const app = express();
const PORT = process.env.PORT || 8080;

console.log('========== RAILWAY STARTUP ==========');
console.log(`Starting server on port ${PORT}`);
console.log(`Current directory: ${process.cwd()}`);
console.log(`Node version: ${process.version}`);
console.log(`Environment: ${process.env.NODE_ENV || 'not set'}`);

// Very early health check route - this must be available immediately
app.get('/health', (req, res) => {
  console.log(`Health check requested from ${req.ip}`);
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Create and start the server
const server = http.createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Health check server running on port ${PORT}`);

  // Log environment variables (without sensitive data)
  console.log('\nEnvironment Variables:');
  const safeEnvVars = Object.keys(process.env)
    .filter(
      (key) =>
        !key.includes('SECRET') &&
        !key.includes('PASSWORD') &&
        !key.includes('TOKEN')
    )
    .reduce((obj, key) => {
      obj[key] = process.env[key];
      return obj;
    }, {});
  console.log(safeEnvVars);

  // Start the main application in the background
  try {
    console.log('\nStarting main application...');
    // Use dynamic import to load the main server
    import('./server.js')
      .then(() => {
        console.log('Main application started successfully');
      })
      .catch((err) => {
        console.error('Error starting main application:', err);
      });
  } catch (error) {
    console.error('Failed to start main application:', error);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Handle unhandled errors so the server doesn't crash
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  // Don't exit - keep health check running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  // Don't exit - keep health check running
});
