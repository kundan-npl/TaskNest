const express = require('express');
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

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100 // limit each IP to 100 requests per windowMs
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
const debugRoutes = require('./src/routes/debug.routes');

// Import mock S3 routes for testing environment
const mockS3Routes = require('./src/routes/mock-s3.routes');

// Mount routers
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/projects`, projectRoutes);
app.use(`${API_PREFIX}/tasks`, taskRoutes);
app.use(`${API_PREFIX}/files`, fileRoutes);
app.use(`${API_PREFIX}/debug`, debugRoutes);

// Mount mock S3 routes for testing without actual AWS
if (process.env.NODE_ENV === 'test' || process.env.MOCK_S3 === 'true') {
  app.use(`${API_PREFIX}/mock-s3`, mockS3Routes);
  console.log('Mock S3 routes enabled for testing');
}

// Detailed health check route with more debugging information
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

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = server;
