const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
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
const paymentRoutes = require('./routes/payment.routes');
const upiPaymentRoutes = require('./routes/upi-payment.routes');
const platformBillingRoutes = require('./routes/platform-billing.routes');
const dietPlannerRoutes = require('./routes/diet-planner.routes');
const trialBookingRoutes = require('./routes/trial-booking.routes');
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
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json());
app.use(cookieParser());
app.use(csrfProtection(allowedOrigins));
app.use(morgan('dev'));
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
    return res.status(200).json({
        success: true,
        message: 'FitSwap API Running'
    });
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
app.use('/api', paymentRoutes);
app.use('/api', upiPaymentRoutes);
app.use('/api', platformBillingRoutes);
app.use('/api', dietPlannerRoutes);
app.use('/api', trialBookingRoutes);

app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: 'API endpoint not found.'
    });
});

app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);

    const status = Number(error.status) || 500;
    if (status >= 500) console.error(error);

    return res.status(status).json({
        success: false,
        message: status >= 500 ? 'An unexpected server error occurred.' : error.message
    });
});
module.exports = app;
