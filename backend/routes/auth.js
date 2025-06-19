const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Otp = require('../models/Otp');
const jwtService = require('../utils/jwt');
const smsService = require('../services/smsService');
const { validateRefreshToken, authRateLimit, authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Register a new restaurant owner with phone number and business details
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - businessName
 *               - ownerName
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number in international format
 *                 example: "+33123456789"
 *               businessName:
 *                 type: string
 *                 description: Name of the restaurant/business
 *                 example: "Restaurant Le Délice"
 *               ownerName:
 *                 type: string
 *                 description: Name of the business owner
 *                 example: "Jean Dupont"
 *     responses:
 *       201:
 *         description: User registered successfully, OTP sent
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         userId:
 *                           type: string
 *                           description: Unique user identifier
 *                         phoneNumber:
 *                           type: string
 *                           description: Registered phone number
 *                         businessName:
 *                           type: string
 *                           description: Business name
 *                         requiresVerification:
 *                           type: boolean
 *                           example: true
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', 
  authRateLimit(5, 15 * 60 * 1000),
  [
    body('phoneNumber')
      .notEmpty()
      .withMessage('Phone number is required')
      .isLength({ min: 10, max: 15 })
      .withMessage('Phone number must be between 10-15 digits')
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Invalid phone number format'),
    body('businessName')
      .notEmpty()
      .withMessage('Business name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Business name must be between 2-100 characters')
      .trim()
      .escape(),
    body('ownerName')
      .notEmpty()
      .withMessage('Owner name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Owner name must be between 2-50 characters')
      .trim()
      .escape()
  ],
  async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: errors.array()
      });
    }

    const { phoneNumber, businessName, ownerName } = req.body;
    
    // Format phone number
    const formattedPhone = smsService.formatPhoneNumber(phoneNumber);
    
    // Validate phone number
    if (!smsService.validatePhoneNumber(formattedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format',
        code: 'INVALID_PHONE_NUMBER'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findByPhoneNumber(formattedPhone);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this phone number already exists',
        code: 'USER_EXISTS'
      });
    }
    
    // Create new user
    const user = await User.createUser({
      phoneNumber: formattedPhone,
      businessName: businessName.trim(),
      ownerName: ownerName.trim()
    });
    
    // Generate and send OTP
    const otp = await Otp.createOtp(formattedPhone, 'registration');
    await smsService.sendOTP(formattedPhone, otp.code, 'registration');
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully. OTP sent to phone number.',
      data: {
        userId: user._id,
        phoneNumber: formattedPhone,
        businessName: user.businessName,
        requiresVerification: true
      }
    });
    
  } catch (error) {
    logger.error('Registration error:', { error: error.message, stack: error.stack, phoneNumber: req.body.phoneNumber });
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/auth/request-otp:
 *   post:
 *     summary: Request OTP for login
 *     description: Send an OTP code to the user's phone number for authentication
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: User's phone number
 *                 example: "+33123456789"
 *                 pattern: '^\+?[1-9]\d{1,14}$'
 *                 minLength: 10
 *                 maxLength: 15
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "OTP sent successfully"
 *               data:
 *                 phoneNumber: "+33123456789"
 *                 otpSent: true
 *       400:
 *         description: Validation error or user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/request-otp', 
  authRateLimit(5, 15 * 60 * 1000),
  [
    body('phoneNumber')
      .notEmpty()
      .withMessage('Phone number is required')
      .isLength({ min: 10, max: 15 })
      .withMessage('Phone number must be between 10-15 digits')
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Invalid phone number format')
  ],
  async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: errors.array()
      });
    }

    const { phoneNumber } = req.body;
    
    // Format phone number
    const formattedPhone = smsService.formatPhoneNumber(phoneNumber);
    
    // Validate phone number
    if (!smsService.validatePhoneNumber(formattedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format',
        code: 'INVALID_PHONE_NUMBER'
      });
    }
    
    // Find user
    const user = await User.findByPhoneNumber(formattedPhone);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please register first.',
        code: 'USER_NOT_FOUND'
      });
    }
    
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }
    
    // Check if user can receive OTP
    if (!user.canReceiveOtp()) {
      return res.status(429).json({
        success: false,
        message: 'Please wait before requesting another OTP',
        code: 'OTP_RATE_LIMITED'
      });
    }
    
    // Generate and send OTP
    const otp = await Otp.createOtp(formattedPhone, 'login');
    await smsService.sendOTP(formattedPhone, otp.code, 'login');
    
    // Update user OTP tracking
    await user.incrementOtpAttempts();
    
    res.json({
      success: true,
      message: 'OTP sent to your phone number',
      data: {
        phoneNumber: formattedPhone,
        requiresVerification: !user.isPhoneVerified
      }
    });
    
  } catch (error) {
    logger.error('Request OTP error:', { error: error.message, stack: error.stack, phoneNumber: req.body.phoneNumber });
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      code: 'OTP_REQUEST_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user with phone number
 *     description: Initiate login process by sending OTP to user's phone number
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: User's registered phone number
 *                 example: "+33123456789"
 *                 pattern: '^\+?[1-9]\d{1,14}$'
 *     responses:
 *       200:
 *         description: OTP sent successfully for login
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "OTP sent to your phone number"
 *               data:
 *                 phoneNumber: "+33123456789"
 *                 requiresVerification: false
 *       400:
 *         description: Invalid phone number or user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Account deactivated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many requests or OTP rate limited
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', authRateLimit(5, 15 * 60 * 1000), async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
        code: 'PHONE_NUMBER_REQUIRED'
      });
    }
    
    // Format phone number
    const formattedPhone = smsService.formatPhoneNumber(phoneNumber);
    
    // Validate phone number
    if (!smsService.validatePhoneNumber(formattedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format',
        code: 'INVALID_PHONE_NUMBER'
      });
    }
    
    // Find user
    const user = await User.findByPhoneNumber(formattedPhone);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please register first.',
        code: 'USER_NOT_FOUND'
      });
    }
    
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }
    
    // Check if user can receive OTP
    if (!user.canReceiveOtp()) {
      return res.status(429).json({
        success: false,
        message: 'Please wait before requesting another OTP',
        code: 'OTP_RATE_LIMITED'
      });
    }
    
    // Generate and send OTP
    const otp = await Otp.createOtp(formattedPhone, 'login');
    await smsService.sendOTP(formattedPhone, otp.code, 'login');
    
    // Update user OTP tracking
    await user.incrementOtpAttempts();
    
    res.json({
      success: true,
      message: 'OTP sent to your phone number',
      data: {
        phoneNumber: formattedPhone,
        requiresVerification: !user.isPhoneVerified
      }
    });
    
  } catch (error) {
    logger.error('Login error:', { error: error.message, stack: error.stack, phoneNumber: req.body.phoneNumber });
    res.status(500).json({
      success: false,
      message: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and complete authentication
 *     description: Verify the OTP code sent to user's phone and complete the authentication process
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - code
 *               - type
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: User's phone number
 *                 example: "+33123456789"
 *                 pattern: '^\+?[1-9]\d{1,14}$'
 *               code:
 *                 type: string
 *                 description: 6-digit OTP code
 *                 example: "123456"
 *                 pattern: '^[0-9]{6}$'
 *                 minLength: 6
 *                 maxLength: 6
 *               type:
 *                 type: string
 *                 description: Type of OTP verification
 *                 enum: [registration, login]
 *                 example: "login"
 *     responses:
 *       200:
 *         description: OTP verified successfully, authentication complete
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/AuthTokens'
 *             example:
 *               success: true
 *               message: "Authentication successful"
 *               data:
 *                 accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   id: "507f1f77bcf86cd799439011"
 *                   phoneNumber: "+33123456789"
 *                   businessName: "Mon Restaurant"
 *                   isPhoneVerified: true
 *       400:
 *         description: Invalid OTP code or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many OTP verification attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/verify-otp', authRateLimit(10, 15 * 60 * 1000), async (req, res) => {
  try {
    const { phoneNumber, code, type } = req.body;
    
    if (!phoneNumber || !code || !type) {
      return res.status(400).json({
        success: false,
        message: 'Phone number, OTP code, and type are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }
    
    // Format phone number
    const formattedPhone = smsService.formatPhoneNumber(phoneNumber);
    
    // Find and validate OTP
    const otp = await Otp.findValidOtp(formattedPhone, code, type);
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
        code: 'INVALID_OTP'
      });
    }
    
    // Check OTP attempts
    if (otp.attempts >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Too many OTP attempts. Please request a new code.',
        code: 'OTP_ATTEMPTS_EXCEEDED'
      });
    }
    
    // Find user
    const user = await User.findByPhoneNumber(formattedPhone);
    if (!user) {
      await otp.incrementAttempts();
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Mark OTP as used
    await otp.markAsUsed();
    
    // Update user verification status
    if (!user.isPhoneVerified) {
      user.isPhoneVerified = true;
      await user.save();
    }
    
    // Reset OTP attempts
    await user.resetOtpAttempts();
    
    // Update last login
    await user.updateLastLogin();
    
    // Generate tokens
    const tokens = jwtService.generateTokenPair(user);
    
    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        user: user.toSafeObject(),
        tokens,
        isNewUser: type === 'registration'
      }
    });
    
  } catch (error) {
    logger.error('OTP verification error:', { error: error.message, stack: error.stack, phoneNumber: req.body.phoneNumber, type: req.body.type });
    res.status(500).json({
      success: false,
      message: 'OTP verification failed',
      code: 'OTP_VERIFICATION_ERROR'
    });
  }
});

/**
 * @route POST /api/auth/resend-otp
 * @desc Resend OTP to user's phone
 * @access Public
 */
router.post('/resend-otp', authRateLimit(3, 15 * 60 * 1000), async (req, res) => {
  try {
    const { phoneNumber, type } = req.body;
    
    if (!phoneNumber || !type) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and type are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }
    
    // Format phone number
    const formattedPhone = smsService.formatPhoneNumber(phoneNumber);
    
    // Find user
    const user = await User.findByPhoneNumber(formattedPhone);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Check if user can receive OTP
    if (!user.canReceiveOtp()) {
      return res.status(429).json({
        success: false,
        message: 'Please wait before requesting another OTP',
        code: 'OTP_RATE_LIMITED'
      });
    }
    
    // Generate and send new OTP
    const otp = await Otp.createOtp(formattedPhone, type);
    await smsService.sendOTP(formattedPhone, otp.code, type);
    
    // Update user OTP tracking
    await user.incrementOtpAttempts();
    
    res.json({
      success: true,
      message: 'New OTP sent to your phone number'
    });
    
  } catch (error) {
    logger.error('Resend OTP error:', { error: error.message, stack: error.stack, phoneNumber: req.body.phoneNumber });
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP',
      code: 'RESEND_OTP_ERROR'
    });
  }
});

/**
 * @route POST /api/auth/refresh-token
 * @desc Refresh access token using refresh token
 * @access Public
 */
router.post('/refresh-token', validateRefreshToken, async (req, res) => {
  try {
    // Generate new tokens
    const tokens = jwtService.generateTokenPair(req.user);
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens
      }
    });
    
  } catch (error) {
    logger.error('Token refresh error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Token refresh failed',
      code: 'TOKEN_REFRESH_ERROR'
    });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user (client-side token removal)
 * @access Private
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a production app, you might want to blacklist the token
    // For now, we'll just return success and let client handle token removal
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    logger.error('Logout error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      code: 'LOGOUT_ERROR'
    });
  }
});

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.toSafeObject()
      }
    });
    
  } catch (error) {
    logger.error('Get profile error:', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      code: 'GET_PROFILE_ERROR'
    });
  }
});

module.exports = router;