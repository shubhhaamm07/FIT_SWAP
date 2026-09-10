const prisma = require('../lib/prisma');
const { buildFairPriceSuggestion } = require('../domain/pricing/fair-price-suggestion');
const notificationService = require('./notification.service');
const { getMemberPlusEntitlement } = require('./platform-billing.service');
const { serializePublicListing } = require('../serializers/public-marketplace');
const { buildPaginationMeta, getPagination } = require('../utils/pagination');
const { toPaise, fromPaise } = require('../utils/money');
const {
    assertMembershipEligible,
    writeTransferAudit,
} = require('./transfer-policy.service');

const {
    LISTING_STATUS,
    ListingRules,
    ListingLocks,
    ListingTransitions
} = require('../domain/marketplace');

const formatAmount = (amount) => `₹${Math.round(Number(amount || 0)).toLocaleString('en-IN')}`;

const getPlusRecipientIds = async (userIds) => {
    if (!userIds.length) return [];
    const payments = await prisma.platformPaymentRequest.findMany({
        where: {
            buyerId: { in: userIds },
            kind: 'MEMBER_SUBSCRIPTION',
            status: 'COMPLETED',
            benefitExpiresAt: { gt: new Date() },
        },
        select: { buyerId: true },
    });
    return [...new Set(payments.map((payment) => payment.buyerId))];
};

// Marketplace discovery is intentionally local rather than a platform-wide
// blast: members who opted in and set the same city as the gym are alerted.
const notifyNearbyMembersOfNewListing = async ({ sellerId, city, gymName, planName, askingPrice }) => {
    const normalizedCity = String(city || '').trim();
    if (!normalizedCity) return;

    const recipients = await prisma.user.findMany({
        where: {
            id: { not: sellerId },
            role: 'USER',
            isActive: true,
            marketplaceNotifications: true,
            city: { equals: normalizedCity, mode: 'insensitive' },
        },
        select: { id: true },
        take: 200,
    });
    const plusRecipientIds = await getPlusRecipientIds(recipients.map(({ id }) => id));
    await Promise.all(plusRecipientIds.map((id) => notificationService.createNotification(
        id,
        'New membership listing near you',
        `${planName} at ${gymName} is now listed for ${formatAmount(askingPrice)}. You received this early alert with FitSwap Plus.`
    )));
};

const notifySavedUsersOfPriceDrop = async ({ listingId, sellerId, previousPrice, newPrice, gymName, planName }) => {
    const savedBy = await prisma.savedListing.findMany({
        where: { listingId, userId: { not: sellerId } },
        select: { userId: true },
    });
    const recipientIds = await getPlusRecipientIds([...new Set(savedBy.map((saved) => saved.userId))]);
    if (!recipientIds.length) return;

    const savedAmount = formatAmount(previousPrice - newPrice);
    await Promise.all(recipientIds.map((userId) => notificationService.createNotification(
        userId,
        'Price drop on a saved listing',
        `${planName} at ${gymName} dropped by ${savedAmount}; it is now ${formatAmount(newPrice)}.`
    )));
};

const createListing = async (
    sellerId,
    membershipId,
    askingPrice
) => {

    const askingPricePaise = toPaise(askingPrice);
    if (!askingPricePaise || askingPricePaise <= 0) {
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

                listings: {
                    where: { deletedAt: null, status: { in: ['ACTIVE', 'RESERVED'] } },
                    select: { id: true }
                }

            }

        });

    if (!membership) {
        throw new Error(
            'Membership not found'
        );
    }

    assertMembershipEligible(membership, { sellerId });

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
        membership.listings.length > 0
    ) {
        throw new Error(
            'Membership is already listed'
        );
    }

    const plus = await getMemberPlusEntitlement(sellerId);
    if (!plus.isFitSwapPlus) {
        const activeListingCount = await prisma.marketplaceListing.count({
            where: { sellerId, status: LISTING_STATUS.ACTIVE, deletedAt: null },
        });
        if (activeListingCount >= 1) {
            throw new Error('Free accounts can keep one active listing. Upgrade to FitSwap Plus to create multiple active listings.');
        }
    }

    const planPricePaise = toPaise(membership.plan.price);
    const minimumPricePaise = Math.ceil((planPricePaise * 30) / 100);
    if (askingPricePaise < minimumPricePaise || askingPricePaise > planPricePaise) {

        throw new Error(
            `Asking price must be between ₹${fromPaise(minimumPricePaise)} and ₹${fromPaise(planPricePaise)}`
        );

    }

    const listing = await prisma.$transaction(async (tx) => {
        const listing = await tx.marketplaceListing.create({
            data: {
                membershipId,
                sellerId,
                askingPrice: fromPaise(askingPricePaise)
            }
        });
        await writeTransferAudit(tx, {
            membershipId,
            listingId: listing.id,
            actorId: sellerId,
            actorRole: 'USER',
            action: 'LISTING_CREATED',
            summary: 'Seller created a marketplace listing after policy eligibility passed.',
            metadata: { askingPricePaise },
        });
        return listing;
    });

    // Alerts are deliberately sent after the database transaction commits so
    // members never receive a notification for a listing that failed to save.
    try {
        await notifyNearbyMembersOfNewListing({
            sellerId,
            city: membership.plan.gym.city,
            gymName: membership.plan.gym.name,
            planName: membership.plan.name,
            askingPrice: fromPaise(askingPricePaise),
        });
    } catch (error) {
        // A notification outage must never roll back a valid marketplace post.
        console.error('New-listing alerts could not be delivered', { name: error.name });
    }
    return listing;

};

const getPriceSuggestion = async (sellerId, membershipId) => {
    const plus = await getMemberPlusEntitlement(sellerId);
    if (!plus.isFitSwapPlus) {
        throw new Error('AI fair-price suggestions are a FitSwap Plus feature. Upgrade to unlock a market-based selling range.');
    }

    const membership = await prisma.userMembership.findFirst({
        where: {
            id: membershipId,
            userId: sellerId
        },
        include: {
            plan: {
                select: {
                    id: true,
                    price: true,
                    durationInDays: true,
                    transferFee: true,
                    transferable: true,
                    gymId: true,
                    gym: {
                        select: {
                            status: true
                        }
                    }
                }
            },
            listings: {
                where: { deletedAt: null, status: { in: ['ACTIVE', 'RESERVED'] } },
                select: { id: true }
            }
        }
    });

    if (!membership) throw new Error('Membership not found.');
    assertMembershipEligible(membership, { sellerId });
    if (membership.status !== 'ACTIVE') throw new Error('Only active memberships can receive a price suggestion.');
    if (membership.endDate <= new Date()) throw new Error('Expired memberships cannot be listed.');
    if (!membership.plan.transferable) throw new Error('This membership cannot be transferred.');
    if (membership.plan.gym.status !== 'APPROVED') throw new Error('Gym is not approved.');
    if (membership.listings.length > 0) throw new Error('This membership is already listed.');

    const comparableListings = await prisma.marketplaceListing.findMany({
        where: {
            status: LISTING_STATUS.ACTIVE,
            deletedAt: null,
            membershipId: {
                not: membership.id
            },
            membership: {
                plan: {
                    gymId: membership.plan.gymId
                }
            }
        },
        select: {
            askingPrice: true,
            membership: {
                select: {
                    endDate: true,
                    plan: {
                        select: {
                            price: true,
                            durationInDays: true
                        }
                    }
                }
            }
        },
        take: 24,
        orderBy: {
            createdAt: 'desc'
        }
    });

    return buildFairPriceSuggestion({ membership, comparableListings });
};

const getAllListings = async (query = {}) => {
    const { page, limit, skip } = getPagination(query, { defaultLimit: 12, maxLimit: 48 });
    const now = new Date();
    const where = {
        status: LISTING_STATUS.ACTIVE,
        deletedAt: null,
        membership: {
            endDate: { gt: now },
            plan: { gym: { status: 'APPROVED' } },
        },
    };
    const cleanText = (value) => String(value || '').trim().slice(0, 100);
    const search = cleanText(query.search);
    const gym = cleanText(query.gym);
    const state = cleanText(query.state);
    const city = cleanText(query.city);
    const minPrice = Number(query.minPrice);
    const maxPrice = Number(query.maxPrice);
    const minimumDays = Number(query.duration);

    if (Number.isFinite(minPrice) && minPrice >= 0) where.askingPrice = { gte: minPrice };
    if (Number.isFinite(maxPrice) && maxPrice >= 0) where.askingPrice = { ...(where.askingPrice || {}), lte: maxPrice };
    if (Number.isFinite(minimumDays) && minimumDays > 0) {
        where.membership.endDate = { gte: new Date(now.getTime() + minimumDays * 86_400_000) };
    }
    if (query.featuredOnly === 'true' || query.featuredOnly === true) where.boostedUntil = { gt: now };

    const gymWhere = where.membership.plan.gym;
    if (gym) gymWhere.name = { equals: gym, mode: 'insensitive' };
    if (state) gymWhere.state = { contains: state, mode: 'insensitive' };
    if (city) gymWhere.city = { contains: city, mode: 'insensitive' };
    if (search) {
        where.OR = [
            { membership: { plan: { name: { contains: search, mode: 'insensitive' } } } },
            { membership: { plan: { gym: { name: { contains: search, mode: 'insensitive' } } } } },
            { membership: { plan: { gym: { city: { contains: search, mode: 'insensitive' } } } } },
            { membership: { plan: { gym: { state: { contains: search, mode: 'insensitive' } } } } },
        ];
    }

    const sortBy = String(query.sortBy || 'newest');
    const orderBy = sortBy === 'price-low'
        ? [{ askingPrice: 'asc' }, { createdAt: 'desc' }]
        : sortBy === 'price-high'
            ? [{ askingPrice: 'desc' }, { createdAt: 'desc' }]
            : sortBy === 'remaining-days'
                ? [{ membership: { endDate: 'asc' } }, { createdAt: 'desc' }]
                : [{ boostedUntil: 'desc' }, { createdAt: 'desc' }];

    const [total, listings] = await Promise.all([
        prisma.marketplaceListing.count({ where }),
        prisma.marketplaceListing.findMany({
        where,
        skip,
        take: limit,

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
                            lastName: true,
                            username: true,
                            isProfilePublic: true,

                        }

                    }

                }

            }

        },

        orderBy,
    }),
    ]);

    return {
        items: listings.map(serializePublicListing),
        pagination: buildPaginationMeta({ page, limit, total }),
    };

};

const getListingById = async (
    listingId
) => {

    const listing = await prisma.marketplaceListing.findFirst({

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
                            lastName: true,
                            username: true,
                            isProfilePublic: true,

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
                    lastName: true,
                    username: true,
                    isProfilePublic: true,

                }

            }

        }

    });

    return listing ? serializePublicListing(listing) : null;

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

    const askingPricePaise = toPaise(askingPrice);

    if (!askingPricePaise || askingPricePaise <= 0) {

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
                        plan: {
                            include: {
                                gym: { select: { name: true } }
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

    if (
        !ListingRules.canEditPrice(
            listing
        )
    ) {

        throw new Error(
            'Listing price cannot be updated.'
        );

    }

    const planPricePaise = toPaise(listing.membership.plan.price);
    const minimumPricePaise = Math.ceil((planPricePaise * 30) / 100);
    if (askingPricePaise < minimumPricePaise || askingPricePaise > planPricePaise) {
        throw new Error(
            `Asking price must be between ₹${fromPaise(minimumPricePaise)} and ₹${fromPaise(planPricePaise)}`
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

    const updatedListing = await prisma.$transaction(

        async (tx) => {

            return tx.marketplaceListing.update({

                where: {

                    id: listingId

                },

                data: {

                    askingPrice: fromPaise(askingPricePaise)

                }

            });

        }

    );

    if (askingPricePaise < toPaise(listing.askingPrice)) {
        try {
            await notifySavedUsersOfPriceDrop({
                listingId: listing.id,
                sellerId,
                previousPrice: Number(listing.askingPrice),
                newPrice: Number(fromPaise(askingPricePaise)),
                gymName: listing.membership.plan.gym?.name || 'your saved gym',
                planName: listing.membership.plan.name,
            });
        } catch (error) {
            // Preserve the successful price change even if alerts are delayed.
            console.error('Price-drop alerts could not be delivered', { name: error.name });
        }
    }
    return updatedListing;

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

                seller: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                        role: true,
                        isActive: true
                    }
                },

                membership: {

                    include: {

                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                phone: true,
                                role: true,
                                isActive: true
                            }
                        },

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

    getPriceSuggestion,

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
