const authService = require('../services/auth.service');
const generateToken = require('../utils/generate-token');

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
    try {
        const user = await authService.loginUser(req.body);

        const token = generateToken(user);

        return res.status(200).json({
            success: true,
            token,
            user: authResponseUser(user)
        });
    } catch (error) {
        return res.status(error.statusCode || 401).json({
            success: false,
            message: error.message,
            code: error.code
        });
    }
};

const googleLogin = async (req, res) => {
    try {
        const user = await authService.loginWithGoogleCredential(req.body?.credential);
        const token = generateToken(user);

        return res.status(200).json({
            success: true,
            token,
            user: authResponseUser(user)
        });
    } catch (error) {
        return res.status(error.statusCode || 401).json({
            success: false,
            message: error.message,
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

const resetPassword = async (req, res) => {
    try {
        await authService.resetPasswordWithToken(req.body || {});
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
        return res.status(200).json({
            success: true,
            message: 'Password updated successfully'
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
