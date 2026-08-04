const express = require('express');

const router = express.Router();

const marketplaceListingController = require(
    '../controllers/marketplace-listing.controller'
);

const {
    protect
} = require('../middlewares/auth.middleware');

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

router.get(
    '/listings',
    marketplaceListingController.getAllListings
);

router.get(
    '/listings/my',
    protect,
    marketplaceListingController.getMyListings
);

router.get(
    '/listings/:listingId',
    marketplaceListingController.getListingById
);

/*
 Seller routes
*/

router.post(
    '/listings',
    protect,
    marketplaceListingController.createListing
);

router.get(
    '/listings/my/:listingId',
    protect,
    marketplaceListingController.getMyListingById
);

router.patch(
    '/listings/:listingId/pause',
    protect,
    marketplaceListingController.pauseListing
);

router.patch(
    '/listings/:listingId/activate',
    protect,
    marketplaceListingController.activateListing
);

router.patch(
    '/listings/:listingId/cancel',
    protect,
    marketplaceListingController.cancelListing
);

router.patch(
    '/listings/:listingId/renew',
    protect,
    marketplaceListingController.renewListing
);

router.patch(
    '/listings/:listingId/price',
    protect,
    marketplaceListingController.updateListingPrice
);

router.delete(
    '/listings/:listingId',
    protect,
    marketplaceListingController.deleteListing
);

/*
|--------------------------------------------------------------------------
| Seller Analytics
|--------------------------------------------------------------------------
| Uncomment after getSellerAnalytics controller is implemented.
|--------------------------------------------------------------------------
*/

// router.get(
//     '/listings/my/analytics',
//     protect,
//     marketplaceListingController.getSellerAnalytics
// );

module.exports = router;
