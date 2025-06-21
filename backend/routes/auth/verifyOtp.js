const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../../models/User');
const Otp = require('../../models/Otp');
const jwtService = require('../../utils/jwt');
const { authRateLimit } = require('../../middleware/auth');
const logger = require('../../utils/logger');
const smsService = require('../../services/smsService');

const router = express.Router();

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP for login or registration
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
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid OTP or validation error
 *       500:
 *         description: Internal server error
 */
router.post('/verify-otp',
  authRateLimit(5, 15 * 60 * 1000),
  [
    body('phoneNumber').notEmpty().withMessage('Phone number is required'),
    body('code').notEmpty().withMessage('OTP code is required').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation failed', 
          errors: errors.array() 
        });
      }

      const { phoneNumber, code } = req.body;
      const formattedPhone = smsService.formatPhoneNumber(phoneNumber);

      const isValidOtp = await Otp.verifyOtp(formattedPhone, code);
      if (!isValidOtp) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid or expired OTP',
          code: 'INVALID_OTP'
        });
      }

      const user = await User.findByPhoneNumber(formattedPhone);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      if (!user.isPhoneVerified) {
        await user.markPhoneAsVerified();
      }

      const { accessToken, refreshToken } = jwtService.generateTokenPair(user);
      await user.saveRefreshToken(refreshToken);

      res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user._id,
            businessName: user.businessName,
            role: user.role,
            isPhoneVerified: user.isPhoneVerified
          }
        }
      });
    } catch (error) {
      logger.error(`OTP Verification Error: ${error.message}`, { stack: error.stack });
      res.status(500).json({ 
        success: false, 
        message: 'Internal Server Error',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
);

module.exports = router;