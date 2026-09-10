const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const helmet = require('helmet');
const morgan = require('morgan');
const prisma = require('./lib/prisma');
const adminRoutes = require('./routes/admin.routes');

const authRoutes = require('./routes/auth.routes');
const gymRoutes = require('./routes/gym.routes');
const membershipPlanRoutes = require(

    './routes/membership-plan.routes'

);
const userMembershipRoutes = require(
    './routes/user-membership.routes'
);
const marketplaceListingRoutes = require(
    './routes/marketplace-listing.routes'
);
const transferRequestRoutes = require(
    './routes/transfer-request.routes'
);
const notificationRoutes = require(
    './routes/notification.routes'
);
const dashboardRoutes = require(
    "./routes/dashboard.routes"
);
const chartRoutes = require(
    "./routes/chart.routes"
);
const imageRoutes = require("./routes/image.routes");
const savedListingRoutes = require('./routes/saved-listing.routes');
const gymOwnerDashboardRoutes = require('./routes/gym-owner-dashboard.routes');
const upiPaymentRoutes = require('./routes/upi-payment.routes');
const platformBillingRoutes = require('./routes/platform-billing.routes');
const dietPlannerRoutes = require('./routes/diet-planner.routes');
const trialBookingRoutes = require('./routes/trial-booking.routes');
const supportTicketRoutes = require('./routes/support-ticket.routes');
const wellnessRoutes = require('./routes/wellness.routes');
const securityRoutes = require('./routes/security.routes');
const crowdReportRoutes = require('./routes/crowd-report.routes');
const {
    apiLimiter,
} = require("./middlewares/rateLimiter.middleware");
const { csrfProtection } = require('./middlewares/csrf.middleware');
const app = express();

if (process.env.NODE_ENV === 'production') {
    // Render and similar hosts terminate HTTPS at a reverse proxy. Trust only
    // the first proxy so rate limiting sees the real client address.
    app.set('trust proxy', 1);
}

const configuredOrigins = String(
    process.env.CLIENT_URLS ||
    process.env.CLIENT_URL ||
    'http://localhost:5173'
)
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

const allowedOrigins = new Set(configuredOrigins);

app.disable('x-powered-by');
app.use((req, res, next) => {
    const suppliedRequestId = String(req.get('x-request-id') || '').trim();
    req.requestId = /^[A-Za-z0-9._:-]{8,100}$/.test(suppliedRequestId)
        ? suppliedRequestId
        : crypto.randomUUID();
    res.setHeader('X-Request-Id', req.requestId);
    next();
});
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: process.env.NODE_ENV === 'production'
        ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
        : false,
}));

app.use(
    cors({
        origin(origin, callback) {
            // Requests from tools, mobile clients, and server-to-server calls
            // may not include an Origin header.
            if (!origin || allowedOrigins.has(origin.replace(/\/$/, ''))) {
                return callback(null, true);
            }

            const error = new Error('This website origin is not allowed by the FitSwap API.');
            error.status = 403;
            return callback(error);
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key", "X-Request-Id"],
    })
);

app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '64kb' }));
app.use(cookieParser());
app.use(csrfProtection(allowedOrigins));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    skip: (req) => process.env.NODE_ENV === 'production' && req.path === '/api/health',
}));
app.use('/api', apiLimiter);

// Controllers cannot accidentally expose database, S3, or provider details in
// a 5xx response. The request id lets support find the corresponding server log.
app.use((req, res, next) => {
    const sendJson = res.json.bind(res);
    res.json = (body) => {
        const message = String(body?.message || body?.error || '');
        const containsInternalDetails = /Prisma|Invalid `.*\.(?:create|update|find|delete)|node_modules|ECONN|ENOTFOUND|AWS_|S3Client|database column|database table/i.test(message);
        if (res.statusCode >= 500 || containsInternalDetails) {
            return sendJson({
                success: false,
                message: res.statusCode >= 500
                    ? 'An unexpected server error occurred.'
                    : 'The request could not be processed.',
                requestId: req.requestId,
            });
        }
        return sendJson(body);
    };
    next();
});

app.get('/api/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return res.status(200).json({
            success: true,
            status: 'ready',
        });
    } catch (error) {
        console.error('Health check failed', { requestId: req.requestId, name: error.name });
        return res.status(503).json({ success: false });
    }
});

app.get('/', (req, res) => {
    return res.status(200).json({
        success: true,
        name: 'FitSwap API',
        health: '/api/health'
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/gyms', gymRoutes);
app.use('/api', require('./routes/gym-verification.routes'));
app.use('/api', membershipPlanRoutes);
app.use('/api', userMembershipRoutes);
app.use('/api', marketplaceListingRoutes);
app.use('/api', transferRequestRoutes);
app.use('/api', notificationRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", chartRoutes);
app.use("/api", imageRoutes);
app.use('/api', savedListingRoutes);
app.use('/api', gymOwnerDashboardRoutes);
app.use('/api', upiPaymentRoutes);
app.use('/api', platformBillingRoutes);
app.use('/api', dietPlannerRoutes);
app.use('/api', trialBookingRoutes);
app.use('/api', supportTicketRoutes);
app.use('/api', wellnessRoutes);
app.use('/api', securityRoutes);
app.use('/api', crowdReportRoutes);

app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: 'API endpoint not found.'
    });
});

app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);

    const status = Number(error.status) || 500;
    if (status >= 500) console.error(error, { requestId: req.requestId });

    return res.status(status).json({
        success: false,
        message: status >= 500 ? 'An unexpected server error occurred.' : error.message,
        ...(status >= 500 ? { requestId: req.requestId } : {}),
    });
});
module.exports = app;
