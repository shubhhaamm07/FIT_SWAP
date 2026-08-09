const express = require('express');

const router = express.Router();

const adminController = require('../controllers/admin.controller');

const marketplaceListingController = require(
    '../controllers/marketplace-listing.controller'
);

const {
    protect
} = require('../middlewares/auth.middleware');

const {
    authorize
} = require('../middlewares/role.middleware');

/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/

router.get(
    '/dashboard',
    protect,
    authorize('ADMIN'),
    adminController.getDashboard
);

router.get('/analytics', protect, authorize('ADMIN'), adminController.getAnalytics);

/*
|--------------------------------------------------------------------------
| Announcements & audit history
|--------------------------------------------------------------------------
*/

router.get('/announcement-recipients', protect, authorize('ADMIN'), adminController.getAnnouncementRecipients);
router.get('/announcements', protect, authorize('ADMIN'), adminController.getAnnouncements);
router.post('/announcements', protect, authorize('ADMIN'), adminController.createAnnouncement);
router.get('/audit-logs', protect, authorize('ADMIN'), adminController.getAuditLogs);

/*
|--------------------------------------------------------------------------
| Gym Management
|--------------------------------------------------------------------------
*/

router.get(
    '/pending-gyms',
    protect,
    authorize('ADMIN'),
    adminController.getPendingGyms
);

/*
|--------------------------------------------------------------------------
| Marketplace Management
|--------------------------------------------------------------------------
*/

router.get(
    '/listings',
    protect,
    authorize('ADMIN'),
    marketplaceListingController.getAllListingsForAdmin
);

router.get(
    '/listings/:listingId',
    protect,
    authorize('ADMIN'),
    marketplaceListingController.getListingByIdForAdmin
);

router.patch(
    '/listings/:listingId/status',
    protect,
    authorize('ADMIN'),
    marketplaceListingController.updateListingStatusByAdmin
);

module.exports = router;    
