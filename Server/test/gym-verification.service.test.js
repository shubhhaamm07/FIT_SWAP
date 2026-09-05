const test = require('node:test');
const assert = require('node:assert/strict');
const { PDFDocument } = require('pdf-lib');
const { createGymVerificationService, validatePdf, MAX_PDF_BYTES } = require('../src/services/gym-verification.service');

const pdfFile = async (pages = 1) => {
    const doc = await PDFDocument.create();
    for (let i = 0; i < pages; i += 1) doc.addPage();
    return { originalname: 'gym-photos.pdf', buffer: Buffer.from(await doc.save()) };
};

test('PDF validation accepts a readable PDF and rejects disguised, oversized and excessive-page files', async () => {
    const file = await pdfFile();
    const metadata = await validatePdf(file);
    assert.equal(metadata.pageCount, 1);
    assert.equal(metadata.byteSize, file.buffer.length);
    assert.match(metadata.sha256, /^[a-f0-9]{64}$/);
    await assert.rejects(validatePdf({ originalname: 'photos.pdf', buffer: Buffer.from('<html>fake</html>') }), { statusCode: 400 });
    await assert.rejects(validatePdf({ ...file, originalname: 'photos.html' }), { statusCode: 400 });
    await assert.rejects(validatePdf({ ...file, buffer: Buffer.alloc(MAX_PDF_BYTES + 1) }), { statusCode: 413 });
    await assert.rejects(validatePdf(await pdfFile(26)), { statusCode: 400 });
    await assert.rejects(validatePdf(), { statusCode: 400 });
});

test('an unrelated owner cannot upload or fetch another gym document from S3', async () => {
    let storageCalls = 0;
    const service = createGymVerificationService({
        database: {
            gym: { findFirst: async () => null },
            gymVerificationDocument: { findFirst: async (query) => {
                assert.equal(query.where.gym.ownerId, 'stranger');
                assert.equal(query.where.gymId, 'gym-a');
                return null;
            } }
        },
        storage: { send: async () => { storageCalls += 1; } }
    });
    await assert.rejects(service.submit({ gymId: 'gym-a', ownerId: 'stranger', file: await pdfFile() }), { statusCode: 404 });
    await assert.rejects(service.download({ gymId: 'gym-a', documentId: 'doc-a', user: { id: 'stranger', role: 'GYM_OWNER' } }), { statusCode: 404 });
    assert.equal(storageCalls, 0);
});

test('an uploaded S3 object is removed if the database transaction fails', async () => {
    const commands = [];
    const service = createGymVerificationService({
        database: {
            gym: { findFirst: async () => ({ id: 'gym-a' }) },
            $transaction: async () => { throw new Error('database unavailable'); }
        },
        storage: { send: async (command) => { commands.push(command); } },
        getBucket: () => 'test-private-bucket'
    });
    await assert.rejects(service.submit({ gymId: 'gym-a', ownerId: 'owner', file: await pdfFile() }), /database unavailable/);
    assert.deepEqual(commands.map((command) => command.constructor.name), ['PutObjectCommand', 'DeleteObjectCommand']);
    assert.equal(commands[0].input.Key, commands[1].input.Key);
    assert.equal(commands[0].input.ACL, undefined);
    assert.equal(commands[0].input.ServerSideEncryption, 'AES256');
    assert.match(commands[0].input.Key, /^gym-verification\/gym-a\/.*\.pdf$/);
});

const reviewFixture = ({ status = 'PENDING', documentId = 'current-doc', documentStatus = 'SUBMITTED', auditFails = false } = {}) => {
    const calls = [];
    const updatedAt = new Date('2026-09-05T12:00:00Z');
    const gym = { id: 'gym-a', ownerId: 'owner', name: 'Gym A', status, updatedAt };
    const tx = {
        gym: {
            findUnique: async () => gym,
            update: async ({ data }) => { calls.push('gym'); return { ...gym, ...data }; }
        },
        gymVerificationDocument: {
            findFirst: async () => documentId ? { id: documentId, status: documentStatus, sha256: 'hash' } : null,
            update: async (query) => { calls.push(query.data); }
        },
        gymTrialBooking: { findMany: async () => [], updateMany: async () => ({ count: 0 }) },
        gymTrialSlot: { updateMany: async () => ({ count: 0 }) },
        adminAuditLog: { create: async (query) => {
            calls.push({ audit: query.data });
            if (auditFails) throw new Error('audit failure');
        } },
        notification: { create: async (query) => { calls.push({ notification: query.data }); } }
    };
    const service = createGymVerificationService({
        database: { $transaction: async (action, options) => {
            assert.equal(options.isolationLevel, 'Serializable');
            return action(tx);
        } }
    });
    return { service, calls, input: { gymId: gym.id, adminId: 'admin', status: 'APPROVED', documentId: 'current-doc', expectedUpdatedAt: updatedAt.toISOString() } };
};

test('approval rejects missing evidence, outdated documents, and stale/already-reviewed gym applications', async () => {
    for (const state of [{ documentId: null }, { documentId: 'newer-doc' }, { documentStatus: 'APPROVED' }, { status: 'APPROVED' }]) {
        const { service, calls, input } = reviewFixture(state);
        await assert.rejects(service.review(input), { statusCode: 409 });
        assert.equal(calls.length, 0);
    }
    const { service, calls, input } = reviewFixture();
    await assert.rejects(service.review({ ...input, expectedUpdatedAt: '2026-09-04T12:00:00Z' }), { statusCode: 409 });
    assert.equal(calls.length, 0);
});

test('an admin decision records the reviewed PDF, audit, and owner notification in the same transaction', async () => {
    const { service, calls, input } = reviewFixture();
    const result = await service.review(input);
    assert.equal(result.status, 'APPROVED');
    assert.equal(calls[0].reviewedById, 'admin');
    assert.equal(calls[0].status, 'APPROVED');
    assert.equal(calls[2].audit.metadata.documentId, 'current-doc');
    assert.equal(calls[3].notification.userId, 'owner');
    assert.match(calls[3].notification.message, /approved/);
});

test('rejection requires a reason and sends the explanation to the gym owner', async () => {
    const { service, calls, input } = reviewFixture();
    await assert.rejects(service.review({ ...input, status: 'REJECTED', reviewNote: ' ' }), { statusCode: 400 });
    assert.equal(calls.length, 0);
    await service.review({ ...input, status: 'REJECTED', reviewNote: 'Need entrance photos.' });
    assert.equal(calls[0].reviewNote, 'Need entrance photos.');
    assert.match(calls[3].notification.message, /Need entrance photos/);
});
