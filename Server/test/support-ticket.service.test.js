const test = require('node:test');
const assert = require('node:assert/strict');
const {
    addMessage,
    resolveRelatedEntity,
    updateTicket,
} = require('../src/services/support-ticket.service');

test('a member cannot link a support ticket to another member’s membership', async () => {
    let where;
    const database = {
        userMembership: {
            findFirst: async (query) => {
                where = query.where;
                return null;
            }
        }
    };

    await assert.rejects(
        resolveRelatedEntity({
            relatedType: 'MEMBERSHIP',
            relatedEntityId: 'other-membership',
            actor: { id: 'member-a', role: 'USER' },
            database
        }),
        { statusCode: 404 }
    );
    assert.equal(where.id, 'other-membership');
    assert.equal(where.OR[0].userId, 'member-a');
});

test('a member reply moves a waiting ticket back to in progress and notifies support', async () => {
    const updates = [];
    const audit = [];
    const notifications = [];
    let ticketReads = 0;
    const database = {
        supportTicket: {
            findFirst: async () => {
                ticketReads += 1;
                return ticketReads === 1
                    ? { id: 'ticket-a', creatorId: 'member-a', assignedToId: 'admin-a', status: 'WAITING_FOR_USER' }
                    : { id: 'ticket-a', status: 'IN_PROGRESS', messages: [] };
            },
            update: async (query) => updates.push(query.data),
        },
        $transaction: async (action) => action({
            supportMessage: { create: async (query) => query.data },
            supportTicket: { update: async (query) => updates.push(query.data) },
            supportTicketAuditLog: { create: async (query) => audit.push(query.data) },
            user: { findMany: async () => [{ id: 'admin-a' }, { id: 'admin-b' }] },
            notification: { createMany: async (query) => notifications.push(...query.data) },
        }),
    };

    const result = await addMessage({
        ticketId: 'ticket-a',
        actor: { id: 'member-a', role: 'USER' },
        body: 'I have added the requested details.',
        database,
        storage: { send: async () => { throw new Error('Storage should not be used without files.'); } },
    });

    assert.equal(result.status, 'IN_PROGRESS');
    assert.equal(updates[0].status, 'IN_PROGRESS');
    assert.equal(audit[0].fromStatus, 'WAITING_FOR_USER');
    assert.equal(audit[0].toStatus, 'IN_PROGRESS');
    assert.deepEqual(notifications.map((item) => item.userId), ['admin-a', 'admin-b']);
});

test('an admin status update creates an audit entry and tells the ticket owner', async () => {
    const updates = [];
    const audit = [];
    const notifications = [];
    let ticketReads = 0;
    const database = {
        supportTicket: {
            findFirst: async () => {
                ticketReads += 1;
                return ticketReads === 1
                    ? { id: 'ticket-a', creatorId: 'member-a', status: 'IN_PROGRESS', priority: 'NORMAL', assignedToId: null }
                    : { id: 'ticket-a', status: 'RESOLVED', auditLogs: [] };
            },
            update: async (query) => updates.push(query.data),
        },
        $transaction: async (action) => action({
            supportTicket: { update: async (query) => updates.push(query.data) },
            supportTicketAuditLog: { createMany: async (query) => audit.push(...query.data) },
            notification: { create: async (query) => notifications.push(query.data) },
        }),
    };

    const result = await updateTicket({
        ticketId: 'ticket-a',
        actor: { id: 'admin-a', role: 'ADMIN' },
        input: { status: 'RESOLVED' },
        database,
    });

    assert.equal(result.status, 'RESOLVED');
    assert.equal(updates[0].status, 'RESOLVED');
    assert.ok(updates[0].resolvedAt instanceof Date);
    assert.equal(audit[0].action, 'STATUS_CHANGED');
    assert.equal(audit[0].fromStatus, 'IN_PROGRESS');
    assert.equal(audit[0].toStatus, 'RESOLVED');
    assert.equal(notifications[0].userId, 'member-a');
});
