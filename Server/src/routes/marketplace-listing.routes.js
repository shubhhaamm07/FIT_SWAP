const express = require('express');

const router = express.Router();

const {
    protect
} = require('../middlewares/auth.middleware');

const marketplaceListingController = require(
    '../controllers/marketplace-listing.controller'
);

router.post(
    '/listings',
    protect,
    marketplaceListingController.createListing
);
router.get(
    '/listings',
    marketplaceListingController.getAllListings
);
router.get(
    '/listings/:listingId',
    marketplaceListingController.getListingById
);
router.patch(
    '/listings/:listingId/cancel',
    protect,
    marketplaceListingController.cancelListing
);
module.exports = router;