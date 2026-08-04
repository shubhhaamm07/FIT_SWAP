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
const {
    apiLimiter,
} = require("./middlewares/rateLimiter.middleware");
const app = express();


app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
    return res.status(200).json({
        success: true,
        message: 'FitSwap API Running'
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/gyms', gymRoutes);
app.use('/api', membershipPlanRoutes);
app.use('/api', userMembershipRoutes);
app.use('/api', marketplaceListingRoutes);
app.use('/api', transferRequestRoutes);
app.use('/api', notificationRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", chartRoutes);
app.use("/api", imageRoutes);
app.use('/api', savedListingRoutes);
module.exports = app;
