const express = require('express');

const router = express.Router();
const {
    protect
} = require('../middlewares/auth.middleware');
const authController = require('../controllers/auth.controller');
const { authLimiter } = require('../middlewares/rateLimiter.middleware');

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.get('/me', protect, authController.getMe);
router.patch('/me', protect, authController.updateMe);
router.patch('/me/settings', protect, authController.updateSettings);
router.patch('/me/password', protect, authController.changePassword);
router.delete('/me', protect, authController.deleteMe);
module.exports = router;
