const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../../models/User');
const Otp = require('../../models/Otp');
const smsService = require('../../services/smsService');
const { authRateLimit } = require('../../middleware/auth');
const logger = require('../../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/auth/login-or-register:
 *   post:
 *     summary: Login existing user or register new user
 *     description: Automatically handles login for existing users or registration for new users
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
 *                 description: Phone number in international format
 *                 example: "+33123456789"
 *               businessName:
 *                 type: string
 *                 description: Name of the restaurant/business (required for new users)
 *                 example: "Restaurant Le Délice"
 *               ownerName:
 *                 type: string
 *                 description: Name of the business owner (required for new users)
 *                 example: "Jean Dupont"
 *     responses:
 *       200:
 *         description: OTP sent for existing user login
 *       201:
 *         description: New user registered and OTP sent
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post('/login-or-register',
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
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('Business name must be between 2-100 characters')
      .trim()
      .escape(),
    body('ownerName')
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage('Owner name must be between 2-50 characters')
      .trim()
      .escape()
  ],
  async (req, res) => {
    try {
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
      
      const formattedPhone = smsService.formatPhoneNumber(phoneNumber);
      
      if (!smsService.validatePhoneNumber(formattedPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format',
          code: 'INVALID_PHONE_NUMBER'
        });
      }
      
      const existingUser = await User.findByPhoneNumber(formattedPhone);
      
      if (existingUser) {
        if (!existingUser.isActive) {
          return res.status(403).json({
            success: false,
            message: 'Account is deactivated',
            code: 'ACCOUNT_DEACTIVATED'
          });
        }
        
        if (!existingUser.canReceiveOtp()) {
          return res.status(429).json({
            success: false,
            message: 'Please wait before requesting another OTP',
            code: 'OTP_RATE_LIMITED'
          });
        }
        
        const otp = await Otp.createOtp(formattedPhone, 'login');
        await smsService.sendOTP(formattedPhone, otp.code, 'login');
        
        await existingUser.incrementOtpAttempts();
        
        return res.status(200).json({
          success: true,
          message: 'OTP sent for login',
          data: {
            action: 'login',
            userId: existingUser._id,
            phoneNumber: formattedPhone,
            businessName: existingUser.businessName,
            requiresVerification: !existingUser.isPhoneVerified
          }
        });
      } else {
        if (!businessName || !ownerName) {
          return res.status(400).json({
            success: false,
            message: 'Business name and owner name are required for new registration',
            code: 'MISSING_REGISTRATION_DATA'
          });
        }
        
        const user = await User.createUser({
          phoneNumber: formattedPhone,
          businessName: businessName.trim(),
          ownerName: ownerName.trim()
        });

        const otp = await Otp.createOtp(formattedPhone, 'register');
        await smsService.sendOTP(formattedPhone, otp.code, 'register');

        return res.status(201).json({
          success: true,
          message: 'User registered successfully. OTP sent.',
          data: {
            action: 'register',
            userId: user._id,
            phoneNumber: formattedPhone,
            businessName: user.businessName
          }
        });
      }
    } catch (error) {
      logger.error(`Login/Register Error: ${error.message}`, { stack: error.stack });
      res.status(500).json({ 
        success: false, 
        message: 'Internal Server Error', 
        code: 'INTERNAL_SERVER_ERROR' 
      });
    }
  }
);

module.exports = router;