const rateLimit = require("express-rate-limit");
const { createRateLimitStore } = require('../config/rate-limit-store');

const buildLimiter = ({ scope, max, message, windowMs = 15 * 60 * 1000 }) => rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store: createRateLimitStore(scope),
    // Availability wins if Redis has a brief outage. Route-level database
    // constraints and idempotency still protect duplicate financial writes.
    passOnStoreError: true,
    message: { success: false, message },
});

// Upload Images Limiter
const uploadLimiter = buildLimiter({
    scope: 'uploads',
    max: 10,
    message: "Too many upload requests. Please try again after 15 minutes.",
});

// General API Limiter
const apiLimiter = buildLimiter({
    scope: 'api',
    max: 200,
    message: "Too many requests. Please try again later.",
});

const authLimiter = buildLimiter({
    scope: 'auth',
    max: 10,
    message: 'Too many sign-in attempts. Please try again after 15 minutes.',
});

const emailActionLimiter = buildLimiter({
    scope: 'email',
    max: 5,
    message: 'Too many email requests. Please try again after 15 minutes.',
});

// AI generation consumes a third-party API quota. Keep this separate from the
// general API limiter so an accidental loop cannot create unnecessary cost.
const dietPlannerLimiter = buildLimiter({
    scope: 'diet-planner',
    max: 5,
    message: "You have generated several diet plans. Please try again in 15 minutes.",
});

const paymentLimiter = buildLimiter({
    scope: 'payments',
    max: 10,
    message: 'Too many payment actions. Wait 15 minutes before trying again.',
});

const transferLimiter = buildLimiter({
    scope: 'transfers',
    max: 20,
    message: 'Too many transfer actions. Wait 15 minutes before trying again.',
});

const bookingLimiter = buildLimiter({
    scope: 'bookings',
    max: 15,
    message: 'Too many booking actions. Wait 15 minutes before trying again.',
});

const supportMessageLimiter = buildLimiter({
    scope: 'support-messages',
    max: 30,
    message: 'Too many support messages. Wait a few minutes before trying again.',
});

const adminMutationLimiter = buildLimiter({
    scope: 'admin-mutations',
    max: 30,
    message: 'Too many administrative changes. Wait 15 minutes before trying again.',
});

module.exports = {
    uploadLimiter,
    apiLimiter,
    authLimiter,
    emailActionLimiter,
    dietPlannerLimiter,
    paymentLimiter,
    transferLimiter,
    bookingLimiter,
    supportMessageLimiter,
    adminMutationLimiter,
};
