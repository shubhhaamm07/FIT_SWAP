const { createClient } = require('redis');
const { RedisStore } = require('rate-limit-redis');

const redisUrl = String(process.env.REDIS_URL || '').trim();
let client;
let connection;

if (redisUrl) {
    client = createClient({ url: redisUrl });
    client.on('error', (error) => {
        console.error('Redis rate-limit store error', { name: error.name });
    });
    connection = client.connect().catch((error) => {
        console.error('Redis rate-limit store unavailable', { name: error.name });
        return null;
    });
} else if (process.env.NODE_ENV === 'production') {
    console.warn('REDIS_URL is not configured; rate limits are local to this API instance.');
}

const createRateLimitStore = (scope) => {
    if (!client) return undefined;

    return new RedisStore({
        prefix: `fitswap:rate-limit:${scope}:`,
        sendCommand: async (...args) => {
            await connection;
            if (!client.isReady) throw new Error('Redis rate-limit store is not ready');
            return client.sendCommand(args);
        },
    });
};

const getRedisClient = async () => {
    if (!client) return null;
    await connection;
    return client.isReady ? client : null;
};

module.exports = { createRateLimitStore, getRedisClient };
