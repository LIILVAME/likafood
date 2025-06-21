const express = require('express');
const { validationSets } = require('../../middleware/validation');
const { authLimiter, otpLimiter } = require('../../middleware/rateLimiter');
const loginOrRegisterRoute = require('./loginOrRegister');
const verifyOtpRoute = require('./verifyOtp');
const refreshTokenRoute = require('./refreshToken');
const logoutRoute = require('./logout');

const router = express.Router();

// Apply auth rate limiting to all auth routes
router.use(authLimiter);

router.use(loginOrRegisterRoute);
router.use(verifyOtpRoute);
router.use(refreshTokenRoute);
router.use(logoutRoute);

module.exports = router;