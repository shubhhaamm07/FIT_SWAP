const prisma = require('../lib/prisma');
const {
    assertMembershipEligible,
    getTransferPolicy,
    writeTransferAudit,
} = require('./transfer-policy.service');


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
                membership: {
                    include: {
                        plan: {
                            include: { gym: true }
                        }
                    }
                }
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

    assertMembershipEligible(listing.membership, {
        sellerId: listing.sellerId,
        allowCurrentListing: true,
        paymentMethod: 'CASH',
    });

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

    const transferRequest = await prisma.$transaction(async (tx) => {
        const created = await tx.transferRequest.create({
            data: { listingId, buyerId }
        });
        await writeTransferAudit(tx, {
            membershipId: listing.membershipId,
            listingId,
            actorId: buyerId,
            actorRole: 'USER',
            action: 'CASH_TRANSFER_REQUEST_CREATED',
            summary: 'Buyer created a cash transfer request after policy eligibility passed.',
        });
        return created;
    });

    await notificationService.createTransactionalNotification(
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
                                plan: {
                                    include: { gym: true }
                                }
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

    const policy = getTransferPolicy(request.listing.membership.plan);

    assertMembershipEligible(request.listing.membership, {
        sellerId,
        allowCurrentListing: true,
        paymentMethod: 'CASH',
    });

    if (policy.requiresGymApproval) {
        const awaitingApproval = await prisma.$transaction(async (tx) => {
            const update = await tx.transferRequest.updateMany({
                where: { id: requestId, status: 'PENDING' },
                data: { status: 'AWAITING_GYM_APPROVAL' },
            });
            if (update.count !== 1) throw new Error('Transfer request has already been processed');
            await writeTransferAudit(tx, {
                membershipId: request.listing.membershipId,
                listingId: request.listingId,
                actorId: sellerId,
                actorRole: 'USER',
                action: 'CASH_SELLER_CONFIRMED',
                summary: 'Seller confirmed the cash transfer request; gym approval is required.',
            });
            return tx.transferRequest.findUnique({ where: { id: requestId } });
        });

        await Promise.all([
            notificationService.createTransactionalNotification(request.buyerId, 'Cash transfer awaiting gym approval', 'The seller confirmed your request. The gym owner must approve the membership handover.'),
            notificationService.createTransactionalNotification(request.listing.membership.plan.gym.ownerId, 'Cash transfer needs gym approval', `Review the cash membership handover for ${request.listing.membership.plan.name}.`),
        ]);
        return awaitingApproval;
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
                            userId: request.buyerId,
                            transferCount: { increment: 1 }
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

                await writeTransferAudit(tx, {
                    membershipId: request.listing.membershipId,
                    listingId: request.listingId,
                    actorId: sellerId,
                    actorRole: 'USER',
                    action: 'CASH_TRANSFER_COMPLETED',
                    summary: 'Seller completed a cash transfer permitted by the gym policy.',
                });

                return tx.transferRequest.findUnique({
                    where: { id: requestId }
                });
            }
        );

    await notificationService.createTransactionalNotification(
        request.buyerId,
        'Transfer Request Approved',
        'Your transfer request has been approved.'
    );

    return approvedRequest;
};

const getGymCashApprovalRequests = async (ownerId) => prisma.transferRequest.findMany({
    where: {
        status: 'AWAITING_GYM_APPROVAL',
        listing: { membership: { plan: { gym: { ownerId } } } },
    },
    include: {
        buyer: { select: { id: true, firstName: true, lastName: true, email: true } },
        listing: {
            include: {
                seller: { select: { id: true, firstName: true, lastName: true } },
                membership: { include: { plan: { include: { gym: true } } } },
            },
        },
    },
    orderBy: { updatedAt: 'asc' },
});

const approveCashTransferByGymOwner = async (requestId, ownerId) => {
    const request = await prisma.transferRequest.findUnique({
        where: { id: requestId },
        include: {
            buyer: { select: { id: true, firstName: true, lastName: true } },
            listing: {
                include: {
                    membership: { include: { plan: { include: { gym: true } } } },
                },
            },
        },
    });
    if (!request || request.status !== 'AWAITING_GYM_APPROVAL' || request.listing.membership.plan.gym.ownerId !== ownerId) {
        throw new Error('This cash transfer is not ready for your gym approval.');
    }

    assertMembershipEligible(request.listing.membership, {
        sellerId: request.listing.sellerId,
        allowCurrentListing: true,
        paymentMethod: 'CASH',
    });

    const approved = await prisma.$transaction(async (tx) => {
        const requestUpdate = await tx.transferRequest.updateMany({
            where: { id: request.id, status: 'AWAITING_GYM_APPROVAL' },
            data: { status: 'APPROVED' },
        });
        if (requestUpdate.count !== 1) throw new Error('Transfer request has already been processed');

        const membershipUpdate = await tx.userMembership.updateMany({
            where: { id: request.listing.membershipId, userId: request.listing.sellerId, status: 'ACTIVE' },
            data: { userId: request.buyerId, transferCount: { increment: 1 } },
        });
        if (membershipUpdate.count !== 1) throw new Error('Membership is no longer available for transfer');

        const listingUpdate = await tx.marketplaceListing.updateMany({
            where: { id: request.listingId, sellerId: request.listing.sellerId, status: 'ACTIVE', deletedAt: null },
            data: { status: 'SOLD' },
        });
        if (listingUpdate.count !== 1) throw new Error('Listing is no longer available for transfer');

        await tx.transferRequest.updateMany({
            where: { listingId: request.listingId, id: { not: request.id }, status: { in: ['PENDING', 'AWAITING_GYM_APPROVAL'] } },
            data: { status: 'REJECTED' },
        });
        await writeTransferAudit(tx, {
            membershipId: request.listing.membershipId,
            listingId: request.listingId,
            actorId: ownerId,
            actorRole: 'GYM_OWNER',
            action: 'GYM_APPROVED_CASH_TRANSFER',
            summary: 'Gym owner approved the cash membership handover.',
        });
        return tx.transferRequest.findUnique({ where: { id: request.id } });
    });

    await Promise.all([
        notificationService.createTransactionalNotification(request.buyerId, 'Gym approved your cash transfer', 'The membership is now available in your FitSwap account.'),
        notificationService.createTransactionalNotification(request.listing.sellerId, 'Gym approved cash membership transfer', 'The buyer now owns the membership.'),
    ]);
    return approved;
};

const rejectCashTransferByGymOwner = async (requestId, ownerId) => {
    const request = await prisma.transferRequest.findUnique({
        where: { id: requestId },
        include: { listing: { include: { membership: { include: { plan: { include: { gym: true } } } } } } },
    });
    if (!request || request.status !== 'AWAITING_GYM_APPROVAL' || request.listing.membership.plan.gym.ownerId !== ownerId) {
        throw new Error('This cash transfer is not ready for your gym review.');
    }

    const rejected = await prisma.$transaction(async (tx) => {
        const update = await tx.transferRequest.updateMany({
            where: { id: request.id, status: 'AWAITING_GYM_APPROVAL' },
            data: { status: 'REJECTED' },
        });
        if (update.count !== 1) throw new Error('Transfer request has already been processed');
        await writeTransferAudit(tx, {
            membershipId: request.listing.membershipId,
            listingId: request.listingId,
            actorId: ownerId,
            actorRole: 'GYM_OWNER',
            action: 'GYM_REJECTED_CASH_TRANSFER',
            summary: 'Gym owner rejected the cash membership handover.',
        });
        return tx.transferRequest.findUnique({ where: { id: request.id } });
    });
    await notificationService.createTransactionalNotification(request.buyerId, 'Cash transfer was rejected', 'The gym owner did not approve this membership handover.');
    return rejected;
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

    await writeTransferAudit(prisma, {
        membershipId: request.listing.membershipId,
        listingId: request.listingId,
        actorId: sellerId,
        actorRole: 'USER',
        action: 'CASH_TRANSFER_REJECTED',
        summary: 'Seller rejected a cash transfer request.',
    });

    await notificationService.createTransactionalNotification(
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

    await writeTransferAudit(prisma, {
        membershipId: request.listing.membershipId,
        listingId: request.listingId,
        actorId: buyerId,
        actorRole: 'USER',
        action: 'CASH_TRANSFER_CANCELLED',
        summary: 'Buyer cancelled a cash transfer request.',
    });

    await notificationService.createTransactionalNotification(
        request.listing.sellerId,
        'Transfer Request Cancelled',
        'A buyer has cancelled their transfer request.'
    );

    return prisma.transferRequest.findUnique({
        where: { id: requestId }
    });
};
module.exports = {
    createTransferRequest,
    getMyTransferRequests,
    getIncomingTransferRequests,
    approveTransferRequest,
    getGymCashApprovalRequests,
    approveCashTransferByGymOwner,
    rejectCashTransferByGymOwner,
    rejectTransferRequest,
    cancelTransferRequest,
};
