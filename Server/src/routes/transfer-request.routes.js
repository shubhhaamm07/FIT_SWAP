const express = require('express');
const router = express.Router();

const { protect } = require(
    '../middlewares/auth.middleware'
);
const { authorize } = require('../middlewares/role.middleware');
const { transferLimiter } = require('../middlewares/rateLimiter.middleware');
const { requireIdempotency } = require('../middlewares/idempotency.middleware');

const transferRequestController = require(
    '../controllers/transfer-request.controller'
);

router.post(
    '/transfer-requests',
    protect,
    transferLimiter,
    requireIdempotency('cash-transfer-request'),
    transferRequestController.createTransferRequest
);
router.get(
    '/transfer-requests/my',
    protect,
    transferRequestController.getMyTransferRequests
);
router.get(
    '/transfer-requests/incoming',
    protect,
    transferRequestController.getIncomingTransferRequests
);
router.get(
    '/transfer-requests/gym-approvals',
    protect,
    authorize('GYM_OWNER'),
    transferRequestController.getGymCashApprovalRequests
);
router.patch(
    '/transfer-requests/:requestId/approve',
    protect,
    transferLimiter,
    transferRequestController.approveTransferRequest
);
router.patch(
    '/transfer-requests/:requestId/gym-approve',
    protect,
    authorize('GYM_OWNER'),
    transferLimiter,
    transferRequestController.approveCashTransferByGymOwner
);
router.patch(
    '/transfer-requests/:requestId/gym-reject',
    protect,
    authorize('GYM_OWNER'),
    transferLimiter,
    transferRequestController.rejectCashTransferByGymOwner
);
router.patch(
    '/transfer-requests/:requestId/reject',
    protect,
    transferLimiter,
    transferRequestController.rejectTransferRequest
);
router.patch(
    '/transfer-requests/:requestId/cancel',
    protect,
    transferLimiter,
    transferRequestController.cancelTransferRequest
);
module.exports = router;
