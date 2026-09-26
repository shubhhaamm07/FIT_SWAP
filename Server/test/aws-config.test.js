const test = require('node:test');
const assert = require('node:assert/strict');

test('API modules can load without optional S3 configuration', async () => {
    const originalRegion = process.env.AWS_REGION;
    delete process.env.AWS_REGION;

    try {
        const storage = require('../src/config/aws');
        assert.equal(typeof storage.send, 'function');
        await assert.rejects(storage.send({}), /AWS_REGION must be configured/);
    } finally {
        if (originalRegion === undefined) delete process.env.AWS_REGION;
        else process.env.AWS_REGION = originalRegion;
    }
});
