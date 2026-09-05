const cron = require('node-cron');
const prisma = require('../lib/prisma');
const {
    processMembershipExpiryReminders,
    getCalendarDayNumber,
    resolveTimeZone
} = require('../services/membership-expiry-reminder.service');

let isRunning = false;
let lastReminderDayKey = null;

const getReminderDayKey = (now) => {
    const timeZone = resolveTimeZone();
    return `${timeZone}:${getCalendarDayNumber(now, timeZone)}`;
};

const runMembershipExpiryCycle = async (now = new Date()) => {
    if (isRunning) return { skipped: true };
    isRunning = true;

    try {
        console.log('Running Membership Expiry Job...');

        let reminderResult = null;
        const reminderDayKey = getReminderDayKey(now);
        if (lastReminderDayKey !== reminderDayKey) {
            try {
                // Send the expiry-day alert before changing the membership status.
                // The expiration check runs every minute, but this candidate scan
                // is needed only once per local calendar day.
                reminderResult = await processMembershipExpiryReminders({ now });
                lastReminderDayKey = reminderDayKey;
            } catch (error) {
                // Reminder delivery must never prevent the original expiry update.
                // Do not advance the key on failure so the next minute can retry.
                console.error('Membership Expiry Reminder Job Failed:', error);
            }
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
    runMembershipExpiryCycle,
    getReminderDayKey
};
