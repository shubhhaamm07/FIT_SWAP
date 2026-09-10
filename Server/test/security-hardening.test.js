const test = require('node:test');
const assert = require('node:assert/strict');

const { validateNewPassword } = require('../src/security/password-policy');
const { serializePublicListing } = require('../src/serializers/public-marketplace');
const { writeTransferAudit } = require('../src/services/transfer-policy.service');

test('new passwords must be long, mixed, and unrelated to account identity', async () => {
    const previousSetting = process.env.BREACHED_PASSWORD_CHECK_ENABLED;
    process.env.BREACHED_PASSWORD_CHECK_ENABLED = 'false';
    try {
        await assert.rejects(
            validateNewPassword('short', {}),
            /at least 12 characters/i,
        );
        await assert.rejects(
            validateNewPassword('Shubham-Strong-84!', { firstName: 'Shubham' }),
            /must not contain your name/i,
        );
        await assert.doesNotReject(
            validateNewPassword('Comet!River84Blue', { email: 'member@example.com' }),
        );
    } finally {
        if (previousSetting === undefined) delete process.env.BREACHED_PASSWORD_CHECK_ENABLED;
        else process.env.BREACHED_PASSWORD_CHECK_ENABLED = previousSetting;
    }
});

test('private marketplace sellers and storage keys are removed from discovery responses', () => {
    const output = serializePublicListing({
        id: 'listing-1',
        sellerId: 'private-user-id',
        seller: {
            id: 'private-user-id',
            firstName: 'Private',
            lastName: 'Member',
            username: 'private-member',
            isProfilePublic: false,
        },
        membership: {
            id: 'membership-1',
            userId: 'private-user-id',
            user: { id: 'private-user-id' },
            plan: {
                id: 'plan-1',
                gym: {
                    id: 'gym-1',
                    ownerId: 'owner-private-id',
                    images: [{ id: 'image-1', imageKey: 'gyms/private/key.jpg', imageUrl: 'https://example.com/image.jpg' }],
                },
            },
        },
    });

    assert.equal(output.seller.firstName, 'FitSwap');
    assert.equal(output.seller.lastName, 'Seller');
    assert.equal(output.seller.id, undefined);
    assert.equal(output.sellerId, undefined);
    assert.equal(output.membership.userId, undefined);
    assert.equal(output.membership.user, undefined);
    assert.equal(output.membership.plan.gym.ownerId, undefined);
    assert.equal(output.membership.plan.gym.images[0].imageKey, undefined);
});

test('transfer audit entries form a keyed hash chain', async () => {
    const previousSecret = process.env.AUDIT_HMAC_SECRET;
    process.env.AUDIT_HMAC_SECRET = 'test-only-audit-secret-that-is-not-used-in-production';
    let lastHash = null;
    const saved = [];
    const tx = {
        transferAuditLog: {
            findFirst: async () => lastHash ? { entryHash: lastHash } : null,
            create: async ({ data }) => {
                saved.push(data);
                lastHash = data.entryHash;
                return data;
            },
        },
    };

    try {
        await writeTransferAudit(tx, {
            membershipId: 'membership-1',
            action: 'REQUEST_CREATED',
            summary: 'First event',
        });
        await writeTransferAudit(tx, {
            membershipId: 'membership-1',
            action: 'REQUEST_APPROVED',
            summary: 'Second event',
        });
    } finally {
        if (previousSecret === undefined) delete process.env.AUDIT_HMAC_SECRET;
        else process.env.AUDIT_HMAC_SECRET = previousSecret;
    }

    assert.equal(saved[0].previousHash, 'GENESIS');
    assert.equal(saved[1].previousHash, saved[0].entryHash);
    assert.match(saved[0].entryHash, /^[a-f0-9]{64}$/);
    assert.notEqual(saved[0].entryHash, saved[1].entryHash);
});
