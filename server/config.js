/**
 * Configuration for different environments
 */
const config = {
  development: {
    baseUrl: 'http://localhost:3000',
    clientUrl: 'http://localhost:5173',
  },
  production: {
    baseUrl: 'https://paypal.00secure.de',
    clientUrl: 'https://paypal.00secure.de',
  }
};

// Use NODE_ENV to determine environment, default to development
const env = process.env.NODE_ENV || 'development';
module.exports = config[env];
