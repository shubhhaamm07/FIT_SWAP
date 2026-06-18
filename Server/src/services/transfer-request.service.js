const prisma = require('../lib/prisma');

const createTransferRequest = async (
    buyerId,
    listingId
) => {
    const listing =
        await prisma.marketplaceListing.findUnique({
            where: {
                id: listingId
            },
            include: {
                membership: true
            }
        });

    // Listing Exists
    if (!listing) {
        throw new Error(
            'Listing not found'
        );
    }

    // Listing Active
    if (listing.status !== 'ACTIVE') {
        throw new Error(
            'Listing is not active'
        );
    }

    // Membership Active
    if (
        listing.membership.status !==
        'ACTIVE'
    ) {
        throw new Error(
            'Membership is not active'
        );
    }

    // Seller Cannot Buy Own Listing
    if (listing.sellerId === buyerId) {
        throw new Error(
            'You cannot request your own listing'
        );
    }

    // Duplicate Request Check
    const existingRequest =
        await prisma.transferRequest.findUnique({
            where: {
                listingId_buyerId: {
                    listingId,
                    buyerId
                }
            }
        });

    if (existingRequest) {
        throw new Error(
            'Transfer request already exists'
        );
    }

    return prisma.transferRequest.create({
        data: {
            listingId,
            buyerId
        }
    });
};
const getMyTransferRequests = async (
    buyerId
) => {
    return prisma.transferRequest.findMany({
        where: {
            buyerId
        },
        include: {
            listing: {
                include: {
                    membership: {
                        include: {
                            plan: true
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
const getIncomingTransferRequests = async (
    sellerId
) => {
    return prisma.transferRequest.findMany({
        where: {
            listing: {
                sellerId
            }
        },
        include: {
            buyer: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                }
            },
            listing: {
                include: {
                    membership: {
                        include: {
                            plan: true
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
const approveTransferRequest = async (
    requestId,
    sellerId
) => {
    const request =
        await prisma.transferRequest.findUnique({
            where: {
                id: requestId
            },
            include: {
                buyer: true,
                listing: {
                    include: {
                        membership: {
                            include: {
                                plan: true
                            }
                        }
                    }
                }
            }
        });

    if (!request) {
        throw new Error(
            'Transfer request not found'
        );
    }

    if (request.status !== 'PENDING') {
        throw new Error(
            'Transfer request is not pending'
        );
    }

    if (
        request.listing.sellerId !==
        sellerId
    ) {
        throw new Error(
            'Unauthorized'
        );
    }

    if (
        request.listing.status !==
        'ACTIVE'
    ) {
        throw new Error(
            'Listing is not active'
        );
    }

    if (
        request.listing.membership
            .status !== 'ACTIVE'
    ) {
        throw new Error(
            'Membership is not active'
        );
    }

    if (
        !request.listing.membership.plan
            .transferable
    ) {
        throw new Error(
            'Membership is not transferable'
        );
    }

    return prisma.$transaction(
        async (tx) => {
            const approvedRequest =
                await tx.transferRequest.update({
                    where: {
                        id: requestId
                    },
                    data: {
                        status: 'APPROVED'
                    }
                });

            await tx.transferRequest.updateMany({
                where: {
                    listingId:
                        request.listingId,
                    id: {
                        not: requestId
                    }
                },
                data: {
                    status: 'REJECTED'
                }
            });

            await tx.userMembership.update({
                where: {
                    id: request.listing
                        .membershipId
                },
                data: {
                    userId:
                        request.buyerId
                }
            });

            await tx.marketplaceListing.update({
                where: {
                    id: request.listingId
                },
                data: {
                    status: 'SOLD'
                }
            });

            return approvedRequest;
        }
    );
};
const rejectTransferRequest = async (
    requestId,
    sellerId
) => {
    const request =
        await prisma.transferRequest.findUnique({
            where: {
                id: requestId
            },
            include: {
                listing: true
            }
        });

    if (!request) {
        throw new Error(
            'Transfer request not found'
        );
    }

    if (request.status !== 'PENDING') {
        throw new Error(
            'Transfer request is not pending'
        );
    }

    if (
        request.listing.sellerId !==
        sellerId
    ) {
        throw new Error(
            'Unauthorized'
        );
    }

    return prisma.transferRequest.update({
        where: {
            id: requestId
        },
        data: {
            status: 'REJECTED'
        }
    });
};
module.exports = {
    createTransferRequest, getMyTransferRequests, getIncomingTransferRequests, approveTransferRequest, rejectTransferRequest
};