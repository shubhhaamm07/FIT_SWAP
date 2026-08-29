const express = require('express');

const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const controller = require('../controllers/platform-billing.controller');

const router = express.Router();

router.get('/platform-billing/mine', protect, controller.getMyBillingSummary);
router.post('/platform-billing/owner-subscription', protect, authorize('GYM_OWNER'), controller.createOwnerSubscription);
router.post('/platform-billing/listings/:listingId/boost', protect, controller.createListingBoost);
router.post('/platform-billing/:requestId/mark-paid', protect, controller.markPaymentPaid);
router.post('/platform-billing/:requestId/cancel', protect, controller.cancelPayment);
router.get('/platform-billing/admin/payments', protect, authorize('ADMIN'), controller.getPlatformPayments);
router.post('/platform-billing/admin/payments/:requestId/confirm', protect, authorize('ADMIN'), controller.confirmPlatformPayment);
router.post('/platform-billing/admin/payments/:requestId/reject', protect, authorize('ADMIN'), controller.rejectPlatformPayment);

module.exports = router;
