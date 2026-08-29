const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const token = authHeader.slice(7).trim();

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

        // Use the current database role, not the role embedded in an old token.
        req.user = { id: user.id, userId: user.id, role: user.role };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

module.exports = {
    protect
};
