// scripts/hash-password.js
import bcrypt from 'bcryptjs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function hashPassword() {
  return new Promise((resolve) => {
    rl.question('Enter password to hash: ', async (password) => {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, 10);

      console.log('\nHashed Password:');
      console.log(hash);
      console.log('\nAdd this to your .env file as API_PASSWORD_HASH');

      rl.close();
      resolve();
    });
  });
}

hashPassword().then(() => process.exit(0));
