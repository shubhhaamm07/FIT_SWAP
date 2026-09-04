const cron = require('node-cron');
const prisma = require('../lib/prisma');
const {
    processMembershipExpiryReminders
} = require('../services/membership-expiry-reminder.service');

let isRunning = false;

const runMembershipExpiryCycle = async (now = new Date()) => {
    if (isRunning) return { skipped: true };
    isRunning = true;

    try {
        console.log('Running Membership Expiry Job...');

        let reminderResult = null;
        try {
            // Send the expiry-day alert before changing the membership status.
            reminderResult = await processMembershipExpiryReminders({ now });
        } catch (error) {
            // Reminder delivery must never prevent the original expiry update.
            console.error('Membership Expiry Reminder Job Failed:', error);
        }

        const result = await prisma.userMembership.updateMany({
            where: {
                status: { in: ['ACTIVE', 'FROZEN'] },
                endDate: { lt: now }
            },
            data: { status: 'EXPIRED' }
        });

        console.log(`${result.count} memberships expired`);
        if (reminderResult && (reminderResult.sent || reminderResult.failed)) {
            console.log('Membership expiry reminders processed', reminderResult);
        }

        return { skipped: false, expired: result.count, reminders: reminderResult };
    } finally {
        isRunning = false;
    }
};

const startMembershipExpiryJob = () => {
    cron.schedule('* * * * *', async () => {
        try {
            await runMembershipExpiryCycle(new Date());
        } catch (error) {
            console.error('Membership Expiry Job Failed:', error);
        }
    });
};

module.exports = {
    startMembershipExpiryJob,
    runMembershipExpiryCycle
};
