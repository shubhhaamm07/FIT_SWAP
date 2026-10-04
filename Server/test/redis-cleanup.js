const { after } = require('node:test');

// --require runs in the parent runner too; only test-file workers need teardown.
if (process.env.NODE_TEST_CONTEXT) {
    after(async () => {
        const redisStorePath = require.resolve('../src/config/rate-limit-store');
        if (!require.cache[redisStorePath]) return;

        const { closeRedisClient } = require(redisStorePath);
        const notificationPath = require.resolve('../src/services/notification.service');
        try {
            await closeRedisClient();
        } finally {
            if (require.cache[notificationPath]) {
                await require(notificationPath).closeRedisSubscription();
            }
        }
    });
}
