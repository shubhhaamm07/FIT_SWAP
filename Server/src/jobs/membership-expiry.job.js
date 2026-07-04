const cron = require('node-cron');
const prisma = require('../lib/prisma');

const startMembershipExpiryJob = () => {
    cron.schedule('* * * * *', async () => {
        try {
            console.log(
                'Running Membership Expiry Job...'
            );

            const result =
                await prisma.userMembership.updateMany({
                    where: {
                        status: 'ACTIVE',
                        endDate: {
                            lt: new Date()
                        }
                    },
                    data: {
                        status: 'EXPIRED'
                    }
                });

            console.log(
                `${result.count} memberships expired`
            );
        } catch (error) {
            console.error(
                'Membership Expiry Job Failed:',
                error
            );
        }
    });
};

module.exports = {
    startMembershipExpiryJob
};