require('dotenv').config();
const express = require('express');
const helmet = require('helmet');

const { connectDB } = require('./config/database');
const { specs, swaggerUi } = require('./config/swagger');
const logger = require('./utils/logger');

// Middleware
const { generalLimiter, authLimiter, otpLimiter, createLimiter } = require('./middleware/rateLimiter');
const corsMiddleware = require('./middleware/cors');
const loggingMiddleware = require('./middleware/logging');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');

// Routes
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const dishRoutes = require('./routes/dishes');
const orderRoutes = require('./routes/orders');
// const expenseRoutes = require('./routes/expenses');
const dashboardRoutes = require('./routes/dashboard');
const monitoringRoutes = require('./routes/monitoring');

// Services
const { metricsMiddleware, startMonitoring } = require('./services/monitoring');

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to MongoDB
connectDB();

// Core Middleware
app.use(helmet());

// Request tracking and logging
app.use(loggingMiddleware.requestId);
app.use(loggingMiddleware.responseTime);
app.use(loggingMiddleware.securityLogger);
app.use(loggingMiddleware);

// Metrics collection
app.use(metricsMiddleware);

// Apply general rate limiting to all API routes
app.use('/api/', generalLimiter);
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'LikaFood API Documentation'
}));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/orders', orderRoutes);
// app.use('/api/expenses', expenseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/monitoring', monitoringRoutes);

// Root Endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🍽️ Welcome to LikaFood API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      docs: '/api/docs'
    }
  });
});

// Error Handling Middleware
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Export app for external use (like Render)
console.log('require.main === module:', require.main === module);
console.log('require.main:', require.main);
console.log('module:', module);
if (require.main === module) {
  // Start server only if this file is run directly
  console.log('Starting server on port:', PORT);
  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info('🚀 LikaFood Backend Server started');
    logger.info(`📡 Server running on port ${PORT}`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔗 API Base URL: http://localhost:${PORT}`);
    logger.info(`❤️  Health Check: http://localhost:${PORT}/api/health`);
    logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    logger.info(`📊 Monitoring: http://localhost:${PORT}/api/monitoring/health`);
    logger.info(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    
    // Start monitoring
    startMonitoring(60000); // Check every minute
    logger.info('📈 Monitoring system started');
    
    logger.info('✅ Server is ready to accept connections!');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`❌ Port ${PORT} is already in use. Please try a different port.`);
      process.exit(1);
    } else {
      logger.error('❌ Server error:', err);
      process.exit(1);
    }
  });
}

module.exports = app;