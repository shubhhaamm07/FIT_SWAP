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

module.exports = {
    uploadLimiter,
    apiLimiter,
};