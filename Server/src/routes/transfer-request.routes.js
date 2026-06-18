const express = require('express');
const router = express.Router();

const { protect } = require(
    '../middlewares/auth.middleware'
);

const transferRequestController = require(
    '../controllers/transfer-request.controller'
);

router.post(
    '/transfer-requests',
    protect,
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
router.patch(
    '/transfer-requests/:requestId/approve',
    protect,
    transferRequestController.approveTransferRequest
);
router.patch(
    '/transfer-requests/:requestId/reject',
    protect,
    transferRequestController.rejectTransferRequest
);
module.exports = router;