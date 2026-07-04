const cron = require('node-cron');
const prisma = require('../lib/prisma');

const startStaleTransferRequestJob = () => {
    cron.schedule('* * * * *', async () => {
        try {
            console.log(
                'Running Stale Transfer Request Job...'
            );

            const cutoffDate = new Date();

            cutoffDate.setDate(
                cutoffDate.getDate() - 30
            );

            const result =
                await prisma.transferRequest.updateMany({
                    where: {
                        status: 'PENDING',
                        createdAt: {
                            lt: cutoffDate
                        }
                    },
                    data: {
                        status: 'REJECTED'
                    }
                });

            console.log(
                `${result.count} stale requests rejected`
            );
        } catch (error) {
            console.error(
                'Stale Transfer Request Job Failed:',
                error
            );
        }
    });
};

module.exports = {
    startStaleTransferRequestJob
};