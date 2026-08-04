const express = require('express');

const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const gymOwnerDashboardController = require('../controllers/gym-owner-dashboard.controller');

const router = express.Router();

router.get(
    '/gym-owner/dashboard',
    protect,
    authorize('GYM_OWNER'),
    gymOwnerDashboardController.getDashboard
);

router.get('/gym-owner/members', protect, authorize('GYM_OWNER'), gymOwnerDashboardController.getMembers);
router.get('/gym-owner/sales', protect, authorize('GYM_OWNER'), gymOwnerDashboardController.getSales);
router.get('/gym-owner/transfers', protect, authorize('GYM_OWNER'), gymOwnerDashboardController.getTransfers);

module.exports = router;
