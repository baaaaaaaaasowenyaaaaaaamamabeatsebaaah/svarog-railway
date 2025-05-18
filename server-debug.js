// server-debug.js
import express from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

console.log('=== SERVER STARTUP DIAGNOSTICS ===');
console.log(`Time: ${new Date().toISOString()}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`PORT: ${process.env.PORT || 8080}`);

// Create a minimal Express app first to handle health checks
const app = express();
const PORT = process.env.PORT || 8080;

// Health check endpoint - respond immediately regardless of other initialization
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Health check endpoint is responding',
    time: new Date().toISOString(),
  });
});

// Start the minimal server first
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `Minimal server running on port ${PORT} - health check available`
  );
});

// Check critical environment variables
const requiredVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'API_USERNAME',
  'API_PASSWORD_HASH',
];

console.log('\n=== ENVIRONMENT VARIABLES CHECK ===');
let missingVars = [];
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    missingVars.push(varName);
    console.error(`Missing required environment variable: ${varName}`);
  } else {
    console.log(`✓ ${varName} is set`);
  }
}

// Test database connection if DB_URL is set
async function testDatabaseConnection() {
  console.log('\n=== DATABASE CONNECTION TEST ===');

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set, skipping database connection test');
    return false;
  }

  try {
    console.log('Initializing Prisma client...');
    const prisma = new PrismaClient();

    console.log('Testing database connection...');
    // Try a simple query
    await prisma.$queryRaw`SELECT 1 as result`;
    console.log('✓ Database connection successful');

    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    return false;
  }
}

// Initialize full application
async function initializeFullApp() {
  try {
    console.log('\n=== INITIALIZING FULL APPLICATION ===');

    // Test database connection first
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected && process.env.DATABASE_URL) {
      console.error(
        'Could not connect to database, but continuing initialization'
      );
    }

    // Import main server logic
    console.log('Importing main server...');
    const { default: initializeMainServer } = await import('./server.js');

    console.log('Full application initialization complete');
  } catch (error) {
    console.error('Error during full application initialization:', error);
    // Don't exit - keep the minimal server running for health checks
  }
}

// Run initialization
initializeFullApp();

// Handle process termination properly
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Handle unhandled exceptions and rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit - keep the minimal server running for health checks
});
