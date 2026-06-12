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
const app = express();

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true
    })
);

app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

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
module.exports = app;