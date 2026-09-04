const crypto = require('crypto');

const prisma = require('../lib/prisma');
const notificationService = require('./notification.service');
const {
    assertMembershipEligible,
    getTransferPolicy,
    writeTransferAudit,
} = require('./transfer-policy.service');

const REQUEST_TTL_MS = 30 * 60 * 1000;
const GYM_APPROVAL_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const OPEN_STATUSES = ['AWAITING_PAYMENT', 'BUYER_MARKED_PAID'];
const EXPIRABLE_STATUSES = [...OPEN_STATUSES, 'AWAITING_GYM_APPROVAL'];
const UPI_ID_PATTERN = /^[a-zA-Z0-9._-]{2,100}@[a-zA-Z0-9._-]{2,100}$/;
const UTR_PATTERN = /^[A-Za-z0-9-]{6,40}$/;

const upiError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const makePaymentReference = () =>
    `FSUPI-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

const expireOutstandingRequests = async () => {
    await prisma.upiPaymentRequest.updateMany({
        where: {
            status: { in: EXPIRABLE_STATUSES },
            expiresAt: { lte: new Date() },
        },
        data: { status: 'EXPIRED' },
    });
};

const amountInPaise = (amount) => {
    const paise = Math.round(Number(amount) * 100);
    if (!Number.isSafeInteger(paise) || paise < 100) {
        throw upiError('The payment amount must be at least ₹1.00.');
    }
    return paise;
};

const requireRecipientUpi = (recipient) => {
    if (!recipient?.upiId || !recipient?.upiPayeeName) {
        throw upiError('The payment recipient has not configured UPI details yet. Please try again later.', 409);
    }

    if (!UPI_ID_PATTERN.test(recipient.upiId)) {
        throw upiError('The payment recipient has invalid UPI details. Please contact support.', 409);
    }
};

const requestInclude = {
    buyer: {
        select: { id: true, firstName: true, lastName: true, email: true },
    },
    recipient: {
        select: { id: true, firstName: true, lastName: true, upiId: true, upiPayeeName: true },
    },
    listing: {
        include: {
            seller: { select: { id: true, firstName: true, lastName: true } },
            membership: {
                include: {
                    plan: {
                        include: { gym: { select: { id: true, name: true, city: true, ownerId: true } } },
                    },
                },
            },
        },
    },
    gym: { select: { id: true, name: true, city: true, ownerId: true } },
    plan: { select: { id: true, name: true, durationInDays: true, price: true } },
};

const serializeForBuyer = (request) => ({
    ...request,
    upiIntent: request.status === 'AWAITING_PAYMENT'
        ? `upi://pay?pa=${encodeURIComponent(request.recipientUpiId)}&pn=${encodeURIComponent(request.payeeName)}&am=${(request.amount / 100).toFixed(2)}&cu=INR&tn=${encodeURIComponent(request.paymentRef)}`
        : null,
});

const findReusableRequest = async (where) => {
    const request = await prisma.upiPaymentRequest.findFirst({
        where: {
            ...where,
            status: { in: OPEN_STATUSES },
            expiresAt: { gt: new Date() },
        },
        include: requestInclude,
        orderBy: { createdAt: 'desc' },
    });

    return request ? serializeForBuyer(request) : null;
};

const createGymMembershipRequest = async (buyerId, planId) => {
    await expireOutstandingRequests();

    const plan = await prisma.membershipPlan.findUnique({
        where: { id: planId },
        include: {
            gym: {
                include: {
                    owner: {
                        select: { id: true, upiId: true, upiPayeeName: true },
                    },
                },
            },
        },
    });

    if (!plan || plan.gym.status !== 'APPROVED') {
        throw upiError('This gym membership is not available for direct purchase.', 404);
    }

    const existingMembership = await prisma.userMembership.findFirst({
        where: { userId: buyerId, planId, status: 'ACTIVE' },
        select: { id: true },
    });
    if (existingMembership) {
        throw upiError('You already have an active membership for this plan.', 409);
    }

    const reusable = await findReusableRequest({ buyerId, planId, kind: 'GYM_MEMBERSHIP' });
    if (reusable) return reusable;

    const recipient = plan.gym.owner;
    requireRecipientUpi(recipient);

    const request = await prisma.upiPaymentRequest.create({
        data: {
            kind: 'GYM_MEMBERSHIP',
            buyerId,
            recipientId: recipient.id,
            gymId: plan.gymId,
            planId: plan.id,
            amount: amountInPaise(plan.price),
            paymentRef: makePaymentReference(),
            recipientUpiId: recipient.upiId,
            payeeName: recipient.upiPayeeName,
            expiresAt: new Date(Date.now() + REQUEST_TTL_MS),
        },
        include: requestInclude,
    });

    return serializeForBuyer(request);
};

const createMarketplaceRequest = async (buyerId, listingId) => {
    await expireOutstandingRequests();

    const listing = await prisma.marketplaceListing.findUnique({
        where: { id: listingId },
        include: {
            seller: { select: { id: true, upiId: true, upiPayeeName: true }, },
            membership: { include: { plan: { include: { gym: true } } } },
        },
    });

    if (!listing || listing.deletedAt || listing.status !== 'ACTIVE') {
        throw upiError('This listing is no longer available for payment.', 404);
    }
    if (listing.sellerId === buyerId) {
        throw upiError('You cannot pay for your own listing.');
    }
    try {
        assertMembershipEligible(listing.membership, {
            sellerId: listing.sellerId,
            allowCurrentListing: true,
            paymentMethod: 'ONLINE',
        });
    } catch (error) {
        throw upiError(error.message, error.statusCode || 409);
    }

    const existingForListing = await prisma.upiPaymentRequest.findFirst({
        where: {
            listingId,
            status: { in: ['AWAITING_PAYMENT', 'BUYER_MARKED_PAID', 'AWAITING_GYM_APPROVAL'] },
        },
        include: requestInclude,
        orderBy: { createdAt: 'desc' },
    });

    if (existingForListing) {
        if (existingForListing.buyerId === buyerId && existingForListing.status !== 'AWAITING_GYM_APPROVAL' && existingForListing.expiresAt > new Date()) {
            return serializeForBuyer(existingForListing);
        }
        throw upiError('Another payment handover is already in progress for this listing.', 409);
    }

    requireRecipientUpi(listing.seller);

    const request = await prisma.$transaction(async (tx) => {
        const created = await tx.upiPaymentRequest.create({
            data: {
                kind: 'MARKETPLACE_TRANSFER',
                buyerId,
                recipientId: listing.sellerId,
                listingId: listing.id,
                gymId: listing.membership.plan.gymId,
                planId: listing.membership.planId,
                // The pilot sends one transparent payment directly to the seller.
                // Platform/gym fees are intentionally not collected in this manual UPI flow.
                amount: amountInPaise(listing.askingPrice),
                paymentRef: makePaymentReference(),
                recipientUpiId: listing.seller.upiId,
                payeeName: listing.seller.upiPayeeName,
                expiresAt: new Date(Date.now() + REQUEST_TTL_MS),
            },
            include: requestInclude,
        });
        await writeTransferAudit(tx, {
            membershipId: listing.membershipId,
            listingId: listing.id,
            actorId: buyerId,
            actorRole: 'USER',
            action: 'ONLINE_TRANSFER_REQUEST_CREATED',
            summary: 'Buyer started an online membership-transfer payment request.',
            metadata: { paymentRef: created.paymentRef, policy: getTransferPolicy(listing.membership.plan) },
        });
        return created;
    });

    return serializeForBuyer(request);
};

const markPaymentPaid = async (buyerId, requestId, utr) => {
    await expireOutstandingRequests();
    const normalizedUtr = String(utr || '').trim().toUpperCase();
    if (!UTR_PATTERN.test(normalizedUtr)) {
        throw upiError('Enter the UPI UTR/reference number shown by your payment app.');
    }

    // A UTR is issued by the bank for one payment. Reject a reused reference
    // before asking a recipient to review it. The database unique constraint
    // below also protects against two requests being submitted concurrently.
    const [matchingManualRequest, matchingPlatformRequest] = await Promise.all([
        prisma.upiPaymentRequest.findFirst({
            where: { utr: normalizedUtr, id: { not: requestId } },
            select: { id: true },
        }),
        prisma.platformPaymentRequest.findFirst({
            where: { utr: normalizedUtr },
            select: { id: true },
        }),
    ]);
    if (matchingManualRequest || matchingPlatformRequest) {
        throw upiError('This UPI UTR/reference has already been used for another FitSwap payment request.', 409);
    }

    let update;
    try {
        update = await prisma.upiPaymentRequest.updateMany({
            where: {
                id: requestId,
                buyerId,
                status: 'AWAITING_PAYMENT',
                expiresAt: { gt: new Date() },
            },
            data: {
                status: 'BUYER_MARKED_PAID',
                utr: normalizedUtr,
                buyerMarkedPaidAt: new Date(),
            },
        });
    } catch (error) {
        if (error?.code === 'P2002') {
            throw upiError('This UPI UTR/reference has already been used for another FitSwap payment request.', 409);
        }
        throw error;
    }

    if (update.count !== 1) {
        throw upiError('This payment request is no longer waiting for payment.', 409);
    }

    const request = await prisma.upiPaymentRequest.findUnique({
        where: { id: requestId },
        include: requestInclude,
    });

    await notificationService.createNotification(
        request.recipientId,
        'UPI payment needs your confirmation',
        `Check your bank app for ${request.paymentRef} (UTR: ${normalizedUtr}) before confirming this payment.`
    );

    return serializeForBuyer(request);
};

const completeMarketplaceTransfer = async ({ request, actorId, actorRole, gymApproved }) => {
    return prisma.$transaction(async (tx) => {
        const listing = await tx.marketplaceListing.findFirst({
            where: {
                id: request.listingId,
                sellerId: request.recipientId,
                status: 'ACTIVE',
                deletedAt: null,
            },
            include: {
                membership: {
                    include: { plan: { include: { gym: true } } },
                },
            },
        });
        if (!listing) {
            throw upiError('This listing is no longer eligible for transfer.', 409);
        }

        try {
            assertMembershipEligible(listing.membership, {
                sellerId: request.recipientId,
                allowCurrentListing: true,
                paymentMethod: 'ONLINE',
            });
        } catch (error) {
            throw upiError(error.message, error.statusCode || 409);
        }

        const movedMembership = await tx.userMembership.updateMany({
            where: { id: listing.membershipId, userId: request.recipientId, status: 'ACTIVE' },
            data: { userId: request.buyerId, transferCount: { increment: 1 } },
        });
        if (movedMembership.count !== 1) {
            throw upiError('This membership was already transferred or changed.', 409);
        }

        const soldListing = await tx.marketplaceListing.updateMany({
            where: { id: listing.id, status: 'ACTIVE', sellerId: request.recipientId },
            data: { status: 'SOLD' },
        });
        if (soldListing.count !== 1) {
            throw upiError('This listing was already updated.', 409);
        }

        await tx.upiPaymentRequest.update({
            where: { id: request.id },
            data: {
                status: 'COMPLETED',
                recipientConfirmedAt: new Date(),
                gymApprovedAt: gymApproved ? new Date() : undefined,
                completedAt: new Date(),
            },
        });

        await tx.transferRequest.upsert({
            where: { listingId_buyerId: { listingId: listing.id, buyerId: request.buyerId } },
            update: { status: 'APPROVED' },
            create: { listingId: listing.id, buyerId: request.buyerId, status: 'APPROVED' },
        });
        await tx.transferRequest.updateMany({
            where: { listingId: listing.id, buyerId: { not: request.buyerId }, status: 'PENDING' },
            data: { status: 'REJECTED' },
        });

        await writeTransferAudit(tx, {
            membershipId: listing.membershipId,
            listingId: listing.id,
            actorId,
            actorRole,
            action: gymApproved ? 'GYM_APPROVED_TRANSFER' : 'TRANSFER_COMPLETED',
            summary: gymApproved
                ? 'Gym owner approved the membership handover.'
                : 'Membership handover completed after seller-confirmed online payment.',
            metadata: { paymentRequestId: request.id, transferCount: Number(listing.membership.transferCount || 0) + 1 },
        });

        return { sellerId: listing.sellerId, listingId: listing.id };
    });
};

const confirmPaymentReceived = async (recipientId, requestId) => {
    await expireOutstandingRequests();
    const request = await prisma.upiPaymentRequest.findFirst({
        where: { id: requestId, recipientId, status: 'BUYER_MARKED_PAID' },
        include: requestInclude,
    });

    if (!request) {
        throw upiError('This payment is not ready for your confirmation.', 409);
    }

    if (request.kind === 'MARKETPLACE_TRANSFER') {
        const policy = getTransferPolicy(request.listing.membership.plan);
        if (!policy.requiresGymApproval) {
            const completed = await completeMarketplaceTransfer({
                request,
                actorId: recipientId,
                actorRole: 'USER',
                gymApproved: false,
            });
            await Promise.all([
                notificationService.createNotification(request.buyerId, 'Membership transfer completed', 'The seller confirmed your UPI payment and the membership is now in your FitSwap account.'),
                notificationService.createNotification(completed.sellerId, 'Membership transfer completed', 'Your UPI payment confirmation completed the membership handover.'),
            ]);
            return { status: 'COMPLETED', listingId: completed.listingId };
        }

        const updated = await prisma.$transaction(async (tx) => {
            const pendingApproval = await tx.upiPaymentRequest.update({
                where: { id: request.id },
                data: {
                    status: 'AWAITING_GYM_APPROVAL',
                    recipientConfirmedAt: new Date(),
                    expiresAt: new Date(Date.now() + GYM_APPROVAL_TTL_MS),
                },
                include: requestInclude,
            });
            await writeTransferAudit(tx, {
                membershipId: request.listing.membershipId,
                listingId: request.listingId,
                actorId: recipientId,
                actorRole: 'USER',
                action: 'SELLER_CONFIRMED_PAYMENT',
                summary: 'Seller confirmed payment; the transfer is waiting for gym approval.',
                metadata: { paymentRequestId: request.id },
            });
            return pendingApproval;
        });

        await Promise.all([
            notificationService.createNotification(request.buyerId, 'Seller confirmed your UPI payment', 'The gym now needs to approve the membership transfer.'),
            notificationService.createNotification(request.gym.ownerId, 'UPI transfer needs gym approval', `A seller confirmed payment for ${request.listing.membership.plan.name}. Review the transfer in Owner Operations.`),
        ]);

        return updated;
    }

    const completed = await prisma.$transaction(async (tx) => {
        const plan = await tx.membershipPlan.findFirst({
            where: { id: request.planId, gym: { status: 'APPROVED', ownerId: recipientId } },
            include: { gym: true },
        });
        if (!plan) {
            throw upiError('This gym plan is no longer available.', 409);
        }

        const currentMembership = await tx.userMembership.findFirst({
            where: { userId: request.buyerId, planId: plan.id, status: 'ACTIVE' },
            select: { id: true },
        });
        if (currentMembership) {
            throw upiError('The buyer already has an active plan. Reject this payment request and resolve it manually.', 409);
        }

        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + plan.durationInDays);
        const membership = await tx.userMembership.create({
            data: {
                userId: request.buyerId,
                planId: plan.id,
                startDate,
                endDate,
                purchasePrice: plan.price,
                status: 'ACTIVE',
            },
        });

        await tx.upiPaymentRequest.update({
            where: { id: request.id },
            data: {
                status: 'COMPLETED',
                recipientConfirmedAt: new Date(),
                completedAt: new Date(),
            },
        });

        return membership;
    });

    await notificationService.createNotification(
        request.buyerId,
        'UPI payment confirmed — membership activated',
        `Your ${request.plan.name} membership at ${request.gym.name} is now active.`
    );

    return { membershipId: completed.id, status: 'COMPLETED' };
};

const approveMarketplaceTransfer = async (ownerId, requestId) => {
    const request = await prisma.upiPaymentRequest.findFirst({
        where: {
            id: requestId,
            kind: 'MARKETPLACE_TRANSFER',
            status: 'AWAITING_GYM_APPROVAL',
            gym: { ownerId },
        },
        include: requestInclude,
    });

    if (!request) {
        throw upiError('This UPI transfer is not ready for your gym approval.', 409);
    }

    await completeMarketplaceTransfer({
        request,
        actorId: ownerId,
        actorRole: 'GYM_OWNER',
        gymApproved: true,
    });

    await Promise.all([
        notificationService.createNotification(request.buyerId, 'Gym approved your UPI transfer', 'The membership is now available in your FitSwap account.'),
        notificationService.createNotification(request.recipientId, 'Gym approved membership transfer', 'The buyer now owns the membership after your UPI payment confirmation.'),
    ]);

    return { status: 'COMPLETED' };
};

const rejectPayment = async (actorId, requestId, reason) => {
    const request = await prisma.upiPaymentRequest.findFirst({
        where: {
            id: requestId,
            OR: [
                { recipientId: actorId, status: 'BUYER_MARKED_PAID' },
                { gym: { ownerId: actorId }, status: 'AWAITING_GYM_APPROVAL' },
            ],
        },
        include: requestInclude,
    });
    if (!request) {
        throw upiError('You cannot reject this payment request.', 403);
    }

    const rejectionReason = String(reason || '').trim().slice(0, 280) || 'Payment or transfer could not be confirmed.';
    await prisma.$transaction(async (tx) => {
        await tx.upiPaymentRequest.update({
            where: { id: request.id },
            data: { status: 'REJECTED', rejectedAt: new Date(), rejectionReason },
        });
        if (request.kind === 'MARKETPLACE_TRANSFER' && request.listing) {
            await writeTransferAudit(tx, {
                membershipId: request.listing.membershipId,
                listingId: request.listingId,
                actorId,
                actorRole: request.gym?.ownerId === actorId ? 'GYM_OWNER' : 'USER',
                action: 'ONLINE_TRANSFER_REJECTED',
                summary: 'A marketplace payment or handover was rejected.',
                metadata: { paymentRequestId: request.id, reason: rejectionReason },
            });
        }
    });
    await notificationService.createNotification(request.buyerId, 'UPI payment request was rejected', rejectionReason);
    return { status: 'REJECTED' };
};

const cancelPaymentRequest = async (buyerId, requestId) => {
    const update = await prisma.upiPaymentRequest.updateMany({
        where: { id: requestId, buyerId, status: 'AWAITING_PAYMENT' },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
    if (update.count !== 1) {
        throw upiError('Only a payment request that has not been marked paid can be cancelled.', 409);
    }
    return { status: 'CANCELLED' };
};

const getMyUpiRequests = async (userId) => {
    await expireOutstandingRequests();
    const [outgoing, incoming] = await Promise.all([
        prisma.upiPaymentRequest.findMany({ where: { buyerId: userId }, include: requestInclude, orderBy: { createdAt: 'desc' } }),
        prisma.upiPaymentRequest.findMany({ where: { recipientId: userId }, include: requestInclude, orderBy: { createdAt: 'desc' } }),
    ]);
    return { outgoing: outgoing.map(serializeForBuyer), incoming };
};

const getGymApprovalRequests = async (ownerId) => {
    await expireOutstandingRequests();
    return prisma.upiPaymentRequest.findMany({
        where: { kind: 'MARKETPLACE_TRANSFER', status: 'AWAITING_GYM_APPROVAL', gym: { ownerId } },
        include: requestInclude,
        orderBy: { recipientConfirmedAt: 'asc' },
    });
};

module.exports = {
    createGymMembershipRequest,
    createMarketplaceRequest,
    markPaymentPaid,
    confirmPaymentReceived,
    approveMarketplaceTransfer,
    rejectPayment,
    cancelPaymentRequest,
    getMyUpiRequests,
    getGymApprovalRequests,
};
