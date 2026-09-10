const express = require('express');

const { protect, requireRecentAuthentication } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { paymentLimiter, adminMutationLimiter } = require('../middlewares/rateLimiter.middleware');
const { requireIdempotency } = require('../middlewares/idempotency.middleware');
const controller = require('../controllers/platform-billing.controller');

const router = express.Router();

router.get('/platform-billing/mine', protect, controller.getMyBillingSummary);
router.post('/platform-billing/member-subscription', protect, authorize('USER'), paymentLimiter, requireIdempotency('member-subscription'), controller.createMemberSubscription);
router.post('/platform-billing/owner-subscription', protect, authorize('GYM_OWNER'), paymentLimiter, requireIdempotency('owner-subscription'), controller.createOwnerSubscription);
router.post('/platform-billing/listings/:listingId/plus-boost', protect, authorize('USER'), paymentLimiter, requireIdempotency('plus-monthly-boost'), controller.redeemMemberBoost);
router.post('/platform-billing/listings/:listingId/boost', protect, paymentLimiter, requireIdempotency('listing-boost'), controller.createListingBoost);
router.post('/platform-billing/:requestId/mark-paid', protect, paymentLimiter, requireIdempotency('platform-payment-mark-paid'), controller.markPaymentPaid);
router.post('/platform-billing/:requestId/cancel', protect, paymentLimiter, controller.cancelPayment);
router.get('/platform-billing/admin/payments', protect, authorize('ADMIN'), controller.getPlatformPayments);
router.post('/platform-billing/admin/payments/:requestId/confirm', protect, authorize('ADMIN'), requireRecentAuthentication(), adminMutationLimiter, controller.confirmPlatformPayment);
router.post('/platform-billing/admin/payments/:requestId/reject', protect, authorize('ADMIN'), requireRecentAuthentication(), adminMutationLimiter, controller.rejectPlatformPayment);

module.exports = router;
