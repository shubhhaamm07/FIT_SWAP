const express = require('express');

const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const controller = require('../controllers/upi-payment.controller');

const router = express.Router();

router.post('/upi-payments/gym-memberships', protect, controller.createGymMembershipRequest);
router.post('/upi-payments/marketplace', protect, controller.createMarketplaceRequest);
router.get('/upi-payments/mine', protect, controller.getMyRequests);
router.get('/upi-payments/gym-approvals', protect, authorize('GYM_OWNER'), controller.getGymApprovalRequests);
router.post('/upi-payments/:requestId/mark-paid', protect, controller.markPaymentPaid);
router.post('/upi-payments/:requestId/confirm', protect, controller.confirmPaymentReceived);
router.post('/upi-payments/:requestId/gym-approve', protect, authorize('GYM_OWNER'), controller.approveMarketplaceTransfer);
router.post('/upi-payments/:requestId/reject', protect, controller.rejectPayment);
router.post('/upi-payments/:requestId/cancel', protect, controller.cancelPaymentRequest);

module.exports = router;
