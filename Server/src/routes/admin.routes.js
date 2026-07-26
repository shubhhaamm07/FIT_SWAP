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