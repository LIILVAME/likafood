const express = require('express');
const User = require('../../models/User');
const { authenticateToken } = require('../../middleware/auth');
const logger = require('../../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       500:
 *         description: Internal server error
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user) {
      await user.clearRefreshToken();
    }
    res.status(200).json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    logger.error(`Logout Error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});

module.exports = router;