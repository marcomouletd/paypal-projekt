require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const path = require('path');
const morgan = require('morgan');
const fs = require('fs');
const config = require('./config');

// Import routes and services
const apiRoutes = require('./routes/api');
const { initBot } = require('./bot/telegramBot');
const { initDb } = require('./db/database');
const { errorHandler, notFound, requestLogger } = require('./middleware');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with appropriate CORS settings for production
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? config.clientUrl : '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Set up logging based on environment
if (process.env.NODE_ENV === 'production') {
  // Create a write stream for access logs in production
  const accessLogStream = fs.createWriteStream(
    path.join(logDir, 'access.log'),
    { flags: 'a' }
  );
  app.use(morgan('combined', { stream: accessLogStream }));
} else {
  // Use dev format for local development
  app.use(morgan('dev'));
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Make io available to our API routes
app.set('io', io);

// API routes
app.use('/api', apiRoutes);

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('join', (data) => {
    if (data.key) {
      socket.join(data.key);
      console.log(`Client joined room: ${data.key}`);
    }
  });
  
  socket.on('leave', (data) => {
    if (data.key) {
      socket.leave(data.key);
      console.log(`Client left room: ${data.key}`);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set cache headers for static assets
  app.use(express.static(path.join(__dirname, '../client/dist'), {
    maxAge: '1d'
  }));
} else {
  // In development, still serve static files but without caching
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

// Catch-all route for React Router - MUST be before error handlers
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api')) {
    return next();
  }
  
  // Send the React app's index.html for all other routes
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Error handling and 404 middleware - only for API routes now
app.use(notFound);
app.use(errorHandler);

// Initialize database
initDb().then(() => {
  console.log('Database initialized');
  
  // Initialize Telegram bot
  initBot(io);
  
  // Start the server
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Base URL: ${config.baseUrl}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// Export for testing
module.exports = { app, server, io };
