const test = require('node:test');
const assert = require('node:assert/strict');

const { toPaise, fromPaise } = require('../src/utils/money');

test('money conversion preserves two-decimal INR values without floating-point multiplication', () => {
    assert.equal(toPaise('1999.99'), 199999);
    assert.equal(toPaise('599.70'), 59970);
    assert.equal(toPaise('12'), 1200);
    assert.equal(fromPaise(199999), '1999.99');
});

test('money conversion rejects values that cannot be represented as INR paise', () => {
    assert.equal(toPaise('19.999'), null);
    assert.equal(toPaise('-1.00'), null);
    assert.equal(toPaise('not-a-price'), null);
});
