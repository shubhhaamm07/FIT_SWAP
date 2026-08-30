const prisma = require('../lib/prisma');


const notificationService = require(

    './notification.service'

);
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

    const transferRequest =
        await prisma.transferRequest.create({
            data: {
                listingId,
                buyerId
            }
        });

    await notificationService.createNotification(
        listing.sellerId,
        'Transfer Request Received',
        'A buyer has requested your membership.'
    );

    return transferRequest;
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
                            plan: {
                                include: {
                                    gym: true
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
                            plan: {
                                include: {
                                    gym: true
                                }
                            }
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

    const approvedRequest =
        await prisma.$transaction(
            async (tx) => {
                const requestUpdate =
                    await tx.transferRequest.updateMany({
                        where: {
                            id: requestId,
                            status: 'PENDING'
                        },
                        data: {
                            status: 'APPROVED'
                        }
                    });

                if (requestUpdate.count !== 1) {
                    throw new Error('Transfer request has already been processed');
                }

                const membershipUpdate =
                    await tx.userMembership.updateMany({
                        where: {
                            id: request.listing.membershipId,
                            userId: sellerId,
                            status: 'ACTIVE'
                        },
                        data: {
                            userId: request.buyerId
                        }
                    });

                if (membershipUpdate.count !== 1) {
                    throw new Error('Membership is no longer available for transfer');
                }

                const listingUpdate =
                    await tx.marketplaceListing.updateMany({
                        where: {
                            id: request.listingId,
                            sellerId,
                            status: 'ACTIVE',
                            deletedAt: null
                        },
                        data: {
                            status: 'SOLD'
                        }
                    });

                if (listingUpdate.count !== 1) {
                    throw new Error('Listing is no longer available for transfer');
                }

                await tx.transferRequest.updateMany({
                    where: {
                        listingId:
                            request.listingId,
                        status: 'PENDING',
                        id: {
                            not: requestId
                        }
                    },
                    data: {
                        status: 'REJECTED'
                    }
                });

                return tx.transferRequest.findUnique({
                    where: { id: requestId }
                });
            }
        );

    await notificationService.createNotification(
        request.buyerId,
        'Transfer Request Approved',
        'Your transfer request has been approved.'
    );

    return approvedRequest;
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

    const rejectedRequest =
        await prisma.transferRequest.updateMany({
            where: {
                id: requestId,
                buyerId: request.buyerId,
                status: 'PENDING'
            },
            data: {
                status: 'REJECTED'
            }
        });

    if (rejectedRequest.count !== 1) {
        throw new Error('Transfer request has already been processed');
    }

    await notificationService.createNotification(
        request.buyerId,
        'Transfer Request Rejected',
        'Your transfer request has been rejected.'
    );

    return prisma.transferRequest.findUnique({
        where: { id: requestId }
    });
};

const cancelTransferRequest = async (
    requestId,
    buyerId
) => {
    const request = await prisma.transferRequest.findFirst({
        where: {
            id: requestId,
            buyerId
        },
        include: {
            listing: true
        }
    });

    if (!request) {
        throw new Error('Transfer request not found');
    }

    if (request.status !== 'PENDING') {
        throw new Error('Only pending transfer requests can be cancelled');
    }

    const cancelledRequest = await prisma.transferRequest.updateMany({
        where: {
            id: requestId,
            buyerId,
            status: 'PENDING'
        },
        data: {
            status: 'CANCELLED'
        }
    });

    if (cancelledRequest.count !== 1) {
        throw new Error('Transfer request has already been processed');
    }

    await notificationService.createNotification(
        request.listing.sellerId,
        'Transfer Request Cancelled',
        'A buyer has cancelled their transfer request.'
    );

    return prisma.transferRequest.findUnique({
        where: { id: requestId }
    });
};
module.exports = {
    createTransferRequest, getMyTransferRequests, getIncomingTransferRequests, approveTransferRequest, rejectTransferRequest, cancelTransferRequest
};
