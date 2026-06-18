const marketplaceListingService = require(
    '../services/marketplace-listing.service'
);

const createListing = async (
    req,
    res
) => {
    try {
        const listing =
            await marketplaceListingService.createListing(
                req.user.id,
                req.body.membershipId,
                req.body.askingPrice
            );

        return res.status(201).json({
            success: true,
            data: listing
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
const getAllListings = async (
    req,
    res
) => {
    try {
        const listings =
            await marketplaceListingService.getAllListings();

        return res.status(200).json({
            success: true,
            count: listings.length,
            data: listings
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const getListingById = async (
    req,
    res
) => {
    try {
        const listing =
            await marketplaceListingService.getListingById(
                req.params.listingId
            );

        if (!listing) {
            return res.status(404).json({
                success: false,
                message: 'Listing not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: listing
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const cancelListing = async (
    req,
    res
) => {
    try {
        const listing =
            await marketplaceListingService.cancelListing(
                req.params.listingId,
                req.user.id
            );

        return res.status(200).json({
            success: true,
            message:
                'Listing cancelled successfully',
            data: listing
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
module.exports = {
    createListing, getAllListings, getListingById, cancelListing
};  