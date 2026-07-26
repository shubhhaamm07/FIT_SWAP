const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const controller = require('../controllers/saved-listing.controller');

const router = express.Router();

router.get('/saved-listings', protect, controller.getSavedListings);
router.post('/saved-listings', protect, controller.saveListing);
router.delete('/saved-listings/:listingId', protect, controller.removeSavedListing);

module.exports = router;
