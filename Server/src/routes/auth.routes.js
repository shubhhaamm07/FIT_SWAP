const express = require('express');

const router = express.Router();
const {
    protect
} = require('../middlewares/auth.middleware');
const authController = require('../controllers/auth.controller');
const { authLimiter, emailActionLimiter } = require('../middlewares/rateLimiter.middleware');

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/forgot-password', emailActionLimiter, authController.requestPasswordReset);
router.post('/reset-password', emailActionLimiter, authController.resetPassword);
router.post('/verify-email', emailActionLimiter, authController.verifyEmail);
router.get('/me', protect, authController.getMe);
router.patch('/me', protect, authController.updateMe);
router.patch('/me/settings', protect, authController.updateSettings);
router.patch('/me/password', protect, authController.changePassword);
router.post('/send-verification', protect, emailActionLimiter, authController.resendVerificationEmail);
router.delete('/me', protect, authController.deleteMe);
module.exports = router;
