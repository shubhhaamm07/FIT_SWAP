const crypto = require('crypto');
const prisma = require('../lib/prisma');

const COMPLETED_TTL_MS = 24 * 60 * 60 * 1000;
const PENDING_TTL_MS = 2 * 60 * 1000;

const stableValue = (value) => {
    if (Array.isArray(value)) return value.map(stableValue);
    if (value && typeof value === 'object') {
        return Object.keys(value).sort().reduce((result, key) => {
            result[key] = stableValue(value[key]);
            return result;
        }, {});
    }
    return value;
};

const requestFingerprint = (req) => crypto.createHash('sha256').update(JSON.stringify({
    method: req.method,
    path: req.baseUrl + req.path,
    params: stableValue(req.params || {}),
    body: stableValue(req.body || {}),
})).digest('hex');

const invalidKey = (key) => !key || key.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(key);

const reserveRecord = async ({ userId, scope, key, requestHash }) => {
    try {
        return {
            created: true,
            record: await prisma.idempotencyRecord.create({
                data: {
                    userId,
                    scope,
                    key,
                    requestHash,
                    expiresAt: new Date(Date.now() + COMPLETED_TTL_MS),
                },
            }),
        };
    } catch (error) {
        if (error.code !== 'P2002') throw error;
        const record = await prisma.idempotencyRecord.findUnique({
            where: { userId_scope_key: { userId, scope, key } },
        });
        return { created: false, record };
    }
};

const requireIdempotency = (scope) => async (req, res, next) => {
    const key = String(req.get('idempotency-key') || '').trim();
    if (invalidKey(key)) {
        return res.status(400).json({
            success: false,
            code: 'IDEMPOTENCY_KEY_REQUIRED',
            message: 'This action requires a valid Idempotency-Key header.',
        });
    }

    const userId = req.user?.id;
    const requestHash = requestFingerprint(req);

    try {
        let reservation = await reserveRecord({ userId, scope, key, requestHash });
        let record = reservation.record;

        const recordExpired = record && record.expiresAt.getTime() <= Date.now();
        const pendingStale = record && !record.completedAt
            && Date.now() - record.createdAt.getTime() > PENDING_TTL_MS;
        if (!reservation.created && (recordExpired || pendingStale)) {
            await prisma.idempotencyRecord.deleteMany({
                where: {
                    id: record.id,
                    ...(pendingStale && !recordExpired ? { completedAt: null } : {}),
                },
            });
            reservation = await reserveRecord({ userId, scope, key, requestHash });
            record = reservation.record;
        }

        if (!record) {
            return res.status(409).json({
                success: false,
                code: 'IDEMPOTENCY_CONFLICT',
                message: 'This request could not be safely reserved. Please try again.',
            });
        }
        if (record.requestHash !== requestHash) {
            return res.status(409).json({
                success: false,
                code: 'IDEMPOTENCY_KEY_REUSED',
                message: 'This Idempotency-Key was already used for a different request.',
            });
        }
        if (record.completedAt) {
            res.setHeader('Idempotency-Replayed', 'true');
            return res.status(record.responseStatus).json(record.responseBody);
        }
        if (!reservation.created) {
            return res.status(409).json({
                success: false,
                code: 'REQUEST_IN_PROGRESS',
                message: 'The same request is already being processed.',
            });
        }

        const sendJson = res.json.bind(res);
        res.json = (body) => {
            const status = res.statusCode;
            const persist = status >= 500
                ? prisma.idempotencyRecord.deleteMany({ where: { id: record.id, completedAt: null } })
                : prisma.idempotencyRecord.update({
                    where: { id: record.id },
                    data: {
                        responseStatus: status,
                        responseBody: body,
                        completedAt: new Date(),
                        expiresAt: new Date(Date.now() + COMPLETED_TTL_MS),
                    },
                });

            persist.catch((error) => {
                console.error('Unable to finalize idempotency record', { name: error.name, scope });
            }).finally(() => sendJson(body));
            return res;
        };

        if (Math.random() < 0.01) {
            prisma.idempotencyRecord.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => undefined);
        }
        return next();
    } catch (error) {
        return next(error);
    }
};

module.exports = { requireIdempotency };
