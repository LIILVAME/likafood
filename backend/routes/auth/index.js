const express = require('express');
const loginOrRegisterRoute = require('./loginOrRegister');
const verifyOtpRoute = require('./verifyOtp');
const refreshTokenRoute = require('./refreshToken');
const logoutRoute = require('./logout');

const router = express.Router();

router.use(loginOrRegisterRoute);
router.use(verifyOtpRoute);
router.use(refreshTokenRoute);
router.use(logoutRoute);

module.exports = router;