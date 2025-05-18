// scripts/createAdminUser.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import readline from 'readline';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function createAdminUser() {
  try {
    console.log('\n=== Create Admin User ===\n');

    // Get user input
    const username = await question('Enter admin username: ');
    const email = await question('Enter admin email: ');
    const password = await question(
      'Enter admin password (min 8 characters): '
    );

    if (password.length < 8) {
      console.error('Error: Password must be at least 8 characters long');
      rl.close();
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      console.error('Error: User with this username or email already exists');
      rl.close();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: 'admin',
      },
    });

    console.log('\n✅ Admin user created successfully:');
    console.log({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Run the function
createAdminUser();
