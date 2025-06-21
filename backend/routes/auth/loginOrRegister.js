const express = require('express');
const { validationSets } = require('../../middleware/validation');
const { otpLimiter } = require('../../middleware/rateLimiter');
const User = require('../../models/User');
const Otp = require('../../models/Otp');
const smsService = require('../../services/smsService');
// Rate limiting is now handled by the new rateLimiter middleware
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
  otpLimiter, // Apply strict OTP rate limiting
  validationSets.loginOrRegister,
  async (req, res) => {
    try {
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
        
        logger.info('OTP sent for existing user login', {
          userId: existingUser._id,
          phoneNumber: formattedPhone,
          businessName: existingUser.businessName,
          requestId: req.requestId
        });
        
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

        logger.info('New user registered successfully', {
          userId: user._id,
          phoneNumber: formattedPhone,
          businessName: user.businessName,
          ownerName: user.ownerName,
          requestId: req.requestId
        });

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
      logger.error('Login/Register Error', {
        error: error.message,
        stack: error.stack,
        endpoint: 'POST /api/auth/login-or-register',
        phoneNumber: req.body.phoneNumber,
        requestId: req.requestId,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
      res.status(500).json({ 
        success: false, 
        message: 'Internal Server Error', 
        code: 'INTERNAL_SERVER_ERROR',
        requestId: req.requestId
      });
    }
  }
);

module.exports = router;