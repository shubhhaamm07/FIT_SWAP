const express = require('express');

const { protect } = require('../middlewares/auth.middleware');
const paymentController = require('../controllers/payment.controller');

const router = express.Router();

router.post('/create-order', protect, paymentController.createOrder);
router.post('/verify-payment', protect, paymentController.verifyPayment);

module.exports = router;
