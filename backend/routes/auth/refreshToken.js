const express = require('express');
const jwtService = require('../../utils/jwt');
const { validateRefreshToken } = require('../../middleware/auth');
const logger = require('../../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh-token', validateRefreshToken, async (req, res) => {
  try {
    const { userId, role } = req.user; // From validateRefreshToken middleware
    const { accessToken, refreshToken: newRefreshToken } = await jwtService.generateTokens({ userId, role });
    
    // In a real app, you'd save the new refresh token to the user's record
    // For simplicity, we are not doing that here, but it's recommended.

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    logger.error(`Refresh Token Error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});

module.exports = router;