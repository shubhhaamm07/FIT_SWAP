const authService = require('../services/auth.service');
const generateToken = require('../utils/generate-token');
const securityService = require('../services/security.service');

const sessionCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // The web app and API use different production domains, so the cookie
    // needs SameSite=None. The CSRF middleware verifies write-request origins.
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
});

const setSessionCookie = (res, token) => res.cookie('fitswap_session', token, sessionCookieOptions());
const clearSessionCookie = (res) => res.clearCookie('fitswap_session', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
});

const authResponseUser = (user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    emailVerifiedAt: user.emailVerifiedAt
});
const register = async (req, res) => {
    try {
        const user = await authService.registerUser(req.body);

        // Registration must never wait on an SMTP connection. An unreachable
        // mail server used to leave the browser stuck at "Creating account…"
        // even though the account had already been inserted in PostgreSQL.
        const response = res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                id: user.id,
                email: user.email,
                verificationEmailQueued: true
            }
        });

        // Email is a convenience after account creation, not part of the
        // account-creation transaction. Users can resend it from Settings.
        setImmediate(() => {
            authService.sendVerificationEmail(user.id)
                .catch((emailError) => {
                    console.warn(`Verification email was not sent for user ${user.id}: ${emailError.message}`);
                });
        });

        return response;
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
const login = async (req, res) => {
    let user;
    try {
        user = await authService.loginUser(req.body);
        const session = await securityService.createSession({ user, req, authMethod: 'PASSWORD' });
        const token = generateToken(user, session.id);

        setSessionCookie(res, token);
        return res.status(200).json({
            success: true,
            user: authResponseUser(user)
        });
    } catch (error) {
        if (!user) securityService.recordFailedLogin(req.body?.email, req, 'PASSWORD').catch(() => undefined);
        return res.status(error.statusCode || (user ? 500 : 401)).json({
            success: false,
            message: user ? 'Unable to create a secure session. Please try again.' : error.message,
            code: error.code
        });
    }
};

const googleLogin = async (req, res) => {
    let user;
    try {
        user = await authService.loginWithGoogleCredential(req.body?.credential);
        const session = await securityService.createSession({ user, req, authMethod: 'GOOGLE' });
        const token = generateToken(user, session.id);

        setSessionCookie(res, token);
        return res.status(200).json({
            success: true,
            user: authResponseUser(user)
        });
    } catch (error) {
        return res.status(error.statusCode || (user ? 500 : 401)).json({
            success: false,
            message: user ? 'Unable to create a secure session. Please try again.' : error.message,
            code: error.code
        });
    }
};

const requestPasswordReset = async (req, res) => {
    try {
        await authService.requestPasswordReset(req.body?.email);
        return res.status(200).json({
            success: true,
            message: 'If an active FitSwap account uses that email, a password-reset link has been sent.'
        });
    } catch (error) {
        return res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

const logout = async (req, res) => {
    if (req.user?.sessionId) {
        await securityService.revokeSession(req.user.sessionId, req.user.id, 'SIGNED_OUT');
    }
    clearSessionCookie(res);
    return res.status(204).send();
};

const resetPassword = async (req, res) => {
    try {
        const result = await authService.resetPasswordWithToken(req.body || {});
        await Promise.all([
            securityService.revokeAllSessions(result.userId, 'PASSWORD_RESET'),
            securityService.recordPasswordChange(result.userId, req, 'PASSWORD_RESET')
        ]);
        return res.status(200).json({
            success: true,
            message: 'Password reset successfully. You can now sign in.'
        });
    } catch (error) {
        return res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

const verifyEmail = async (req, res) => {
    try {
        await authService.verifyEmail(req.body?.token);
        return res.status(200).json({
            success: true,
            message: 'Email verified successfully.'
        });
    } catch (error) {
        return res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

const resendVerificationEmail = async (req, res) => {
    try {
        const result = await authService.sendVerificationEmail(req.user.id);
        return res.status(200).json({
            success: true,
            message: result.alreadyVerified ? 'Your email is already verified.' : 'Verification email sent.'
        });
    } catch (error) {
        return res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

const requestVerificationEmail = async (req, res) => {
    try {
        await authService.requestEmailVerification(req.body?.email);
        return res.status(200).json({
            success: true,
            message: 'If an active unverified FitSwap account uses that email, a verification link has been sent.'
        });
    } catch (error) {
        return res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};
const getMe = async (req, res) => {
    try {
        const user = await authService.getProfile(req.user.id);
        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const updateMe = async (req, res) => {
    try {
        const user = await authService.updateProfile(req.user.id, req.body);
        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const updateSettings = async (req, res) => {
    try {
        const user = await authService.updateSettings(req.user.id, req.body);
        return res.status(200).json({
            success: true,
            message: 'Settings updated successfully',
            user
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const changePassword = async (req, res) => {
    try {
        await authService.changePassword(req.user.id, req.body);
        await Promise.all([
            securityService.revokeAllSessions(req.user.id, 'PASSWORD_CHANGED'),
            securityService.recordPasswordChange(req.user.id, req, 'PASSWORD_CHANGED')
        ]);
        clearSessionCookie(res);
        return res.status(200).json({
            success: true,
            message: 'Password updated successfully. Please sign in again on this device.',
            reauthenticationRequired: true
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const deleteMe = async (req, res) => {
    try {
        await authService.deleteAccount(req.user.id, req.body);
        return res.status(200).json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    register,
    login,
    googleLogin,
    logout,
    getMe,
    updateMe,
    updateSettings,
    changePassword,
    deleteMe,
    requestPasswordReset,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
    requestVerificationEmail
};
