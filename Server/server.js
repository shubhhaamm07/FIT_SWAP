require('dotenv').config();

const app = require('./src/app');

const PORT = process.env.PORT || 5000;

const {
    startMembershipExpiryJob
} = require(
    './src/jobs/membership-expiry.job'
);
const {
    startExpiredListingJob
} = require(
    './src/jobs/expired-listing.job'
);
const {
    startStaleTransferRequestJob
} = require(
    './src/jobs/stale-transfer-request.job'
);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startMembershipExpiryJob();
    startExpiredListingJob();
    startStaleTransferRequestJob();
});