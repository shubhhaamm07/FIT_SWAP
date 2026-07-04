const cron = require('node-cron');
const prisma = require('../lib/prisma');

const startExpiredListingJob = () => {
    cron.schedule('* * * * *', async () => {
        try {
            console.log(
                'Running Expired Listing Job...'
            );

            const result =
                await prisma.marketplaceListing.updateMany({
                    where: {
                        status: 'ACTIVE',
                        membership: {
                            status: 'EXPIRED'
                        }
                    },
                    data: {
                        status: 'CANCELLED'
                    }
                });

            console.log(
                `${result.count} listings cancelled`
            );
        } catch (error) {
            console.error(
                'Expired Listing Job Failed:',
                error
            );
        }
    });
};

module.exports = {
    startExpiredListingJob
};