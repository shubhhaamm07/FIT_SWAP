const prisma = require('../lib/prisma');

const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_DAYS = [30, 7, 1, 0];
const DEFAULT_TIME_ZONE = 'Asia/Kolkata';

const resolveTimeZone = (value = process.env.APP_TIME_ZONE || DEFAULT_TIME_ZONE) => {
    const timeZone = String(value || '').trim() || DEFAULT_TIME_ZONE;

    try {
        new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
        return timeZone;
    } catch (_error) {
        return 'UTC';
    }
};

// Comparing calendar-day numbers avoids daylight-saving and server-time-zone
// errors. The reminder day is based on APP_TIME_ZONE, not Render's clock.
const getCalendarDayNumber = (date, timeZone) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date(date));
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

    return Math.floor(Date.UTC(
        Number(values.year),
        Number(values.month) - 1,
        Number(values.day)
    ) / DAY_MS);
};

const getDaysBeforeExpiry = (endDate, now = new Date(), timeZone = resolveTimeZone()) =>
    getCalendarDayNumber(endDate, timeZone) - getCalendarDayNumber(now, timeZone);

// If a sleeping deployment misses the exact day, send only the most relevant
// reminder on its next run instead of sending every missed reminder at once.
const getDueReminderDay = (actualDaysBeforeExpiry) => {
    if (actualDaysBeforeExpiry > REMINDER_DAYS[0]) return null;
    if (actualDaysBeforeExpiry > REMINDER_DAYS[1]) return 30;
    if (actualDaysBeforeExpiry > REMINDER_DAYS[2]) return 7;
    if (actualDaysBeforeExpiry > REMINDER_DAYS[3]) return 1;
    return 0;
};

const buildReminderContent = (membership, actualDaysBeforeExpiry, timeZone) => {
    const expiryDate = new Intl.DateTimeFormat('en-IN', {
        timeZone,
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(membership.endDate);
    let title;
    let timing;
    if (actualDaysBeforeExpiry < 0) {
        title = 'Membership expired';
        timing = 'has expired';
    } else if (actualDaysBeforeExpiry === 0) {
        title = 'Membership expires today';
        timing = 'expires today';
    } else {
        const unit = actualDaysBeforeExpiry === 1 ? 'day' : 'days';
        title = `Membership expires in ${actualDaysBeforeExpiry} ${unit}`;
        timing = `expires in ${actualDaysBeforeExpiry} ${unit}`;
    }

    return {
        title,
        message: `Your ${membership.plan.name} membership at ${membership.plan.gym.name} ${timing}, on ${expiryDate}. Contact the gym if you want to renew it.`,
    };
};

const createInAppReminder = async ({
    membership,
    daysBeforeExpiry,
    content,
    now,
    database = prisma,
}) => {
    try {
        return await database.$transaction(async (tx) => {
            // Another server instance may have expired or transferred the
            // membership after the outer query. Recheck before notifying.
            const currentMembership = await tx.userMembership.findFirst({
                where: {
                    id: membership.id,
                    userId: membership.userId,
                    status: { in: ['ACTIVE', 'FROZEN'] },
                },
                select: { id: true },
            });

            if (!currentMembership) return 'skipped';

            const ledger = await tx.membershipExpiryReminder.create({
                data: {
                    membershipId: membership.id,
                    userId: membership.userId,
                    daysBeforeExpiry,
                    channel: 'IN_APP',
                    status: 'PENDING',
                    attemptCount: 1,
                    lastAttemptAt: now,
                },
            });

            await tx.notification.create({
                data: {
                    userId: membership.userId,
                    title: content.title,
                    message: content.message,
                },
            });

            await tx.membershipExpiryReminder.update({
                where: { id: ledger.id },
                data: { status: 'SENT', sentAt: now },
            });

            return 'sent';
        });
    } catch (error) {
        // The compound unique key is the cross-process idempotency guard.
        if (error?.code === 'P2002') return 'duplicate';
        throw error;
    }
};

const processMembershipExpiryReminders = async ({
    now = new Date(),
    timeZone = resolveTimeZone(),
} = {}) => {
    const normalizedNow = new Date(now);
    if (Number.isNaN(normalizedNow.getTime())) {
        throw new Error('A valid reminder processing date is required');
    }

    const normalizedTimeZone = resolveTimeZone(timeZone);
    const memberships = await prisma.userMembership.findMany({
        where: {
            status: { in: ['ACTIVE', 'FROZEN'] },
            endDate: { lte: new Date(normalizedNow.getTime() + (31 * DAY_MS)) },
            user: { isActive: true },
        },
        select: {
            id: true,
            userId: true,
            endDate: true,
            user: {
                select: { membershipExpiryNotifications: true },
            },
            plan: {
                select: {
                    name: true,
                    gym: { select: { name: true } },
                },
            },
        },
        orderBy: { endDate: 'asc' },
    });

    const totals = {
        due: 0,
        sent: 0,
        duplicate: 0,
        skipped: 0,
        failed: 0,
    };

    for (const membership of memberships) {
        const actualDaysBeforeExpiry = getDaysBeforeExpiry(
            membership.endDate,
            normalizedNow,
            normalizedTimeZone
        );
        const daysBeforeExpiry = getDueReminderDay(actualDaysBeforeExpiry);
        if (daysBeforeExpiry === null) continue;

        totals.due += 1;
        if (!membership.user.membershipExpiryNotifications) {
            totals.skipped += 1;
            continue;
        }

        try {
            const result = await createInAppReminder({
                membership,
                daysBeforeExpiry,
                content: buildReminderContent(membership, actualDaysBeforeExpiry, normalizedTimeZone),
                now: normalizedNow,
            });
            totals[result] += 1;
        } catch (error) {
            totals.failed += 1;
            console.error('Membership expiry reminder failed', {
                membershipId: membership.id,
                code: String(error?.code || error?.name || 'REMINDER_FAILED').slice(0, 80),
            });
        }
    }

    return totals;
};

module.exports = {
    processMembershipExpiryReminders,
    createInAppReminder,
    getCalendarDayNumber,
    getDaysBeforeExpiry,
    getDueReminderDay,
    resolveTimeZone,
};
