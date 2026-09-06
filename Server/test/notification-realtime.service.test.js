const test = require('node:test');
const assert = require('node:assert/strict');

const prisma = require('../src/lib/prisma');
const notificationService = require('../src/services/notification.service');

test('an opted-in marketplace alert is persisted and pushed to the matching live tab', async () => {
    const originalFindUser = prisma.user.findUnique;
    const originalCreate = prisma.notification.create;
    const events = [];
    const unsubscribe = notificationService.subscribe('member-a', {
        write: (event) => events.push(event),
    });

    try {
        prisma.user.findUnique = async () => ({ marketplaceNotifications: true });
        prisma.notification.create = async ({ data }) => ({ id: 'notice-a', isRead: false, createdAt: new Date(), ...data });
        const notification = await notificationService.createNotification('member-a', 'Price drop', 'A saved listing is cheaper.');

        assert.equal(notification.id, 'notice-a');
        assert.equal(events.length, 1);
        assert.match(events[0], /event: notification/);
        assert.match(events[0], /Price drop/);
    } finally {
        unsubscribe();
        prisma.user.findUnique = originalFindUser;
        prisma.notification.create = originalCreate;
    }
});

test('transactional transfer updates are delivered even when marketing alerts are disabled', async () => {
    const originalFindUser = prisma.user.findUnique;
    const originalCreate = prisma.notification.create;
    let createCount = 0;

    try {
        prisma.user.findUnique = async () => ({ marketplaceNotifications: false });
        prisma.notification.create = async ({ data }) => {
            createCount += 1;
            return { id: `notice-${createCount}`, isRead: false, createdAt: new Date(), ...data };
        };

        assert.equal(await notificationService.createNotification('member-a', 'New listing', 'Marketing update'), null);
        const transfer = await notificationService.createTransactionalNotification('member-a', 'Transfer approved', 'Your membership has moved.');

        assert.equal(createCount, 1);
        assert.equal(transfer.title, 'Transfer approved');
    } finally {
        prisma.user.findUnique = originalFindUser;
        prisma.notification.create = originalCreate;
    }
});
