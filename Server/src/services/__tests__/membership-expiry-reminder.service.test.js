const test = require('node:test');
const assert = require('node:assert/strict');
const {
    createInAppReminder,
    getDaysBeforeExpiry,
    getDueReminderDay,
    resolveTimeZone,
} = require('../membership-expiry-reminder.service');

test('selects exact and catch-up reminder milestones', () => {
    assert.equal(getDueReminderDay(31), null);
    assert.equal(getDueReminderDay(30), 30);
    assert.equal(getDueReminderDay(20), 30);
    assert.equal(getDueReminderDay(7), 7);
    assert.equal(getDueReminderDay(4), 7);
    assert.equal(getDueReminderDay(1), 1);
    assert.equal(getDueReminderDay(0), 0);
    assert.equal(getDueReminderDay(-3), 0);
});

test('calculates calendar days in the configured time zone', () => {
    assert.equal(
        getDaysBeforeExpiry(
            new Date('2026-10-05T06:00:00Z'),
            new Date('2026-09-05T06:00:00Z'),
            'Asia/Kolkata'
        ),
        30
    );
    assert.equal(
        getDaysBeforeExpiry(
            new Date('2026-09-06T18:20:00Z'),
            new Date('2026-09-05T18:40:00Z'),
            'Asia/Kolkata'
        ),
        0
    );
    assert.equal(resolveTimeZone('not/a-time-zone'), 'UTC');
});

test('a repeated job run creates only one in-app notification', async () => {
    let ledgerExists = false;
    let notificationCreates = 0;
    let ledgerUpdates = 0;
    const tx = {
        userMembership: {
            findFirst: async () => ({ id: 'membership-1' }),
        },
        membershipExpiryReminder: {
            create: async () => {
                if (ledgerExists) {
                    const error = new Error('duplicate reminder');
                    error.code = 'P2002';
                    throw error;
                }
                ledgerExists = true;
                return { id: 'reminder-1' };
            },
            update: async () => {
                ledgerUpdates += 1;
            },
        },
        notification: {
            create: async () => {
                notificationCreates += 1;
            },
        },
    };
    const database = {
        $transaction: async (callback) => callback(tx),
    };
    const input = {
        membership: { id: 'membership-1', userId: 'user-1' },
        daysBeforeExpiry: 7,
        content: { title: 'Expiry reminder', message: 'Membership expires soon.' },
        now: new Date('2026-09-05T12:00:00Z'),
        database,
    };

    assert.equal(await createInAppReminder(input), 'sent');
    assert.equal(await createInAppReminder(input), 'duplicate');
    assert.equal(notificationCreates, 1);
    assert.equal(ledgerUpdates, 1);
});
