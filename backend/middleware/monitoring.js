const logger = require('../utils/logger');

// Performance monitoring middleware
const performanceMonitoring = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    
    // Log request details
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id || 'anonymous'
    });
    
    // Log slow requests (> 1 second)
    if (responseTime > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        responseTime: `${responseTime}ms`,
        userId: req.user?.id
      });
    }
    
    // Log errors
    if (res.statusCode >= 400) {
      logger.error('Request error', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        userId: req.user?.id
      });
    }
    
    originalEnd.apply(this, args);
  };
  
  next();
};

// Security monitoring middleware
const securityMonitoring = (req, res, next) => {
  // Log authentication attempts
  if (req.path.includes('/auth/')) {
    logger.info('Authentication attempt', {
      path: req.path,
      method: req.method,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      phoneNumber: req.body?.phoneNumber ? req.body.phoneNumber.substring(0, 5) + '***' : undefined
    });
  }
  
  // Log suspicious activities
  const suspiciousPatterns = [
    /\.\.\//, // Path traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /javascript:/i, // JavaScript injection
  ];
  
  const requestData = JSON.stringify({
    url: req.url,
    body: req.body,
    query: req.query,
    headers: req.headers
  });
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestData)) {
      logger.warn('Suspicious request detected', {
        pattern: pattern.toString(),
        method: req.method,
        url: req.url,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });
      break;
    }
  }
  
  next();
};

// Error tracking middleware
const errorTracking = (err, req, res, next) => {
  // Log the error with context
  logger.error('Unhandled error', {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params
    },
    user: {
      id: req.user?.id,
      phoneNumber: req.user?.phoneNumber
    },
    timestamp: new Date().toISOString()
  });
  
  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Something went wrong. Please try again later.'
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
      stack: err.stack
    });
  }
};

// Health check metrics
const healthMetrics = {
  startTime: Date.now(),
  requestCount: 0,
  errorCount: 0,
  lastError: null,
  
  incrementRequest() {
    this.requestCount++;
  },
  
  incrementError(error) {
    this.errorCount++;
    this.lastError = {
      message: error.message,
      timestamp: new Date().toISOString()
    };
  },
  
  getUptime() {
    return Date.now() - this.startTime;
  },
  
  getStats() {
    return {
      uptime: this.getUptime(),
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate: this.requestCount > 0 ? (this.errorCount / this.requestCount * 100).toFixed(2) + '%' : '0%',
      lastError: this.lastError,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };
  }
};

// Middleware to track metrics
const metricsTracking = (req, res, next) => {
  healthMetrics.incrementRequest();
  
  const originalEnd = res.end;
  res.end = function(...args) {
    if (res.statusCode >= 400) {
      healthMetrics.incrementError(new Error(`HTTP ${res.statusCode}`));
    }
    originalEnd.apply(this, args);
  };
  
  next();
};

module.exports = {
  performanceMonitoring,
  securityMonitoring,
  errorTracking,
  metricsTracking,
  healthMetrics
};