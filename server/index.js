require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const path = require('path');

// Import routes and services
const apiRoutes = require('./routes/api');
const { initBot } = require('./bot/telegramBot');
const { initDb } = require('./db/database');
const { errorHandler, notFound, requestLogger } = require('./middleware');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

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

// Error handling and 404 middleware
app.use(notFound);
app.use(errorHandler);

// Catch-all route to return the React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Initialize database
initDb().then(() => {
  console.log('Database initialized');
  
  // Initialize Telegram bot
  initBot(io);
  
  // Start the server
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// Export for testing
module.exports = { app, server, io };
