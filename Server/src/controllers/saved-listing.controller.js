const savedListingService = require('../services/saved-listing.service');

const getSavedListings = async (req, res) => {
    try {
        const savedListings = await savedListingService.getSavedListings(req.user.id);
        return res.status(200).json({ success: true, count: savedListings.length, data: savedListings });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const saveListing = async (req, res) => {
    try {
        const savedListing = await savedListingService.saveListing(req.user.id, req.body.listingId);
        return res.status(201).json({ success: true, message: 'Listing saved', data: savedListing });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

const removeSavedListing = async (req, res) => {
    try {
        await savedListingService.removeSavedListing(req.user.id, req.params.listingId);
        return res.status(200).json({ success: true, message: 'Listing removed from saved listings' });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

module.exports = { getSavedListings, saveListing, removeSavedListing };
