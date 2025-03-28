/**
 * Express middleware functions
 */

/**
 * Error handling middleware
 */
function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({
    error: 'Server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
}

/**
 * Not found middleware
 */
function notFound(req, res, next) {
  res.status(404).json({
    error: 'Not Found',
    message: `The requested resource at ${req.originalUrl} was not found`
  });
}

/**
 * Request logger middleware
 */
function requestLogger(req, res, next) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
}

module.exports = {
  errorHandler,
  notFound,
  requestLogger
};
