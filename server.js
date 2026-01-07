require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { RateLimiterMemory } = require('rate-limiter-flexible');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting configuration
const rateLimiter = new RateLimiterMemory({
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 || 900,
});

// Apply rate limiting middleware
const rateLimiterMiddleware = (req, res, next) => {
  rateLimiter.consume(req.ip)
    .then(() => {
      next();
    })
    .catch(() => {
      res.status(429).json({
        status: 429,
        success: false,
        message: 'Too many requests, please try again later.'
      });
    });
};

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  }
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept']
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiterMiddleware);

// Static files for status page
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
const apiRoutes = require('./routes/api');
app.use('/api/v2', apiRoutes);

// Root route redirects to status page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 404,
    success: false,
    message: 'Endpoint not found. Please check the API documentation.'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  
  res.status(err.status || 500).json({
    status: err.status || 500,
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════════════╗
  ║                                                          ║
  ║   🎬  MaxMovies Backend API v1.0                        ║
  ║   🚀  Server running on port ${PORT}                    ║
  ║   📡  Environment: ${process.env.NODE_ENV}              ║
  ║   🔗  Base URL: http://localhost:${PORT}                ║
  ║   🔗  API Base: http://localhost:${PORT}/api/v2         ║
  ║   📊  Status: http://localhost:${PORT}/                 ║
  ║                                                          ║
  ║   Available Endpoints:                                   ║
  ║   • GET  /api/v2/homepage                               ║
  ║   • GET  /api/v2/trending                               ║
  ║   • GET  /api/v2/search/{query}                         ║
  ║   • GET  /api/v2/info/{id}                              ║
  ║   • GET  /api/v2/sources/{id}                           ║
  ║   • GET  /api/v2/health   
  ║
  ║        REGARDS TO MAX ✅   
  ║.       SERVER IS ONLINE⚔️
  ╚══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;
