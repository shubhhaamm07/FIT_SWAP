const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const bearerToken = authHeader?.startsWith('Bearer ')
            ? authHeader.slice(7).trim()
            : '';
        const token = bearerToken
            || req.cookies?.['__Host-fitswap_session']
            || req.cookies?.fitswap_session;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, role: true, isActive: true, emailVerifiedAt: true, passwordChangedAt: true }
        });

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: user ? 'This account has been suspended' : 'Invalid token'
            });
        }

        if (!user.emailVerifiedAt) {
            return res.status(403).json({
                success: false,
                code: 'EMAIL_NOT_VERIFIED',
                message: 'Verify your email address before using your FitSwap account.'
            });
        }

        // Password resets must end sessions created with the old password.
        // JWT `iat` is expressed in whole seconds, so a token issued during
        // the same second as a fresh login remains valid.
        if (
            user.passwordChangedAt &&
            decoded.iat &&
            Math.floor(user.passwordChangedAt.getTime() / 1000) > decoded.iat
        ) {
            return res.status(401).json({
                success: false,
                message: 'Your password was changed. Please sign in again.'
            });
        }

        // Server-side sessions make logout, password changes, and account
        // suspension effective immediately instead of waiting for JWT expiry.
        if (!decoded.sessionId && process.env.ALLOW_LEGACY_JWT !== 'true') {
            return res.status(401).json({
                success: false,
                message: 'Your session must be renewed. Please sign in again.'
            });
        }

        let authenticatedAt = decoded.iat ? new Date(decoded.iat * 1000) : null;
        if (decoded.sessionId) {
            const session = await prisma.userSession.findFirst({
                where: {
                    id: decoded.sessionId,
                    userId: user.id,
                    revokedAt: null,
                    expiresAt: { gt: new Date() }
                },
                select: { id: true, lastSeenAt: true, createdAt: true }
            });
            if (!session) {
                return res.status(401).json({
                    success: false,
                    message: 'This device session is no longer active. Please sign in again.'
                });
            }
            authenticatedAt = session.createdAt;

            // Avoid a database write on every API call while keeping the
            // active-device list reasonably current.
            if (Date.now() - session.lastSeenAt.getTime() > 10 * 60 * 1000) {
                prisma.userSession.update({
                    where: { id: session.id },
                    data: { lastSeenAt: new Date() }
                }).catch(() => undefined);
            }
        }

        // Use the current database role, not the role embedded in an old token.
        req.user = {
            id: user.id,
            userId: user.id,
            role: user.role,
            sessionId: decoded.sessionId || null,
            authenticatedAt,
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

const requireRecentAuthentication = (maximumAgeMinutes = 30) => (req, res, next) => {
    const authenticatedAt = req.user?.authenticatedAt && new Date(req.user.authenticatedAt);
    if (!authenticatedAt || Date.now() - authenticatedAt.getTime() > maximumAgeMinutes * 60 * 1000) {
        return res.status(403).json({
            success: false,
            code: 'REAUTHENTICATION_REQUIRED',
            message: 'For your security, sign in again before performing this sensitive action.',
        });
    }
    return next();
};

module.exports = {
    protect,
    requireRecentAuthentication,
};
