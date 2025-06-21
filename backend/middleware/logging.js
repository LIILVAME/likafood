const morgan = require('morgan');
const logger = require('../utils/logger');

// Custom token for user ID
morgan.token('user-id', (req) => {
  return req.user ? req.user.id : 'anonymous';
});

// Custom token for request ID
morgan.token('request-id', (req) => {
  return req.id || 'no-id';
});

// Development format - more readable
const developmentFormat = morgan(
  ':method :url :status :res[content-length] - :response-time ms - User: :user-id',
  {
    stream: {
      write: (message) => {
        logger.http(message.trim());
      },
    },
  }
);

// Production format - structured JSON
const productionFormat = morgan(
  JSON.stringify({
    method: ':method',
    url: ':url',
    status: ':status',
    contentLength: ':res[content-length]',
    responseTime: ':response-time',
    userAgent: ':user-agent',
    ip: ':remote-addr',
    userId: ':user-id',
    requestId: ':request-id',
    timestamp: ':date[iso]'
  }),
  {
    stream: {
      write: (message) => {
        try {
          const logData = JSON.parse(message.trim());
          logger.http('HTTP Request', logData);
        } catch (error) {
          logger.http(message.trim());
        }
      },
    },
  }
);

// Export the appropriate format based on environment
module.exports = process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat;

// Security logging middleware
module.exports.securityLogger = (req, res, next) => {
  // Log authentication attempts
  if (req.path.includes('/auth/')) {
    logger.info('Authentication attempt', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }

  // Log failed requests
  const originalSend = res.send;
  res.send = function(data) {
    if (res.statusCode >= 400) {
      logger.warn('Failed request', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        statusCode: res.statusCode,
        userId: req.user ? req.user.id : null,
        timestamp: new Date().toISOString()
      });
    }
    originalSend.call(this, data);
  };

  next();
};

// Request ID middleware
module.exports.requestId = (req, res, next) => {
  req.id = require('crypto').randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
};

// Response time middleware
module.exports.responseTime = (req, res, next) => {
  const start = Date.now();
  
  // Set header before response is sent
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', duration);
    }
    return originalSend.call(this, data);
  };
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        userId: req.user ? req.user.id : null,
        requestId: req.id
      });
    }
  });
  
  next();
};