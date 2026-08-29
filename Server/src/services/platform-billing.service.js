const crypto = require('crypto');

const prisma = require('../lib/prisma');
const notificationService = require('./notification.service');

const REQUEST_TTL_MS = 30 * 60 * 1000;
const OPEN_STATUSES = ['AWAITING_PAYMENT', 'BUYER_MARKED_PAID'];
const UPI_ID_PATTERN = /^[a-zA-Z0-9._-]{2,100}@[a-zA-Z0-9._-]{2,100}$/;
const UTR_PATTERN = /^[A-Za-z0-9-]{6,40}$/;

const offers = {
    OWNER_MONTHLY: {
        kind: 'OWNER_SUBSCRIPTION',
        label: 'FitSwap Business Monthly',
        amount: 49900,
        benefitDays: 30,
    },
    OWNER_YEARLY: {
        kind: 'OWNER_SUBSCRIPTION',
        label: 'FitSwap Business Yearly',
        amount: 499900,
        benefitDays: 365,
    },
    LISTING_BOOST_7D: {
        kind: 'LISTING_BOOST',
        label: 'Featured listing boost · 7 days',
        amount: 7900,
        benefitDays: 7,
    },
};

const billingError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const paymentReference = () =>
    `FSFEE-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

const getPlatformRecipient = () => {
    const upiId = String(process.env.PLATFORM_UPI_ID || '').trim();
    const payeeName = String(process.env.PLATFORM_UPI_PAYEE_NAME || '').trim();

    if (!upiId || !payeeName) {
        throw billingError('FitSwap billing is not configured yet. Add the platform business UPI details on the server before accepting platform fees.', 503);
    }
    if (!UPI_ID_PATTERN.test(upiId) || payeeName.length < 2 || payeeName.length > 120) {
        throw billingError('FitSwap billing UPI configuration is invalid. Contact platform support.', 503);
    }

    return { upiId, payeeName };
};

const serializePayment = (payment) => ({
    ...payment,
    recipientUpiId: payment.platformUpiId,
    payeeName: payment.platformPayeeName,
    upiIntent: payment.status === 'AWAITING_PAYMENT'
        ? `upi://pay?pa=${encodeURIComponent(payment.platformUpiId)}&pn=${encodeURIComponent(payment.platformPayeeName)}&am=${(payment.amount / 100).toFixed(2)}&cu=INR&tn=${encodeURIComponent(payment.paymentRef)}`
        : null,
});

const requestInclude = {
    buyer: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
    listing: {
        select: {
            id: true,
            status: true,
            boostedUntil: true,
            askingPrice: true,
            membership: { select: { plan: { select: { name: true, gym: { select: { name: true } } } } } },
        },
    },
    confirmedByAdmin: { select: { id: true, firstName: true, lastName: true, email: true } },
};

const expireOutstandingPlatformPayments = async () => {
    await prisma.platformPaymentRequest.updateMany({
        where: { status: { in: OPEN_STATUSES }, expiresAt: { lte: new Date() } },
        data: { status: 'EXPIRED' },
    });
};

const getOffer = (planCode, expectedKind) => {
    const offer = offers[planCode];
    if (!offer || (expectedKind && offer.kind !== expectedKind)) {
        throw billingError('Choose a valid FitSwap billing option.');
    }
    return offer;
};

const createRequest = async ({ buyerId, planCode, listingId = null }) => {
    await expireOutstandingPlatformPayments();
    const offer = getOffer(planCode);
    const recipient = getPlatformRecipient();
    const buyer = await prisma.user.findUnique({ where: { id: buyerId }, select: { id: true, role: true, isActive: true } });
    if (!buyer?.isActive) throw billingError('Your account is not eligible for billing.', 403);

    if (offer.kind === 'OWNER_SUBSCRIPTION' && buyer.role !== 'GYM_OWNER') {
        throw billingError('FitSwap Business plans are available to gym-owner accounts only.', 403);
    }

    if (offer.kind === 'LISTING_BOOST') {
        const listing = await prisma.marketplaceListing.findFirst({
            where: { id: listingId, sellerId: buyerId, status: 'ACTIVE', deletedAt: null },
            select: { id: true, boostedUntil: true },
        });
        if (!listing) throw billingError('Only your active marketplace listing can be boosted.', 404);
    }

    const reusable = await prisma.platformPaymentRequest.findFirst({
        where: {
            buyerId,
            planCode,
            listingId,
            status: { in: OPEN_STATUSES },
            expiresAt: { gt: new Date() },
        },
        include: requestInclude,
        orderBy: { createdAt: 'desc' },
    });
    if (reusable) return serializePayment(reusable);

    const payment = await prisma.platformPaymentRequest.create({
        data: {
            kind: offer.kind,
            planCode,
            buyerId,
            listingId,
            amount: offer.amount,
            paymentRef: paymentReference(),
            platformUpiId: recipient.upiId,
            platformPayeeName: recipient.payeeName,
            benefitDays: offer.benefitDays,
            expiresAt: new Date(Date.now() + REQUEST_TTL_MS),
        },
        include: requestInclude,
    });
    return serializePayment(payment);
};

const createOwnerSubscriptionRequest = (buyerId, planCode) =>
    createRequest({ buyerId, planCode });

const createListingBoostRequest = (buyerId, listingId) =>
    createRequest({ buyerId, listingId, planCode: 'LISTING_BOOST_7D' });

const markPlatformPaymentPaid = async (buyerId, requestId, utr) => {
    await expireOutstandingPlatformPayments();
    const normalizedUtr = String(utr || '').trim().toUpperCase();
    if (!UTR_PATTERN.test(normalizedUtr)) {
        throw billingError('Enter the UPI UTR/reference number shown in your payment app.');
    }

    const [matchingPlatformRequest, matchingManualRequest] = await Promise.all([
        prisma.platformPaymentRequest.findFirst({
            where: { utr: normalizedUtr, id: { not: requestId } },
            select: { id: true },
        }),
        prisma.upiPaymentRequest.findFirst({
            where: { utr: normalizedUtr },
            select: { id: true },
        }),
    ]);
    if (matchingPlatformRequest || matchingManualRequest) {
        throw billingError('This UPI UTR/reference has already been used for another FitSwap payment request.', 409);
    }

    let update;
    try {
        update = await prisma.platformPaymentRequest.updateMany({
            where: { id: requestId, buyerId, status: 'AWAITING_PAYMENT', expiresAt: { gt: new Date() } },
            data: { status: 'BUYER_MARKED_PAID', utr: normalizedUtr, buyerMarkedPaidAt: new Date() },
        });
    } catch (error) {
        if (error?.code === 'P2002') {
            throw billingError('This UPI UTR/reference has already been used for another FitSwap payment request.', 409);
        }
        throw error;
    }
    if (update.count !== 1) throw billingError('This platform payment request is no longer waiting for payment.', 409);

    const payment = await prisma.platformPaymentRequest.findUnique({ where: { id: requestId }, include: requestInclude });
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { id: true } });
    await Promise.all(admins.map((admin) => notificationService.createNotification(
        admin.id,
        'Platform fee needs confirmation',
        `Check the FitSwap business UPI/bank account for ${payment.paymentRef} (UTR: ${normalizedUtr}) before confirming.`
    )));

    return serializePayment(payment);
};

const completePlatformPayment = async (adminId, requestId) => {
    const payment = await prisma.platformPaymentRequest.findFirst({
        where: { id: requestId, status: 'BUYER_MARKED_PAID' },
        include: requestInclude,
    });
    if (!payment) throw billingError('This platform payment is not ready for confirmation.', 409);

    const completed = await prisma.$transaction(async (tx) => {
        const current = await tx.platformPaymentRequest.findFirst({
            where: { id: requestId, status: 'BUYER_MARKED_PAID' },
            include: { listing: { select: { id: true, boostedUntil: true, sellerId: true, status: true, deletedAt: true } } },
        });
        if (!current) throw billingError('This platform payment was already handled.', 409);

        const startsAt = new Date();
        if (current.kind === 'LISTING_BOOST') {
            if (!current.listing || current.listing.sellerId !== current.buyerId || current.listing.status !== 'ACTIVE' || current.listing.deletedAt) {
                throw billingError('This listing can no longer be boosted. Reject the payment and arrange a refund if needed.', 409);
            }
            const activeUntil = current.listing.boostedUntil && current.listing.boostedUntil > startsAt
                ? current.listing.boostedUntil
                : startsAt;
            const boostedUntil = new Date(activeUntil);
            boostedUntil.setDate(boostedUntil.getDate() + current.benefitDays);
            await tx.marketplaceListing.update({ where: { id: current.listingId }, data: { boostedUntil } });
            current.benefitExpiresAt = boostedUntil;
        } else {
            const benefitExpiresAt = new Date(startsAt);
            benefitExpiresAt.setDate(benefitExpiresAt.getDate() + current.benefitDays);
            current.benefitExpiresAt = benefitExpiresAt;
        }

        const update = await tx.platformPaymentRequest.update({
            where: { id: current.id },
            data: {
                status: 'COMPLETED',
                confirmedByAdminId: adminId,
                adminConfirmedAt: startsAt,
                completedAt: startsAt,
                benefitExpiresAt: current.benefitExpiresAt,
            },
            include: requestInclude,
        });

        await tx.adminAuditLog.create({
            data: {
                adminId,
                action: 'PLATFORM_PAYMENT_CONFIRMED',
                targetType: 'PLATFORM_PAYMENT',
                targetId: current.id,
                summary: `${current.planCode} platform payment confirmed`,
                metadata: { amount: current.amount, paymentRef: current.paymentRef, utr: current.utr },
            },
        });
        return update;
    });

    await notificationService.createNotification(
        payment.buyerId,
        'FitSwap payment confirmed',
        payment.kind === 'LISTING_BOOST'
            ? 'Your listing boost is active. It will receive priority placement while the boost is active.'
            : `Your FitSwap Business plan is active until ${completed.benefitExpiresAt.toLocaleDateString('en-IN')}.`
    );
    return serializePayment(completed);
};

const rejectPlatformPayment = async (adminId, requestId, reason) => {
    const payment = await prisma.platformPaymentRequest.findFirst({ where: { id: requestId, status: 'BUYER_MARKED_PAID' } });
    if (!payment) throw billingError('This platform payment cannot be rejected.', 409);
    const rejectionReason = String(reason || '').trim().slice(0, 280) || 'Payment was not found in the FitSwap business account.';
    await prisma.$transaction([
        prisma.platformPaymentRequest.update({ where: { id: requestId }, data: { status: 'REJECTED', rejectedAt: new Date(), rejectionReason, confirmedByAdminId: adminId } }),
        prisma.adminAuditLog.create({
            data: {
                adminId,
                action: 'PLATFORM_PAYMENT_REJECTED',
                targetType: 'PLATFORM_PAYMENT',
                targetId: requestId,
                summary: `${payment.planCode} platform payment rejected`,
                metadata: { paymentRef: payment.paymentRef, reason: rejectionReason },
            },
        }),
    ]);
    await notificationService.createNotification(payment.buyerId, 'FitSwap payment request rejected', rejectionReason);
    return { status: 'REJECTED' };
};

const cancelPlatformPayment = async (buyerId, requestId) => {
    const update = await prisma.platformPaymentRequest.updateMany({
        where: { id: requestId, buyerId, status: 'AWAITING_PAYMENT' },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
    if (update.count !== 1) throw billingError('Only a payment request that has not been marked paid can be cancelled.', 409);
    return { status: 'CANCELLED' };
};

const getMyBillingSummary = async (userId) => {
    await expireOutstandingPlatformPayments();
    const now = new Date();
    const payments = await prisma.platformPaymentRequest.findMany({
        where: { buyerId: userId },
        include: requestInclude,
        orderBy: { createdAt: 'desc' },
        take: 30,
    });
    const activeSubscription = payments.find((payment) => payment.kind === 'OWNER_SUBSCRIPTION' && payment.status === 'COMPLETED' && payment.benefitExpiresAt > now);
    return {
        offers: Object.entries(offers).map(([code, offer]) => ({ code, ...offer })),
        activeSubscription: activeSubscription ? serializePayment(activeSubscription) : null,
        payments: payments.map(serializePayment),
    };
};

const getPlatformPaymentsForAdmin = async () => {
    await expireOutstandingPlatformPayments();
    return prisma.platformPaymentRequest.findMany({ include: requestInclude, orderBy: { createdAt: 'desc' }, take: 250 });
};

module.exports = {
    createOwnerSubscriptionRequest,
    createListingBoostRequest,
    markPlatformPaymentPaid,
    completePlatformPayment,
    rejectPlatformPayment,
    cancelPlatformPayment,
    getMyBillingSummary,
    getPlatformPaymentsForAdmin,
    expireOutstandingPlatformPayments,
};
