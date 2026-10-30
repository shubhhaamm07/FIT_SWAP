const test = require('node:test');
const assert = require('node:assert/strict');
const { buildAllowedOrigins } = require('../src/security/client-origins');
test('development allows the local mobile preview and Expo web origins', () => {
    const origins = buildAllowedOrigins({ NODE_ENV: 'development', CLIENT_URL: 'http://localhost:5173' });
    assert.ok(origins.has('http://127.0.0.1:8082'));
    assert.ok(origins.has('http://localhost:8081'));
    assert.ok(origins.has('http://[::1]:8082'));
    assert.ok(!origins.has('http://192.168.1.77:8082'));
    assert.ok(!origins.has('https://untrusted.example'));
    assert.ok(!origins.has('http://localhost:9999'));
});
test('production trusts only the configured website origins', () => {
    const origins = buildAllowedOrigins({ NODE_ENV: 'production', CLIENT_URLS: 'https://fitswap.example/, https://admin.fitswap.example' });
    assert.deepEqual([...origins], ['https://fitswap.example', 'https://admin.fitswap.example']);
    assert.ok(!origins.has('http://127.0.0.1:8082'));
    assert.ok(!origins.has('http://localhost:8081'));
});
