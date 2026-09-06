const prisma = require('../lib/prisma');
const { createTransactionalNotification } = require('./notification.service');

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

const deviceNameFromUserAgent = (userAgent = '') => {
    const agent = String(userAgent);
    const device = /iPad/i.test(agent) ? 'iPad'
        : /iPhone/i.test(agent) ? 'iPhone'
            : /Android/i.test(agent) ? 'Android device'
                : /Macintosh|Mac OS X/i.test(agent) ? 'Mac'
                    : /Windows/i.test(agent) ? 'Windows PC'
                        : /Linux/i.test(agent) ? 'Linux device' : 'Unknown device';
    const browser = /Edg\//i.test(agent) ? 'Edge'
        : /Chrome\//i.test(agent) && !/Edg\//i.test(agent) ? 'Chrome'
            : /Firefox\//i.test(agent) ? 'Firefox'
                : /Safari\//i.test(agent) && !/Chrome\//i.test(agent) ? 'Safari' : 'Browser';
    return `${browser} on ${device}`;
};

const requestDetails = (req) => {
    const userAgent = String(req.get?.('user-agent') || req.headers?.['user-agent'] || '').slice(0, 500) || null;
    const forwarded = String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
    const ipAddress = (forwarded || req.ip || req.socket?.remoteAddress || '').slice(0, 64) || null;
    return { userAgent, ipAddress, deviceName: deviceNameFromUserAgent(userAgent) };
};

const recordFailedLogin = async (email, req, authMethod = 'PASSWORD') => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || normalizedEmail.length > 254) return;
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
    const details = requestDetails(req);
    await prisma.loginAudit.create({
        data: {
            userId: user?.id || null,
            email: normalizedEmail,
            authMethod,
            status: 'FAILURE',
            riskLevel: user ? 'SUSPICIOUS' : 'NONE',
            detail: 'Unsuccessful sign-in attempt',
            ...details
        }
    });
};

const createSession = async ({ user, req, authMethod }) => {
    const details = requestDetails(req);
    const now = new Date();
    const [existingAuditCount, matchingDevice] = await Promise.all([
        prisma.loginAudit.count({ where: { userId: user.id, status: 'SUCCESS' } }),
        prisma.loginAudit.findFirst({
            where: { userId: user.id, status: 'SUCCESS', userAgent: details.userAgent },
            select: { id: true }
        })
    ]);
    const riskLevel = existingAuditCount > 0 && !matchingDevice ? 'NEW_DEVICE' : 'NONE';
    const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);
    const result = await prisma.$transaction(async (tx) => {
        const session = await tx.userSession.create({
            data: { userId: user.id, authMethod, expiresAt, ...details }
        });
        await tx.loginAudit.create({
            data: {
                userId: user.id,
                email: user.email,
                authMethod,
                status: 'SUCCESS',
                riskLevel,
                detail: riskLevel === 'NEW_DEVICE' ? 'Signed in from a new device' : 'Signed in',
                ...details
            }
        });
        return session;
    });

    if (riskLevel === 'NEW_DEVICE') {
        createTransactionalNotification(
            user.id,
            'New device signed in',
            `Your FitSwap account was accessed from ${details.deviceName}. Review your Security Centre if this was not you.`
        ).catch(() => undefined);
    }
    return result;
};

const revokeSession = async (sessionId, userId, reason = 'SIGNED_OUT') => {
    const updated = await prisma.userSession.updateMany({
        where: { id: sessionId, userId, revokedAt: null },
        data: { revokedAt: new Date(), revokedReason: reason }
    });
    return Boolean(updated.count);
};

const revokeOtherSessions = async (userId, currentSessionId, reason = 'SIGNED_OUT_BY_USER') => {
    const where = { userId, revokedAt: null };
    if (currentSessionId) where.id = { not: currentSessionId };
    return prisma.userSession.updateMany({ where, data: { revokedAt: new Date(), revokedReason: reason } });
};

const revokeAllSessions = async (userId, reason = 'PASSWORD_CHANGED') => prisma.userSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: reason }
});

const touchSession = (sessionId) => {
    if (!sessionId) return;
    prisma.userSession.updateMany({
        where: { id: sessionId, revokedAt: null },
        data: { lastSeenAt: new Date() }
    }).catch(() => undefined);
};

const recordPasswordChange = (userId, req, source) => {
    const details = requestDetails(req);
    return prisma.passwordChangeAudit.create({
        data: { userId, source, deviceName: details.deviceName, ipAddress: details.ipAddress }
    });
};

const getSecurityOverview = async (userId, currentSessionId) => {
    const now = new Date();
    const [user, sessions, loginHistory, passwordChanges] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { passwordChangedAt: true } }),
        prisma.userSession.findMany({
            where: { userId, revokedAt: null, expiresAt: { gt: now } },
            orderBy: { lastSeenAt: 'desc' },
            select: { id: true, deviceName: true, ipAddress: true, authMethod: true, createdAt: true, lastSeenAt: true, expiresAt: true }
        }),
        prisma.loginAudit.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 25,
            select: { id: true, deviceName: true, ipAddress: true, authMethod: true, status: true, riskLevel: true, detail: true, createdAt: true }
        }),
        prisma.passwordChangeAudit.findMany({
            where: { userId },
            orderBy: { changedAt: 'desc' },
            take: 10,
            select: { id: true, source: true, deviceName: true, ipAddress: true, changedAt: true }
        })
    ]);
    return {
        passwordChangedAt: user?.passwordChangedAt || null,
        currentSessionId: currentSessionId || null,
        sessions: sessions.map((session) => ({ ...session, isCurrent: session.id === currentSessionId })),
        loginHistory,
        passwordChanges
    };
};

module.exports = {
    createSession,
    recordFailedLogin,
    revokeSession,
    revokeOtherSessions,
    revokeAllSessions,
    touchSession,
    recordPasswordChange,
    getSecurityOverview
};
