const isSafeMethod = (method) => ["GET", "HEAD", "OPTIONS"].includes(method);

const csrfProtection = (allowedOrigins) => (req, res, next) => {
    // Bearer-token clients are not vulnerable to cookie-based CSRF. Check the
    // Origin only when a browser session cookie will authenticate the request.
    if (isSafeMethod(req.method) || !req.cookies?.fitswap_session) {
        return next();
    }

    const origin = String(req.headers.origin || "").replace(/\/$/, "");
    if (origin && allowedOrigins.has(origin)) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: "This request must come from an approved FitSwap website origin.",
    });
};

module.exports = { csrfProtection };
