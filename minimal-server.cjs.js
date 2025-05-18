// minimal-server-cjs.js
const express = require('express');

// Create minimal express app
const app = express();
const PORT = process.env.PORT || 8080;

// Log all environment variables for debugging (excluding sensitive ones)
console.log('ENVIRONMENT VARIABLES:');
Object.keys(process.env)
  .filter(
    (key) =>
      !key.includes('TOKEN') &&
      !key.includes('SECRET') &&
      !key.includes('PASSWORD')
  )
  .forEach((key) => {
    console.log(`${key}: ${process.env[key]}`);
  });

// Add very simple health check endpoint
app.get('/health', (req, res) => {
  console.log(`[${new Date().toISOString()}] Health check request received`);
  res.status(200).json({
    status: 'ok',
    message: 'Simple health check server is running',
  });
});

// Log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Simple fallback route for everything else
app.use('*', (req, res) => {
  res
    .status(200)
    .send('Server is running in minimal mode to pass health checks');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple server running on port ${PORT}`);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
  // Keep the server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
  // Keep the server running
});
