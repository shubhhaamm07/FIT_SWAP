const prisma = require('../lib/prisma');

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

    return prisma.savedListing.upsert({
        where: { userId_listingId: { userId, listingId } },
        update: {},
        create: { userId, listingId }
    });
};

const removeSavedListing = async (userId, listingId) => {
    const savedListing = await prisma.savedListing.findUnique({
        where: { userId_listingId: { userId, listingId } }
    });

    if (!savedListing) throw new Error('Saved listing not found');

    return prisma.savedListing.delete({ where: { id: savedListing.id } });
};

module.exports = { getSavedListings, saveListing, removeSavedListing };
