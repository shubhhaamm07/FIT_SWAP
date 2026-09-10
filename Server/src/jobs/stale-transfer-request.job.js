const cron = require('node-cron');
const prisma = require('../lib/prisma');

const startStaleTransferRequestJob = () => {
    cron.schedule('* * * * *', async () => {
        try {
            console.log(
                'Running Stale Transfer Request Job...'
            );

            const now = new Date();
            const staleRequests = await prisma.transferRequest.findMany({
                where: {
                    status: { in: ['PENDING', 'AWAITING_GYM_APPROVAL'] },
                    expiresAt: { lte: now },
                },
                select: { id: true, listingId: true, status: true },
            });

            const result = await prisma.$transaction(async (tx) => {
                if (!staleRequests.length) return { count: 0 };
                await tx.transferRequest.updateMany({
                    where: { id: { in: staleRequests.map(({ id }) => id) } },
                    data: {
                        status: 'REJECTED',
                        closedAt: now,
                        closeReason: 'The cash handover approval window expired.',
                    },
                });
                const reservedListingIds = staleRequests
                    .filter(({ status }) => status === 'AWAITING_GYM_APPROVAL')
                    .map(({ listingId }) => listingId);
                if (reservedListingIds.length) {
                    await tx.marketplaceListing.updateMany({
                        where: { id: { in: reservedListingIds }, status: 'RESERVED', isLocked: true, lockType: 'CASH_HANDOVER' },
                        data: { status: 'ACTIVE', isLocked: false, lockType: null, lockedAt: null },
                    });
                }
                return { count: staleRequests.length };
            });

            console.log(
                `${result.count} stale cash handover request(s) closed`
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
