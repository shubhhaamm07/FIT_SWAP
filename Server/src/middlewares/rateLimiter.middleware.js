const rateLimit = require("express-rate-limit");

// Upload Images Limiter
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes

    max: 20,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
        success: false,
        message:
            "Too many upload requests. Please try again after 15 minutes.",
    },
});

// General API Limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,

    max: 200,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
        success: false,
        message:
            "Too many requests. Please try again later.",
    },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many sign-in attempts. Please try again after 15 minutes.',
    },
});

const emailActionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many email requests. Please try again after 15 minutes.',
    },
});

// AI generation consumes a third-party API quota. Keep this separate from the
// general API limiter so an accidental loop cannot create unnecessary cost.
const dietPlannerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "You have generated several diet plans. Please try again in 15 minutes.",
    },
});

module.exports = {
    uploadLimiter,
    apiLimiter,
    authLimiter,
    emailActionLimiter,
    dietPlannerLimiter,
};
