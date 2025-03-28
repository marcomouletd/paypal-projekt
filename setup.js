/**
 * Project Setup Script
 * This script helps initialize the project by:
 * 1. Installing dependencies
 * 2. Creating necessary directories
 * 3. Initializing the database
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  console.log('Creating data directory...');
  fs.mkdirSync(dataDir, { recursive: true });
}

// Install server dependencies
console.log('Installing server dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
} catch (error) {
  console.error('Error installing server dependencies:', error.message);
  process.exit(1);
}

// Install client dependencies
console.log('Installing client dependencies...');
try {
  execSync('cd client && npm install', { stdio: 'inherit' });
} catch (error) {
  console.error('Error installing client dependencies:', error.message);
  process.exit(1);
}

// Initialize database
console.log('Initializing database...');
try {
  execSync('node server/db/init.js', { stdio: 'inherit' });
} catch (error) {
  console.error('Error initializing database:', error.message);
  process.exit(1);
}

console.log('\n✅ Setup completed successfully!');
console.log('\nTo start the development server, run:');
console.log('npm run dev');
console.log('\nThis will start both the backend server and the React frontend.');
console.log('\nIMPORTANT: Before starting, make sure to:');
console.log('1. Set up your .env file with your Telegram bot token and admin chat ID');
console.log('2. Create a bot using BotFather in Telegram and get your token');
console.log('3. Find your chat ID by messaging @userinfobot in Telegram');
