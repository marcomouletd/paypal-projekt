/**
 * Database initialization script
 * Run this script to create the database and tables
 */

const { initDb } = require('./database');

// Initialize the database
initDb()
  .then(() => {
    console.log('Database initialized successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error initializing database:', err);
    process.exit(1);
  });
