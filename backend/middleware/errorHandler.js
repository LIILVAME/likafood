const logger = require('../utils/logger');

const notFoundHandler = (req, res, next) => {
  logger.warn('404 - Endpoint not found', {
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user ? req.user.id : null,
    requestId: req.id
  });

  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    requestId: req.id
  });
};

const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  const isOperational = err.isOperational || false;
  
  // Log error with full context
  const errorContext = {
    message: err.message,
    stack: err.stack,
    statusCode,
    isOperational,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user ? req.user.id : null,
    requestId: req.id,
    body: req.body,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString()
  };

  // Log based on severity
  if (statusCode >= 500) {
    logger.error('Server Error', errorContext);
  } else if (statusCode >= 400) {
    logger.warn('Client Error', errorContext);
  } else {
    logger.info('Error handled', errorContext);
  }

  // Prepare response
  const response = {
    success: false,
    message: err.message || 'Internal Server Error',
    statusCode,
    timestamp: new Date().toISOString(),
    requestId: req.id
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = errorContext;
  }

  // Add validation errors if present
  if (err.name === 'ValidationError') {
    response.validationErrors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));
  }

  res.status(statusCode).json(response);
};

module.exports = { notFoundHandler, globalErrorHandler };