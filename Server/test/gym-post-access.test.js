const test = require('node:test');
const assert = require('node:assert/strict');

const prismaPath = require.resolve('../src/lib/prisma');
const servicePath = require.resolve('../src/services/gym-post.service');
const originalPrisma = require.cache[prismaPath];
let membership = null;
let membershipQuery = null;
let postQueryCount = 0;

require.cache[prismaPath] = {
    id: prismaPath,
    filename: prismaPath,
    loaded: true,
    exports: {
        userMembership: {
            findFirst: async (query) => { membershipQuery = query; return membership; },
        },
        gymPost: {
            findMany: async () => {
                postQueryCount += 1;
                return [{ id: 'post-1', gymId: 'gym-1', posterKey: 'private-s3-key', offerPrice: null }];
            },
            findFirst: async () => { postQueryCount += 1; return { posterKey: 'private-s3-key' }; },
        },
    },
};
delete require.cache[servicePath];
const service = require(servicePath);

test.after(() => {
    delete require.cache[servicePath];
    if (originalPrisma) require.cache[prismaPath] = originalPrisma;
    else delete require.cache[prismaPath];
});

test('a non-member cannot list gym updates or retrieve a poster', async () => {
    membership = null;
    postQueryCount = 0;
    await assert.rejects(service.listMember('gym-1', 'outsider'), { status: 403 });
    await assert.rejects(service.getPoster('gym-1', 'post-1', { userId: 'outsider' }), { status: 403 });
    assert.equal(postQueryCount, 0);
});

test('only a currently active gym membership grants access', async () => {
    membership = { id: 'membership-1' };
    const posts = await service.listMember('gym-1', 'member-1');
    assert.equal(membershipQuery.where.userId, 'member-1');
    assert.equal(membershipQuery.where.status, 'ACTIVE');
    assert.equal(membershipQuery.where.plan.gymId, 'gym-1');
    assert.ok(membershipQuery.where.startDate.lte instanceof Date);
    assert.ok(membershipQuery.where.endDate.gt instanceof Date);
    assert.equal(posts[0].posterUrl, '/api/gyms/gym-1/posts/post-1/poster');
    assert.equal('posterKey' in posts[0], false);
});
