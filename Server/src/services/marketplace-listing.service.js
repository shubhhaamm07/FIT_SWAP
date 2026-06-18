const prisma = require('../lib/prisma');

const createListing = async (
    sellerId,
    membershipId,
    askingPrice
) => {
    // Asking Price Validation
    if (askingPrice <= 0) {
        throw new Error(
            'Invalid asking price'
        );
    }

    // Get Membership with related data
    const membership =
        await prisma.userMembership.findUnique({
            where: {
                id: membershipId
            },
            include: {
                plan: {
                    include: {
                        gym: true
                    }
                },
                listing: true
            }
        });

    // Membership Exists
    if (!membership) {
        throw new Error(
            'Membership not found'
        );
    }

    // Ownership Check
    if (membership.userId !== sellerId) {
        throw new Error(
            'You do not own this membership'
        );
    }

    // Membership Active Check
    if (membership.status !== 'ACTIVE') {
        throw new Error(
            'Only active memberships can be listed'
        );
    }

    // Transferable Plan Check
    if (!membership.plan.transferable) {
        throw new Error(
            'This membership cannot be transferred'
        );
    }

    // Gym Approved Check
    if (
        membership.plan.gym.status !==
        'APPROVED'
    ) {
        throw new Error(
            'Gym is not approved'
        );
    }

    // Already Listed Check
    if (membership.listing) {
        throw new Error(
            'Membership is already listed'
        );
    }

    // Minimum 30 Days Remaining
    const daysRemaining = Math.ceil(
        (membership.endDate - new Date()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysRemaining < 30) {
        throw new Error(
            'Membership must have at least 30 days remaining'
        );
    }

    return prisma.marketplaceListing.create({
        data: {
            membershipId,
            sellerId,
            askingPrice
        }
    });
};
const getAllListings = async () => {
    return prisma.marketplaceListing.findMany({
        where: {
            status: 'ACTIVE'
        },
        include: {
            membership: {
                include: {
                    plan: {
                        select: {
                            id: true,
                            name: true,
                            price: true,
                            durationInDays: true
                        }
                    }
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
};
const getListingById = async (
    listingId
) => {
    return prisma.marketplaceListing.findUnique({
        where: {
            id: listingId
        },
        include: {
            membership: {
                include: {
                    plan: {
                        include: {
                            gym: true
                        }
                    }
                }
            }
        }
    });
};
const cancelListing = async (
    listingId,
    sellerId
) => {
    const listing =
        await prisma.marketplaceListing.findUnique({
            where: {
                id: listingId
            }
        });

    // Listing Exists
    if (!listing) {
        throw new Error(
            'Listing not found'
        );
    }

    // Ownership Check
    if (listing.sellerId !== sellerId) {
        throw new Error(
            'You do not own this listing'
        );
    }

    // Already Cancelled
    if (listing.status === 'CANCELLED') {
        throw new Error(
            'Listing is already cancelled'
        );
    }

    // Already Sold
    if (listing.status === 'SOLD') {
        throw new Error(
            'Sold listings cannot be cancelled'
        );
    }

    return prisma.marketplaceListing.update({
        where: {
            id: listingId
        },
        data: {
            status: 'CANCELLED'
        }
    });
};
module.exports = {
    createListing, getAllListings, getListingById, cancelListing
};