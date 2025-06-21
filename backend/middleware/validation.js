const { body, param, query, validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    logger.warn('Validation failed', {
      errors: validationErrors,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userId: req.user ? req.user.id : null,
      requestId: req.id,
      body: req.body,
      params: req.params,
      query: req.query
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validationErrors,
      requestId: req.id,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// Common validation rules
const validationRules = {
  // User validation
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
  name: body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
    
  // Dish validation
  dishName: body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Dish name must be between 2 and 100 characters'),
    
  dishPrice: body('price')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number'),
    
  dishDescription: body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
    
  dishCategory: body('category')
    .trim()
    .isIn(['appetizer', 'main', 'dessert', 'beverage', 'side'])
    .withMessage('Category must be one of: appetizer, main, dessert, beverage, side'),
    
  // Order validation
  orderItems: body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
    
  orderItemId: body('items.*.dishId')
    .isMongoId()
    .withMessage('Invalid dish ID'),
    
  orderItemQuantity: body('items.*.quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100'),
    
  // Expense validation
  expenseAmount: body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
    
  expenseDescription: body('description')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Description must be between 3 and 200 characters'),
    
  expenseCategory: body('category')
    .trim()
    .isIn(['ingredients', 'equipment', 'utilities', 'marketing', 'staff', 'rent', 'other'])
    .withMessage('Invalid expense category'),
    
  // Common ID validation
  mongoId: param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
    
  // Pagination validation
  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  // Date validation
  dateRange: [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date')
  ]
};

// Validation rule sets for different endpoints
const validationSets = {
  // Auth validations
  loginOrRegister: [
    body('phoneNumber')
      .notEmpty()
      .withMessage('Phone number is required')
      .isLength({ min: 10, max: 15 })
      .withMessage('Phone number must be between 10-15 digits')
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Invalid phone number format'),
    body('businessName')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Business name must be between 2-100 characters')
      .trim(),
    body('ownerName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Owner name must be between 2-50 characters')
      .trim(),
    handleValidationErrors
  ],
  
  register: [
    validationRules.name,
    validationRules.email,
    validationRules.password,
    handleValidationErrors
  ],
  
  login: [
    validationRules.email,
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors
  ],
  
  // Dish validations
  createDish: [
    validationRules.dishName,
    validationRules.dishPrice,
    validationRules.dishDescription,
    validationRules.dishCategory,
    handleValidationErrors
  ],
  
  updateDish: [
    validationRules.mongoId,
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('price').optional().isFloat({ min: 0.01 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('category').optional().isIn(['appetizer', 'main', 'dessert', 'beverage', 'side']),
    handleValidationErrors
  ],
  
  // Order validations
  createOrder: [
    validationRules.orderItems,
    validationRules.orderItemId,
    validationRules.orderItemQuantity,
    handleValidationErrors
  ],
  
  // Expense validations
  createExpense: [
    validationRules.expenseAmount,
    validationRules.expenseDescription,
    validationRules.expenseCategory,
    handleValidationErrors
  ],
  
  updateExpense: [
    validationRules.mongoId,
    body('amount').optional().isFloat({ min: 0.01 }),
    body('description').optional().trim().isLength({ min: 3, max: 200 }),
    body('category').optional().isIn(['ingredients', 'equipment', 'utilities', 'marketing', 'staff', 'rent', 'other']),
    handleValidationErrors
  ],
  
  // Common validations
  getById: [
    validationRules.mongoId,
    handleValidationErrors
  ],
  
  pagination: [
    validationRules.page,
    validationRules.limit,
    handleValidationErrors
  ],
  
  dateRange: [
    ...validationRules.dateRange,
    handleValidationErrors
  ]
};

// Custom validation middleware for file uploads
const validateFileUpload = (allowedTypes = ['image/jpeg', 'image/png', 'image/webp'], maxSize = 5 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.file) {
      return next();
    }

    // Check file type
    if (!allowedTypes.includes(req.file.mimetype)) {
      logger.warn('Invalid file type uploaded', {
        mimetype: req.file.mimetype,
        allowedTypes,
        userId: req.user ? req.user.id : null,
        requestId: req.id
      });
      
      return res.status(400).json({
        success: false,
        message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        requestId: req.id
      });
    }

    // Check file size
    if (req.file.size > maxSize) {
      logger.warn('File too large uploaded', {
        size: req.file.size,
        maxSize,
        userId: req.user ? req.user.id : null,
        requestId: req.id
      });
      
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`,
        requestId: req.id
      });
    }

    next();
  };
};

module.exports = {
  validationRules,
  validationSets,
  handleValidationErrors,
  validateFileUpload
};