const prisma = require('../lib/prisma');
const { getMemberPlusEntitlement } = require('./platform-billing.service');

const FREE_SAVED_LISTING_LIMIT = 5;

const listingInclude = {
    membership: {
        include: {
            user: {
                select: { id: true, firstName: true, lastName: true }
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
        select: { id: true, firstName: true, lastName: true }
    }
};

const getSavedListings = (userId) => prisma.savedListing.findMany({
    where: { userId },
    include: { listing: { include: listingInclude } },
    orderBy: { createdAt: 'desc' }
});

const saveListing = async (userId, listingId) => {
    const listing = await prisma.marketplaceListing.findFirst({
        where: { id: listingId, status: 'ACTIVE', deletedAt: null }
    });

    if (!listing) throw new Error('Listing is not available to save');

    const existing = await prisma.savedListing.findUnique({
        where: { userId_listingId: { userId, listingId } },
        select: { id: true },
    });
    if (existing) return existing;

    const plus = await getMemberPlusEntitlement(userId);
    if (!plus.isFitSwapPlus) {
        const savedCount = await prisma.savedListing.count({ where: { userId } });
        if (savedCount >= FREE_SAVED_LISTING_LIMIT) {
            throw new Error(`Free accounts can save up to ${FREE_SAVED_LISTING_LIMIT} listings. Upgrade to FitSwap Plus for unlimited saves and price-drop alerts.`);
        }
    }

    return prisma.savedListing.create({ data: { userId, listingId } });
};

const removeSavedListing = async (userId, listingId) => {
    const savedListing = await prisma.savedListing.findUnique({
        where: { userId_listingId: { userId, listingId } }
    });

    if (!savedListing) throw new Error('Saved listing not found');

    return prisma.savedListing.delete({ where: { id: savedListing.id } });
};

module.exports = { getSavedListings, saveListing, removeSavedListing };
