const crypto = require('crypto');
const Razorpay = require('razorpay');

const prisma = require('../lib/prisma');
const notificationService = require('./notification.service');

const MINIMUM_AMOUNT_IN_PAISE = 100;
const OPEN_ORDER_WINDOW_MS = 20 * 60 * 1000;

const paymentError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const getRazorpayClient = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw paymentError('Online payments are not configured on this server.', 500);
    }

    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

const getPurchasableListing = async (listingId, buyerId) => {
    if (!listingId || typeof listingId !== 'string') {
        throw paymentError('A valid listing is required.');
    }

    const listing = await prisma.marketplaceListing.findUnique({
        where: { id: listingId },
        include: {
            membership: {
                include: {
                    plan: true,
                },
            },
        },
    });

    if (!listing || listing.deletedAt) {
        throw paymentError('Listing not found.', 404);
    }

    if (listing.status !== 'ACTIVE') {
        throw paymentError('This listing is no longer available for payment.');
    }

    if (listing.sellerId === buyerId) {
        throw paymentError('You cannot purchase your own listing.');
    }

    if (listing.membership.status !== 'ACTIVE' || !listing.membership.plan.transferable) {
        throw paymentError('This membership is no longer transferable.');
    }

    return listing;
};

const getAmountInPaise = (listing) => {
    const askingPrice = Number(listing.askingPrice);
    const transferFee = Number(listing.membership.plan.transferFee || 0);
    const amount = Math.round((askingPrice + transferFee) * 100);

    if (!Number.isSafeInteger(amount) || amount < MINIMUM_AMOUNT_IN_PAISE) {
        throw paymentError('The payment amount must be at least ₹1.00.');
    }

    return amount;
};

const getPurchasablePlan = async (planId, buyerId) => {
    if (!planId || typeof planId !== 'string') {
        throw paymentError('A valid membership plan is required.');
    }

    const plan = await prisma.membershipPlan.findUnique({
        where: { id: planId },
        include: { gym: true },
    });

    if (!plan) {
        throw paymentError('Membership plan not found.', 404);
    }

    if (plan.gym.status !== 'APPROVED') {
        throw paymentError('This gym is not currently available for direct membership purchases.');
    }

    const existingMembership = await prisma.userMembership.findFirst({
        where: { userId: buyerId, planId: plan.id, status: 'ACTIVE' },
        select: { id: true },
    });

    if (existingMembership) {
        throw paymentError('You already have an active membership for this plan.', 409);
    }

    return plan;
};

const getPlanAmountInPaise = (plan) => {
    const amount = Math.round(Number(plan.price) * 100);

    if (!Number.isSafeInteger(amount) || amount < MINIMUM_AMOUNT_IN_PAISE) {
        throw paymentError('The membership price must be at least ₹1.00.');
    }

    return amount;
};

const createOrder = async (buyerId, listingId) => {
    const listing = await getPurchasableListing(listingId, buyerId);
    const amount = getAmountInPaise(listing);
    const receipt = `fs_${listing.id.slice(-10)}_${Date.now().toString(36)}`.slice(0, 40);

    let order;

    try {
        order = await getRazorpayClient().orders.create({
            amount,
            currency: 'INR',
            receipt,
            notes: {
                listingId: listing.id,
                buyerId,
            },
        });
    } catch (error) {
        if (error.statusCode === 401) {
            throw paymentError('Razorpay authentication failed. Check the server payment credentials.', 401);
        }

        throw paymentError('Unable to create a Razorpay order. Please try again.', 500);
    }

    await prisma.payment.create({
        data: {
            listingId: listing.id,
            buyerId,
            razorpayOrderId: order.id,
            amount,
            currency: order.currency,
            type: 'MARKETPLACE_TRANSFER',
        },
    });

    return {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
    };
};

const createGymMembershipOrder = async (buyerId, planId) => {
    const plan = await getPurchasablePlan(planId, buyerId);
    const reusableOrder = await prisma.payment.findFirst({
        where: {
            buyerId,
            planId: plan.id,
            type: 'GYM_MEMBERSHIP',
            status: 'CREATED',
            createdAt: { gte: new Date(Date.now() - OPEN_ORDER_WINDOW_MS) },
        },
        orderBy: { createdAt: 'desc' },
        select: { razorpayOrderId: true, amount: true, currency: true },
    });

    if (reusableOrder) {
        return {
            order_id: reusableOrder.razorpayOrderId,
            amount: reusableOrder.amount,
            currency: reusableOrder.currency,
        };
    }

    const amount = getPlanAmountInPaise(plan);
    const receipt = `gym_${plan.id.slice(-10)}_${Date.now().toString(36)}`.slice(0, 40);
    let order;

    try {
        order = await getRazorpayClient().orders.create({
            amount,
            currency: 'INR',
            receipt,
            notes: {
                paymentType: 'gym_membership',
                planId: plan.id,
                buyerId,
            },
        });
    } catch (error) {
        if (error.statusCode === 401) {
            throw paymentError('Razorpay authentication failed. Check the server payment credentials.', 401);
        }

        throw paymentError('Unable to create a Razorpay order. Please try again.', 500);
    }

    await prisma.payment.create({
        data: {
            planId: plan.id,
            buyerId,
            razorpayOrderId: order.id,
            amount,
            currency: order.currency,
            type: 'GYM_MEMBERSHIP',
        },
    });

    return {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
    };
};

const signaturesMatch = (orderId, paymentId, razorpaySignature) => {
    if (!orderId || !paymentId || !razorpaySignature) return false;

    const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

    const generatedBuffer = Buffer.from(generatedSignature, 'utf8');
    const receivedBuffer = Buffer.from(razorpaySignature, 'utf8');

    return generatedBuffer.length === receivedBuffer.length
        && crypto.timingSafeEqual(generatedBuffer, receivedBuffer);
};

const verifyPayment = async (buyerId, payload) => {
    const {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
    } = payload || {};

    if (!orderId || !paymentId || !signature) {
        throw paymentError('Payment verification details are incomplete.');
    }

    if (!process.env.RAZORPAY_KEY_SECRET || !signaturesMatch(orderId, paymentId, signature)) {
        throw paymentError('Payment signature verification failed.');
    }

    const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId: orderId },
        include: {
            listing: {
                include: {
                    membership: {
                        include: { plan: true },
                    },
                },
            },
        },
    });

    if (!payment || payment.buyerId !== buyerId || payment.type !== 'MARKETPLACE_TRANSFER' || !payment.listingId) {
        throw paymentError('Payment order not found.', 404);
    }

    if (payment.status === 'PAID') {
        if (payment.razorpayPaymentId !== paymentId) {
            throw paymentError('This Razorpay order has already been verified with another payment.', 400);
        }

        return { alreadyVerified: true, listingId: payment.listingId };
    }

    const completedPayment = await prisma.$transaction(async (tx) => {
        const listing = await tx.marketplaceListing.findFirst({
            where: {
                id: payment.listingId,
                status: 'ACTIVE',
                deletedAt: null,
            },
            include: {
                membership: {
                    include: { plan: true },
                },
            },
        });

        if (!listing || listing.sellerId === buyerId) {
            throw paymentError('This listing is no longer available for transfer. Contact support for payment help.', 409);
        }

        if (listing.membership.status !== 'ACTIVE' || !listing.membership.plan.transferable) {
            throw paymentError('This membership is no longer transferable. Contact support for payment help.', 409);
        }

        const membershipUpdate = await tx.userMembership.updateMany({
            where: {
                id: listing.membershipId,
                userId: listing.sellerId,
                status: 'ACTIVE',
            },
            data: { userId: buyerId },
        });

        if (membershipUpdate.count !== 1) {
            throw paymentError('This membership was just sold. Contact support for payment help.', 409);
        }

        const listingUpdate = await tx.marketplaceListing.updateMany({
            where: {
                id: listing.id,
                sellerId: listing.sellerId,
                status: 'ACTIVE',
                deletedAt: null,
            },
            data: { status: 'SOLD' },
        });

        if (listingUpdate.count !== 1) {
            throw paymentError('This listing was just sold. Contact support for payment help.', 409);
        }

        const paymentUpdate = await tx.payment.updateMany({
            where: {
                id: payment.id,
                status: 'CREATED',
                razorpayPaymentId: null,
            },
            data: {
                razorpayPaymentId: paymentId,
                razorpaySignature: signature,
                status: 'PAID',
                verifiedAt: new Date(),
            },
        });

        if (paymentUpdate.count !== 1) {
            throw paymentError('Payment has already been processed.', 409);
        }

        await tx.transferRequest.upsert({
            where: {
                listingId_buyerId: {
                    listingId: listing.id,
                    buyerId,
                },
            },
            update: { status: 'APPROVED' },
            create: {
                listingId: listing.id,
                buyerId,
                status: 'APPROVED',
            },
        });

        await tx.transferRequest.updateMany({
            where: {
                listingId: listing.id,
                status: 'PENDING',
                buyerId: { not: buyerId },
            },
            data: { status: 'REJECTED' },
        });

        return {
            sellerId: listing.sellerId,
            listingId: listing.id,
        };
    });

    await Promise.all([
        notificationService.createNotification(
            buyerId,
            'Payment verified — membership transferred',
            'Your Razorpay payment was verified and the membership is now in your account.'
        ),
        notificationService.createNotification(
            completedPayment.sellerId,
            'Membership sold through Razorpay',
            'A buyer completed an online payment and the membership was transferred automatically.'
        ),
    ]);

    return { alreadyVerified: false, listingId: completedPayment.listingId };
};

const verifyGymMembershipPayment = async (buyerId, payload) => {
    const {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
    } = payload || {};

    if (!orderId || !paymentId || !signature) {
        throw paymentError('Payment verification details are incomplete.');
    }

    if (!process.env.RAZORPAY_KEY_SECRET || !signaturesMatch(orderId, paymentId, signature)) {
        throw paymentError('Payment signature verification failed.');
    }

    const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId: orderId },
        include: {
            plan: {
                include: { gym: true },
            },
        },
    });

    if (!payment || payment.buyerId !== buyerId || payment.type !== 'GYM_MEMBERSHIP' || !payment.planId || !payment.plan) {
        throw paymentError('Payment order not found.', 404);
    }

    if (payment.status === 'PAID') {
        if (payment.razorpayPaymentId !== paymentId) {
            throw paymentError('This Razorpay order has already been verified with another payment.', 400);
        }

        return { alreadyVerified: true, planId: payment.planId };
    }

    const membership = await prisma.$transaction(async (tx) => {
        const existingMembership = await tx.userMembership.findFirst({
            where: { userId: buyerId, planId: payment.planId, status: 'ACTIVE' },
            select: { id: true },
        });

        if (existingMembership) {
            throw paymentError('You already have an active membership for this plan. Contact support if you completed another payment.', 409);
        }

        const freshPlan = await tx.membershipPlan.findFirst({
            where: {
                id: payment.planId,
                gym: { status: 'APPROVED' },
            },
            include: { gym: true },
        });

        if (!freshPlan) {
            throw paymentError('This gym plan is no longer available. Contact support for payment help.', 409);
        }

        const paymentUpdate = await tx.payment.updateMany({
            where: {
                id: payment.id,
                status: 'CREATED',
                razorpayPaymentId: null,
            },
            data: {
                razorpayPaymentId: paymentId,
                razorpaySignature: signature,
                status: 'PAID',
                verifiedAt: new Date(),
            },
        });

        if (paymentUpdate.count !== 1) {
            throw paymentError('Payment has already been processed.', 409);
        }

        try {
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + freshPlan.durationInDays);

            return await tx.userMembership.create({
                data: {
                    userId: buyerId,
                    planId: freshPlan.id,
                    startDate,
                    endDate,
                    purchasePrice: freshPlan.price,
                    status: 'ACTIVE',
                },
            });
        } catch (error) {
            if (error.code === 'P2002') {
                throw paymentError('You already have an active membership for this plan. Contact support if you completed another payment.', 409);
            }
            throw error;
        }
    });

    await Promise.all([
        notificationService.createNotification(
            buyerId,
            'Payment verified — membership activated',
            `Your Razorpay payment for ${payment.plan.gym.name} was verified and your ${payment.plan.name} is active.`
        ),
        notificationService.createNotification(
            payment.plan.gym.ownerId,
            'New direct membership sale',
            `A member purchased the ${payment.plan.name} plan through FitSwap.`
        ),
    ]);

    return { alreadyVerified: false, membershipId: membership.id, planId: payment.planId };
};

module.exports = {
    createOrder,
    verifyPayment,
    createGymMembershipOrder,
    verifyGymMembershipPayment,
};
