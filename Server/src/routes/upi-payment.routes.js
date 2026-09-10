const express = require('express');

const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const controller = require('../controllers/upi-payment.controller');
const { paymentLimiter } = require('../middlewares/rateLimiter.middleware');
const { requireIdempotency } = require('../middlewares/idempotency.middleware');

const router = express.Router();

router.post('/upi-payments/gym-memberships', protect, paymentLimiter, requireIdempotency('upi-gym-membership'), controller.createGymMembershipRequest);
router.post('/upi-payments/marketplace', protect, paymentLimiter, requireIdempotency('upi-marketplace-transfer'), controller.createMarketplaceRequest);
router.get('/upi-payments/mine', protect, controller.getMyRequests);
router.get('/upi-payments/gym-approvals', protect, authorize('GYM_OWNER'), controller.getGymApprovalRequests);
router.post('/upi-payments/:requestId/mark-paid', protect, paymentLimiter, requireIdempotency('upi-mark-paid'), controller.markPaymentPaid);
router.post('/upi-payments/:requestId/confirm', protect, paymentLimiter, controller.confirmPaymentReceived);
router.post('/upi-payments/:requestId/gym-approve', protect, authorize('GYM_OWNER'), paymentLimiter, controller.approveMarketplaceTransfer);
router.post('/upi-payments/:requestId/reject', protect, paymentLimiter, controller.rejectPayment);
router.post('/upi-payments/:requestId/cancel', protect, paymentLimiter, controller.cancelPaymentRequest);

module.exports = router;
