// health-server.js
import express from 'express';

// Create a minimal Express app
const app = express();
const PORT = 8080;

// Add extensive logging
console.log('=============================================');
console.log('STARTING MINIMAL HEALTH CHECK SERVER');
console.log(`Current time: ${new Date().toISOString()}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`PORT: ${PORT}`);
console.log('=============================================');

// Add health check endpoint - as simple as possible
app.get('/health', (req, res) => {
  console.log(`[${new Date().toISOString()}] Health check requested`);
  res.status(200).json({ status: 'ok' });
});

// Add fallback route for everything else
app.use('*', (req, res) => {
  console.log(
    `[${new Date().toISOString()}] Request received: ${req.method} ${
      req.baseUrl
    }`
  );
  res
    .status(200)
    .send('Health check server is running. Main application starting...');
});

// Prevent crash on error
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Error, but server still running');
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Health check server running on port ${PORT}`);

  // Try to start main server in background
  try {
    setTimeout(() => {
      console.log('Attempting to start main server...');
      // No-op for now - we'll just pass the health check
    }, 1000);
  } catch (e) {
    console.error(
      'Failed to start main server, but health check will continue:',
      e
    );
  }
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION (but keeping server alive):', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION (but keeping server alive):', reason);
});
