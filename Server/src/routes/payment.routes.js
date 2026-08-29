const express = require('express');

const { protect } = require('../middlewares/auth.middleware');
const paymentController = require('../controllers/payment.controller');

const router = express.Router();

router.post('/create-order', protect, paymentController.createOrder);
router.post('/verify-payment', protect, paymentController.verifyPayment);
router.post('/gym-memberships/create-order', protect, paymentController.createGymMembershipOrder);
router.post('/gym-memberships/verify-payment', protect, paymentController.verifyGymMembershipPayment);

module.exports = router;
