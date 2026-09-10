const cron = require('node-cron');
const { expireOutstandingRequests } = require('../services/upi-payment.service');
const prisma = require('../lib/prisma');

const startExpiredUpiPaymentRequestJob = () => {
    cron.schedule('* * * * *', async () => {
        try {
            const [membershipPaymentCount, platformPayments] = await Promise.all([
                expireOutstandingRequests(),
                prisma.platformPaymentRequest.updateMany({
                    where: {
                        status: { in: ['AWAITING_PAYMENT', 'BUYER_MARKED_PAID'] },
                        expiresAt: { lte: new Date() },
                    },
                    data: { status: 'EXPIRED' },
                }),
            ]);

            const expiredCount = membershipPaymentCount + platformPayments.count;
            if (expiredCount) {
                console.log(`${expiredCount} expired UPI payment request(s) closed`);
            }
        } catch (error) {
            console.error('Expired UPI Payment Request Job Failed:', error);
        }
    });
};

module.exports = {
    startExpiredUpiPaymentRequestJob,
};
