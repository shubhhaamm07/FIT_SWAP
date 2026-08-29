const prisma = require('../lib/prisma');

const {
    LISTING_STATUS,
    ListingRules,
    ListingLocks,
    ListingTransitions
} = require('../domain/marketplace');

const createListing = async (
    sellerId,
    membershipId,
    askingPrice
) => {

    const normalizedAskingPrice = Number(askingPrice);

    if (!Number.isFinite(normalizedAskingPrice) || normalizedAskingPrice <= 0) {
        throw new Error(
            'Invalid asking price'
        );
    }

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

    if (!membership) {
        throw new Error(
            'Membership not found'
        );
    }

    if (
        membership.userId !== sellerId
    ) {
        throw new Error(
            'You do not own this membership'
        );
    }

    if (
        membership.status !== 'ACTIVE'
    ) {
        throw new Error(
            'Only active memberships can be listed'
        );
    }

    if (
        membership.endDate <= new Date()
    ) {
        throw new Error(
            'Membership has already expired'
        );
    }

    if (
        !membership.plan.transferable
    ) {
        throw new Error(
            'This membership cannot be transferred'
        );
    }

    if (
        membership.plan.gym.status !==
        'APPROVED'
    ) {
        throw new Error(
            'Gym is not approved'
        );
    }

    if (
        membership.listing
    ) {
        throw new Error(
            'Membership is already listed'
        );
    }

    if (
        normalizedAskingPrice <
        membership.plan.price * 0.30 ||
        normalizedAskingPrice >
        membership.plan.price
    ) {

        throw new Error(
            `Asking price must be between ₹${(
                membership.plan.price * 0.30
            ).toFixed(0)} and ₹${membership.plan.price}`
        );

    }

    const daysRemaining =
        Math.ceil(

            (
                membership.endDate -
                new Date()
            ) /
            (
                1000 *
                60 *
                60 *
                24
            )

        );

    if (
        daysRemaining < 30
    ) {
        throw new Error(
            'Membership must have at least 30 days remaining'
        );
    }

    return prisma.marketplaceListing.create({

        data: {

            membershipId,

            sellerId,

            askingPrice: normalizedAskingPrice

        }

    });

};

const getAllListings = async () => {
    const listings = await prisma.marketplaceListing.findMany({

        where: {

            status:
                LISTING_STATUS.ACTIVE,

            deletedAt: null

        },

        include: {

            membership: {

                include: {

                    plan: {

                        include: {

                            gym: {
                                include: {
                                    images: {
                                        orderBy: [
                                            { isPrimary: 'desc' },
                                            { displayOrder: 'asc' }
                                        ]
                                    }
                                }
                            }

                        }

                    },

                    user: {

                        select: {

                            id: true,
                            firstName: true,
                            lastName: true

                        }

                    }

                }

            }

        },

        orderBy: {

            createdAt: 'desc'

        }

    });

    // A confirmed boost affects discovery only; it never changes the asking
    // price or the normal transfer workflow. Keep currently boosted listings
    // ahead of regular listings and preserve newest-first ordering within each.
    const now = Date.now();
    return listings.sort((first, second) => {
        const firstBoosted = Number(first.boostedUntil && new Date(first.boostedUntil).getTime() > now);
        const secondBoosted = Number(second.boostedUntil && new Date(second.boostedUntil).getTime() > now);
        return secondBoosted - firstBoosted;
    });

};

const getListingById = async (
    listingId
) => {

    return prisma.marketplaceListing.findFirst({

        where: {

            id: listingId,

            deletedAt: null

        },

        include: {

            membership: {

                include: {

                    user: {

                        select: {

                            id: true,
                            firstName: true,
                            lastName: true

                        }

                    },

                    plan: {

                        include: {

                            gym: {
                                include: {
                                    images: {
                                        orderBy: [
                                            { isPrimary: 'desc' },
                                            { displayOrder: 'asc' }
                                        ]
                                    }
                                }
                            }

                        }

                    }

                }

            },

            seller: {

                select: {

                    id: true,
                    firstName: true,
                    lastName: true

                }

            }

        }

    });

};
const getMyListings = async (
    sellerId
) => {

    return prisma.marketplaceListing.findMany({

        where: {

            sellerId,

            deletedAt: null

        },

        include: {

            membership: {

                include: {

                    plan: {

                        include: {

                            gym: true

                        }

                    },

                    user: {

                        select: {

                            id: true,
                            firstName: true,
                            lastName: true

                        }

                    }

                }

            },

            seller: {

                select: {

                    id: true,
                    firstName: true,
                    lastName: true

                }

            }

        },

        orderBy: {

            createdAt: 'desc'

        }

    });

};

const getMyListingById = async (
    listingId,
    sellerId
) => {

    const listing =
        await prisma.marketplaceListing.findFirst({

            where: {

                id: listingId,

                sellerId,

                deletedAt: null

            },

            include: {

                membership: {

                    include: {

                        plan: {

                            include: {

                                gym: true

                            }

                        },

                        user: {

                            select: {

                                id: true,
                                firstName: true,
                                lastName: true

                            }

                        }

                    }

                },

                seller: {

                    select: {

                        id: true,
                        firstName: true,
                        lastName: true

                    }

                }

            }

        });

    if (!listing) {

        throw new Error(
            'Listing not found.'
        );

    }

    return listing;

};

const cancelListing = async (
    listingId,
    sellerId
) => {

    const listing =
        await prisma.marketplaceListing.findFirst({

            where: {

                id: listingId,

                sellerId,

                deletedAt: null

            }

        });

    if (!listing) {

        throw new Error(
            'Listing not found.'
        );

    }

    if (
        !ListingRules.canCancel(
            listing
        )
    ) {

        throw new Error(
            'This listing cannot be cancelled.'
        );

    }

    if (
        !ListingTransitions.canTransition(
            listing.status,
            LISTING_STATUS.CANCELLED
        )
    ) {

        throw new Error(
            'Invalid listing state transition.'
        );

    }

    if (
        !ListingLocks.canModifyListing(
            listing
        )
    ) {

        throw new Error(
            'Listing is currently locked.'
        );

    }

    return prisma.$transaction(

        async (tx) => {

            return tx.marketplaceListing.update({

                where: {

                    id: listing.id

                },

                data: {

                    status:
                        LISTING_STATUS.CANCELLED

                }

            });

        }

    );

};

const pauseListing = async (
    listingId,
    sellerId
) => {

    const listing =
        await prisma.marketplaceListing.findFirst({

            where: {

                id: listingId,

                sellerId,

                deletedAt: null

            }

        });

    if (!listing) {

        throw new Error(
            'Listing not found.'
        );

    }

    if (
        !ListingRules.canPause(
            listing
        )
    ) {

        throw new Error(
            'This listing cannot be paused.'
        );

    }

    if (
        !ListingTransitions.canTransition(
            listing.status,
            LISTING_STATUS.PAUSED
        )
    ) {

        throw new Error(
            'Invalid listing state transition.'
        );

    }

    if (
        !ListingLocks.canModifyListing(
            listing
        )
    ) {

        throw new Error(
            'Listing is currently locked.'
        );

    }

    return prisma.$transaction(

        async (tx) => {

            return tx.marketplaceListing.update({

                where: {

                    id: listing.id

                },

                data: {

                    status:
                        LISTING_STATUS.PAUSED

                }

            });

        }

    );

};

const activateListing = async (
    listingId,
    sellerId
) => {

    const listing =
        await prisma.marketplaceListing.findFirst({

            where: {

                id: listingId,

                sellerId,

                deletedAt: null

            }

        });

    if (!listing) {

        throw new Error(
            'Listing not found.'
        );

    }

    if (
        !ListingRules.canActivate(
            listing
        )
    ) {

        throw new Error(
            'This listing cannot be activated.'
        );

    }

    if (
        !ListingTransitions.canTransition(
            listing.status,
            LISTING_STATUS.ACTIVE
        )
    ) {

        throw new Error(
            'Invalid listing state transition.'
        );

    }

    if (
        !ListingLocks.canModifyListing(
            listing
        )
    ) {

        throw new Error(
            'Listing is currently locked.'
        );

    }

    return prisma.$transaction(

        async (tx) => {

            return tx.marketplaceListing.update({

                where: {

                    id: listing.id

                },

                data: {

                    status:
                        LISTING_STATUS.ACTIVE

                }

            });

        }

    );

};
const renewListing = async (
    listingId,
    sellerId
) => {

    const listing =
        await prisma.marketplaceListing.findFirst({

            where: {

                id: listingId,

                sellerId,

                deletedAt: null

            }

        });

    if (!listing) {

        throw new Error(
            'Listing not found.'
        );

    }

    if (
        !ListingRules.canRenew(
            listing
        )
    ) {

        throw new Error(
            'Listing cannot be renewed.'
        );

    }

    if (
        !ListingTransitions.canTransition(
            listing.status,
            LISTING_STATUS.ACTIVE
        )
    ) {

        throw new Error(
            'Invalid listing transition.'
        );

    }

    if (
        !ListingLocks.canModifyListing(
            listing
        )
    ) {

        throw new Error(
            'Listing is currently locked.'
        );

    }

    return prisma.$transaction(

        async (tx) => {

            return tx.marketplaceListing.update({

                where: {

                    id: listingId

                },

                data: {

                    status:
                        LISTING_STATUS.ACTIVE

                }

            });

        }

    );

};

const updateListingPrice = async (
    listingId,
    sellerId,
    askingPrice
) => {

    const normalizedAskingPrice = Number(askingPrice);

    if (
        !Number.isFinite(normalizedAskingPrice) ||
        normalizedAskingPrice <= 0
    ) {

        throw new Error(
            'Invalid asking price.'
        );

    }

    const listing =
        await prisma.marketplaceListing.findFirst({
            where: {
                id: listingId,
                sellerId,
                deletedAt: null
            },
            include: {
                membership: {
                    include: {
                        plan: true
                    }
                }
            }
        });

    if (!listing) {

        throw new Error(
            'Listing not found.'
        );

    }

    if (
        !ListingRules.canEditPrice(
            listing
        )
    ) {

        throw new Error(
            'Listing price cannot be updated.'
        );

    }

    const planPrice = listing.membership.plan.price;
    if (
        normalizedAskingPrice < planPrice * 0.30 ||
        normalizedAskingPrice > planPrice
    ) {
        throw new Error(
            `Asking price must be between ₹${(planPrice * 0.30).toFixed(0)} and ₹${planPrice}`
        );
    }

    if (
        !ListingLocks.canModifyListing(
            listing
        )
    ) {

        throw new Error(
            'Listing is currently locked.'
        );

    }

    return prisma.$transaction(

        async (tx) => {

            return tx.marketplaceListing.update({

                where: {

                    id: listingId

                },

                data: {

                    askingPrice: normalizedAskingPrice

                }

            });

        }

    );

};

const deleteListing = async (
    listingId,
    sellerId
) => {

    const listing =
        await prisma.marketplaceListing.findFirst({

            where: {

                id: listingId,

                sellerId,

                deletedAt: null

            }

        });

    if (!listing) {

        throw new Error(
            'Listing not found.'
        );

    }

    if (
        !ListingRules.canCancel(
            listing
        )
    ) {

        throw new Error(
            'This listing cannot be deleted.'
        );

    }

    if (
        !ListingTransitions.canTransition(
            listing.status,
            LISTING_STATUS.CANCELLED
        )
    ) {

        throw new Error(
            'Invalid listing state transition.'
        );

    }

    if (
        !ListingLocks.canModifyListing(
            listing
        )
    ) {

        throw new Error(
            'Listing is currently locked.'
        );

    }

    return prisma.$transaction(

        async (tx) => {

            return tx.marketplaceListing.update({

                where: {

                    id: listingId

                },

                data: {

                    status:
                        LISTING_STATUS.CANCELLED,

                    deletedAt:
                        new Date()

                }

            });

        }

    );

};
const getSellerAnalytics = async (
    sellerId
) => {

    const listings =
        await prisma.marketplaceListing.findMany({

            where: {

                sellerId,

                deletedAt: null

            },

            select: {

                status: true,

                askingPrice: true

            }

        });

    const analytics = {

        totalListings: listings.length,

        activeListings: 0,

        pausedListings: 0,

        soldListings: 0,

        cancelledListings: 0,

        expiredListings: 0,

        averagePrice: 0,

        highestPrice: 0,

        lowestPrice: 0,

        totalRevenue: 0

    };

    if (
        listings.length === 0
    ) {

        return analytics;

    }

    let totalPrice = 0;

    analytics.lowestPrice =
        listings[0].askingPrice;

    for (
        const listing of listings
    ) {

        totalPrice +=
            listing.askingPrice;

        if (
            listing.askingPrice >
            analytics.highestPrice
        ) {

            analytics.highestPrice =
                listing.askingPrice;

        }

        if (
            listing.askingPrice <
            analytics.lowestPrice
        ) {

            analytics.lowestPrice =
                listing.askingPrice;

        }

        switch (
        listing.status
        ) {

            case LISTING_STATUS.ACTIVE:

                analytics.activeListings++;

                break;

            case LISTING_STATUS.PAUSED:

                analytics.pausedListings++;

                break;

            case LISTING_STATUS.SOLD:

                analytics.soldListings++;

                analytics.totalRevenue +=
                    listing.askingPrice;

                break;

            case LISTING_STATUS.CANCELLED:

                analytics.cancelledListings++;

                break;

            case LISTING_STATUS.EXPIRED:

                analytics.expiredListings++;

                break;

        }

    }

    analytics.averagePrice =
        Number(
            (
                totalPrice /
                listings.length
            ).toFixed(2)
        );

    return analytics;

};
const getAllListingsForAdmin = async () => {

    return prisma.marketplaceListing.findMany({

        include: {

            seller: {

                select: {

                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true

                }

            },

            membership: {

                include: {

                    plan: {

                        include: {

                            gym: true

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

const getListingByIdForAdmin = async (
    listingId
) => {

    const listing =
        await prisma.marketplaceListing.findUnique({

            where: {

                id: listingId

            },

            include: {

                seller: true,

                membership: {

                    include: {

                        user: true,

                        plan: {

                            include: {

                                gym: true

                            }

                        }

                    }

                },

                transferRequests: {

                    include: {

                        buyer: {

                            select: {

                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true

                            }

                        }

                    }

                }

            }

        });

    if (!listing) {

        throw new Error(
            'Listing not found.'
        );

    }

    return listing;

};

const updateListingStatusByAdmin = async (
    listingId,
    status
) => {

    const listing =
        await prisma.marketplaceListing.findUnique({

            where: {

                id: listingId

            }

        });

    if (!listing) {

        throw new Error(
            'Listing not found.'
        );

    }

    if (
        !Object.values(
            LISTING_STATUS
        ).includes(status)
    ) {

        throw new Error(
            'Invalid status.'
        );

    }

    return prisma.marketplaceListing.update({

        where: {

            id: listingId

        },

        data: {

            status

        }

    });

};
module.exports = {

    createListing,

    getAllListings,

    getListingById,

    getMyListings,

    getMyListingById,

    cancelListing,

    pauseListing,

    activateListing,

    renewListing,

    updateListingPrice,

    deleteListing,

    getSellerAnalytics,
    getAllListingsForAdmin,

    getListingByIdForAdmin,

    updateListingStatusByAdmin

};
