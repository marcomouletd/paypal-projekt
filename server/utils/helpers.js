/**
 * Helper functions for the server
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique session key
 * @returns {string} A UUID v4 string
 */
function generateSessionKey() {
  return uuidv4();
}

/**
 * Calculate expiration timestamp
 * @param {number} minutes - Minutes from now
 * @returns {number} Timestamp in milliseconds
 */
function calculateExpirationTime(minutes = 60) {
  return Date.now() + (minutes * 60 * 1000);
}

/**
 * Check if a session has expired
 * @param {number} expiresAt - Expiration timestamp
 * @returns {boolean} True if expired
 */
function isExpired(expiresAt) {
  return Date.now() > expiresAt;
}

/**
 * Format date for display
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} Formatted date string
 */
function formatDate(timestamp) {
  return new Date(timestamp).toLocaleString();
}

module.exports = {
  generateSessionKey,
  calculateExpirationTime,
  isExpired,
  formatDate
};
