const marketplaceListingService = require(
    '../services/marketplace-listing.service'
);
const adminService = require('../services/admin.service');

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

const getMyListings = async (
    req,
    res
) => {
    try {

        const listings =
            await marketplaceListingService.getMyListings(
                req.user.id
            );

        return res.status(200).json({
            success: true,
            count: listings.length,
            data: listings
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }
};

const getMyListingById = async (
    req,
    res
) => {
    try {

        const listing =
            await marketplaceListingService.getMyListingById(
                req.params.listingId,
                req.user.id
            );

        return res.status(200).json({
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
            message: 'Listing cancelled successfully',
            data: listing
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }
};

const pauseListing = async (
    req,
    res
) => {
    try {

        const listing =
            await marketplaceListingService.pauseListing(
                req.params.listingId,
                req.user.id
            );

        return res.status(200).json({
            success: true,
            message: 'Listing paused successfully',
            data: listing
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }
};

const activateListing = async (
    req,
    res
) => {
    try {

        const listing =
            await marketplaceListingService.activateListing(
                req.params.listingId,
                req.user.id
            );

        return res.status(200).json({
            success: true,
            message: 'Listing activated successfully',
            data: listing
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }
};
const renewListing = async (
    req,
    res
) => {
    try {

        const listing =
            await marketplaceListingService.renewListing(
                req.params.listingId,
                req.user.id
            );

        return res.status(200).json({
            success: true,
            message: 'Listing renewed successfully',
            data: listing
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }
};
// const renewListing = async (
//     req,
//     res
// ) => {

//     try {

//         const listing =
//             await marketplaceListingService.renewListing(
//                 req.params.listingId,
//                 req.user.id
//             );

//         return res.status(200).json({
//             success: true,
//             message: 'Listing renewed successfully',
//             data: listing
//         });

//     } catch (error) {

//         return res.status(400).json({
//             success: false,
//             message: error.message
//         });

//     }

// };
const updateListingPrice = async (
    req,
    res
) => {

    try {

        const listing =
            await marketplaceListingService.updateListingPrice(
                req.params.listingId,
                req.user.id,
                req.body.askingPrice
            );

        return res.status(200).json({
            success: true,
            message: 'Listing price updated successfully',
            data: listing
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }

};
const deleteListing = async (
    req,
    res
) => {

    try {

        const listing =
            await marketplaceListingService.deleteListing(
                req.params.listingId,
                req.user.id
            );

        return res.status(200).json({

            success: true,

            message: 'Listing deleted successfully',

            data: listing

        });

    }
    catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message

        });

    }

};
const getAllListingsForAdmin = async (
    req,
    res
) => {

    try {

        const listings =
            await marketplaceListingService.getAllListingsForAdmin();

        return res.status(200).json({

            success: true,

            count: listings.length,

            data: listings

        });

    }
    catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message

        });

    }

};

const getListingByIdForAdmin = async (
    req,
    res
) => {

    try {

        const listing =
            await marketplaceListingService.getListingByIdForAdmin(
                req.params.listingId
            );

        return res.status(200).json({

            success: true,

            data: listing

        });

    }
    catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message

        });

    }

};

const updateListingStatusByAdmin = async (
    req,
    res
) => {

    try {

        const listing =
            await marketplaceListingService.updateListingStatusByAdmin(
                req.params.listingId,
                req.body.status
            );

        try {
            await adminService.createAuditLog({
                adminId: req.user.id,
                action: 'LISTING_STATUS_UPDATED',
                targetType: 'MARKETPLACE_LISTING',
                targetId: listing.id,
                summary: `Marketplace listing ${listing.id} was marked ${req.body.status.toLowerCase()}`,
                metadata: { status: req.body.status }
            });
        } catch (auditError) {
            // The moderation change succeeded; preserve that result if audit storage is unavailable.
        }

        return res.status(200).json({

            success: true,

            message: 'Listing status updated successfully.',

            data: listing

        });

    }
    catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message

        });

    }

};
module.exports = {

    createListing,

    getAllListings,

    getListingById,

    getMyListings,

    getMyListingById,

    cancelListing,

    pauseListing,
    renewListing,
    updateListingPrice,
    deleteListing,
    activateListing,
    getAllListingsForAdmin,

    getListingByIdForAdmin,

    updateListingStatusByAdmin

};
