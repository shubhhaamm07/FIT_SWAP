const cron = require('node-cron');
const prisma = require('../lib/prisma');

const startExpiredUpiPaymentRequestJob = () => {
    cron.schedule('* * * * *', async () => {
        try {
            const [membershipPayments, platformPayments] = await Promise.all([
                prisma.upiPaymentRequest.updateMany({
                where: {
                    status: { in: ['AWAITING_PAYMENT', 'BUYER_MARKED_PAID', 'AWAITING_GYM_APPROVAL'] },
                    expiresAt: { lte: new Date() },
                },
                data: { status: 'EXPIRED' },
                }),
                prisma.platformPaymentRequest.updateMany({
                    where: {
                        status: { in: ['AWAITING_PAYMENT', 'BUYER_MARKED_PAID'] },
                        expiresAt: { lte: new Date() },
                    },
                    data: { status: 'EXPIRED' },
                }),
            ]);

            const expiredCount = membershipPayments.count + platformPayments.count;
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
