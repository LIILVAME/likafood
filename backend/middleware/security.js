const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sanitizeInput, validateEmail } = require('../utils/validation');
const logger = require('../utils/logger');

/**
 * Rate limiting configuration
 */
const rateLimitConfig = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60 // 15 minutes in seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

/**
 * Strict rate limiting for authentication endpoints
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: 15 * 60
  },
  skipSuccessfulRequests: true
});

/**
 * Security headers middleware
 */
const securityHeaders = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:3000']
      }
    },
    crossOriginEmbedderPolicy: false
  }),
  
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:3000',
        'https://likafood-mvp.vercel.app'
      ];
      
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn('CORS blocked request', { origin });
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
];

/**
 * Input validation middleware factory
 */
function validateInput(rules) {
  return (req, res, next) => {
    const errors = [];
    const data = { ...req.body, ...req.query, ...req.params };
    
    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];
      
      // Check required fields
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }
      
      // Skip validation if field is not required and not provided
      if (!rule.required && (value === undefined || value === null || value === '')) {
        continue;
      }
      
      // Type validation
      if (rule.type) {
        switch (rule.type) {
          case 'string':
            if (typeof value !== 'string') {
              errors.push(`${field} must be a string`);
            } else {
              // String length validation
              if (rule.minLength && value.length < rule.minLength) {
                errors.push(`${field} must be at least ${rule.minLength} characters`);
              }
              if (rule.maxLength && value.length > rule.maxLength) {
                errors.push(`${field} must be at most ${rule.maxLength} characters`);
              }
            }
            break;
            
          case 'number':
            if (typeof value !== 'number' || isNaN(value)) {
              errors.push(`${field} must be a number`);
            } else {
              // Number range validation
              if (rule.min !== undefined && value < rule.min) {
                errors.push(`${field} must be at least ${rule.min}`);
              }
              if (rule.max !== undefined && value > rule.max) {
                errors.push(`${field} must be at most ${rule.max}`);
              }
            }
            break;
            
          case 'email':
            if (!validateEmail(value)) {
              errors.push(`${field} must be a valid email`);
            }
            break;
            
          case 'boolean':
            if (typeof value !== 'boolean') {
              errors.push(`${field} must be a boolean`);
            }
            break;
            
          case 'array':
            if (!Array.isArray(value)) {
              errors.push(`${field} must be an array`);
            }
            break;
        }
      }
      
      // Custom validation function
      if (rule.validate && typeof rule.validate === 'function') {
        const customError = rule.validate(value);
        if (customError) {
          errors.push(customError);
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    next();
  };
}

/**
 * Sanitize request body middleware
 */
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitizeInput(obj) : obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }
  
  return sanitized;
}

/**
 * Authentication middleware
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.userId).select('-__v');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }
      
      if (!user.isVerified) {
        return res.status(401).json({
          success: false,
          message: 'Account not verified'
        });
      }
      
      // Add user to request object
      req.user = user;
      req.userId = user._id;
      
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
}

/**
 * Admin middleware (requires authentication first)
 */
function adminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  
  if (req.user.role !== 'admin') {
    logger.warn('Admin access denied', {
      userId: req.user._id,
      role: req.user.role,
      path: req.path
    });
    
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  
  next();
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
async function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-__v');
      
      if (user && user.isVerified) {
        req.user = user;
        req.userId = user._id;
      }
    } catch (error) {
      // Silently ignore auth errors for optional auth
      logger.debug('Optional auth failed:', error.message);
    }
  }
  
  next();
}

/**
 * Request logging middleware
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.userId || 'anonymous'
    };
    
    if (res.statusCode >= 400) {
      logger.warn('HTTP Error', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });
  
  next();
}

/**
 * Error handling middleware
 */
function errorHandler(error, req, res, next) {
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userId: req.userId
  });
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(isDevelopment && { stack: error.stack })
  });
}

module.exports = {
  rateLimitConfig,
  authRateLimit,
  securityHeaders,
  validateInput,
  sanitizeBody,
  authMiddleware,
  adminMiddleware,
  optionalAuthMiddleware,
  requestLogger,
  errorHandler
};