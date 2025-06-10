const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require('./src/config/db');

// Connect to database
connectDB();

// Initialize app
const app = express();
const server = http.createServer(app);

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Development logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Set security HTTP headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Sanitize data
app.use(mongoSanitize());

// Prevent parameter pollution
app.use(hpp());

// Enable CORS with specific configuration for debugging
app.use(cors({
  origin: function (origin, callback) {
    // Allow any origin during development
    console.log('Request from origin:', origin);
    callback(null, true);
  },
  credentials: true
}));

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Rate limiting (per user account if authenticated, else per IP)
const isProduction = process.env.NODE_ENV === 'production';
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: isProduction ? 500 : 2000, // 500 per 10 min in prod, 2000 in dev
  keyGenerator: (req) => {
    // Use user ID if authenticated, else fallback to IP
    if (req.user && req.user.id) {
      return `user:${req.user.id}`;
    }
    return `ip:${req.ip}`;
  },
  handler: (req, res, next) => {
    const key = req.user && req.user.id ? `user:${req.user.id}` : `ip:${req.ip}`;
    console.warn(`Rate limit exceeded for ${key} on ${req.originalUrl}`);
    res.status(429).json({
      status: 'error',
      message: 'Too many requests, please try again later.'
    });
  }
});

app.use(limiter);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// API versioning prefix
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// Route imports
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const projectRoutes = require('./src/routes/project.routes');
const taskRoutes = require('./src/routes/task.routes');
const fileRoutes = require('./src/routes/file.routes');
const notificationRoutes = require('./src/routes/notification.routes');
const discussionRoutes = require('./src/routes/discussion.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');
const mockS3Routes = require('./src/routes/mock-s3.routes');

// Mount routers
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/projects`, projectRoutes);
app.use(`${API_PREFIX}/tasks`, taskRoutes);
app.use(`${API_PREFIX}/files`, fileRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/discussions`, discussionRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);

// Mount mock S3 routes for development
if (process.env.NODE_ENV === 'development' || !process.env.AWS_ACCESS_KEY_ID) {
  app.use(`${API_PREFIX}/files/mock`, mockS3Routes);
}

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    apiPrefix: API_PREFIX,
    corsEnabled: true,
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
    clientInfo: {
      ip: req.ip,
      headers: req.headers,
    }
  });
});

// Error handler middleware (should be last)
const errorHandler = require('./src/middleware/error/errorHandler');
app.use(errorHandler);

// Define port
const PORT = process.env.PORT || 5500;

// Initialize Socket.IO
const socketService = require('./src/services/socketService');
socketService.initialize(server);

// Initialize Email Service
const emailService = require('./src/services/email.service');

// Start server with async initialization
const startServer = async () => {
  // Initialize email service
  await emailService.initialize();
  
  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log('Socket.IO server initialized');
  });
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = { app, server };
