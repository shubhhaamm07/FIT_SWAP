const test = require('node:test');
const assert = require('node:assert/strict');
const { validatePost } = require('../src/services/gym-post.service');

test('a gym update can be published without a poster', () => {
    const result = validatePost({ kind: 'UPDATE', title: 'New opening hours', body: 'Open later on Fridays.', isPublished: 'true' });
    assert.equal(result.kind, 'UPDATE');
    assert.equal(result.isPublished, true);
    assert.equal(result.offerPrice, null);
});

test('offers need a valid price and future end date', () => {
    assert.throws(() => validatePost({ kind: 'OFFER', title: 'Student offer', offerPrice: '499.999' }), /price/i);
    assert.throws(() => validatePost({ kind: 'OFFER', title: 'Student offer', offerPrice: '499' }), /describe the offer/i);
    assert.throws(() => validatePost({ kind: 'OFFER', title: 'Student offer', offerPrice: '499', body: 'Students only this month' }), /end date/i);
    const result = validatePost({ kind: 'OFFER', title: 'Student offer', offerPrice: '499.00', body: 'Students only this month', endsAt: '2099-01-01T00:00:00.000Z' });
    assert.equal(result.offerPrice, '499.00');
});

test('winner posts require a display name and all posts enforce length limits', () => {
    assert.throws(() => validatePost({ kind: 'WINNER', title: 'Challenge winner' }), /winner display name/i);
    assert.throws(() => validatePost({ kind: 'WINNER', title: 'Challenge winner', winnerName: 'A.', isPublished: 'true' }), /agreed/i);
    assert.equal(validatePost({ kind: 'WINNER', title: 'Challenge winner', winnerName: 'A.', isPublished: 'true', winnerConsent: 'true' }).winnerName, 'A.');
    assert.throws(() => validatePost({ kind: 'UPDATE', title: 'x'.repeat(101) }), /title/i);
    assert.throws(() => validatePost({ kind: 'UPDATE', title: 'Valid title', body: 'x'.repeat(1001) }), /description/i);
});
