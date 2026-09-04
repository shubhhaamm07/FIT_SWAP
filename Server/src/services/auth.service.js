const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const validator = require('validator');
const prisma = require('../lib/prisma');
const { sendEmail, assertEmailConfigured } = require('./email.service');

const profileSelect = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    role: true,
    emailVerifiedAt: true,
    username: true,
    bio: true,
    city: true,
    isProfilePublic: true,
    avatarUrl: true,
    avatarKey: true,
    coverUrl: true,
    coverKey: true,
    emailNotifications: true,
    marketplaceNotifications: true,
    membershipExpiryNotifications: true,
    upiId: true,
    upiPayeeName: true,
    createdAt: true,
    _count: {
        select: {
            memberships: true,
            listings: true,
            savedListings: true
        }
    }
};

const authError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const getGoogleClientId = () => String(process.env.GOOGLE_CLIENT_ID || '').trim();

const getGoogleProfileName = (payload) => {
    const givenName = String(payload.given_name || '').trim();
    const familyName = String(payload.family_name || '').trim();

    if (givenName) {
        return {
            firstName: givenName.slice(0, 80),
            lastName: (familyName || 'Member').slice(0, 80)
        };
    }

    const parts = String(payload.name || 'FitSwap Member').trim().split(/\s+/).filter(Boolean);
    return {
        firstName: (parts.shift() || 'FitSwap').slice(0, 80),
        lastName: (parts.join(' ') || 'Member').slice(0, 80)
    };
};

const hashAuthToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const getClientUrl = () => (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const createAuthToken = async (userId, type, expiresInMs) => {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashAuthToken(token);

    await prisma.$transaction([
        prisma.authToken.deleteMany({ where: { userId, type } }),
        prisma.authToken.create({
            data: {
                userId,
                type,
                tokenHash,
                expiresAt: new Date(Date.now() + expiresInMs)
            }
        })
    ]);

    return token;
};

const findUsableAuthToken = async (token, type) => {
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/i.test(token)) {
        throw authError('This link is invalid or has expired. Please request a new one.');
    }

    const authToken = await prisma.authToken.findFirst({
        where: {
            tokenHash: hashAuthToken(token),
            type,
            usedAt: null,
            expiresAt: { gt: new Date() }
        },
        include: { user: true }
    });

    if (!authToken) {
        throw authError('This link is invalid or has expired. Please request a new one.');
    }

    return authToken;
};

const sendVerificationEmail = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, firstName: true, email: true, emailVerifiedAt: true, isActive: true }
    });

    if (!user || !user.isActive) {
        throw authError('Account not found', 404);
    }

    if (user.emailVerifiedAt) {
        return { alreadyVerified: true };
    }

    assertEmailConfigured();

    const token = await createAuthToken(user.id, 'EMAIL_VERIFICATION', 24 * 60 * 60 * 1000);
    const verificationUrl = `${getClientUrl()}/verify-email?token=${encodeURIComponent(token)}`;
    const firstName = escapeHtml(user.firstName || 'there');

    await sendEmail({
        to: user.email,
        subject: 'Verify your FitSwap email address',
        text: `Hi ${user.firstName || 'there'}, verify your email address by opening this link within 24 hours: ${verificationUrl}`,
        html: `<div style="font-family:Arial,sans-serif;color:#18181b;line-height:1.6"><h2>Verify your FitSwap email</h2><p>Hi ${firstName},</p><p>Please confirm that this email address belongs to you. This link expires in 24 hours.</p><p><a href="${verificationUrl}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">Verify email address</a></p><p>If you did not create a FitSwap account, you can safely ignore this email.</p></div>`
    });

    return { alreadyVerified: false };
};

const requestEmailVerification = async (email) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!validator.isEmail(normalizedEmail)) {
        throw authError('Please provide a valid email address');
    }

    // Check configuration before issuing a token. This makes it impossible to
    // produce a verification URL that can never be delivered.
    assertEmailConfigured();

    const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, isActive: true, emailVerifiedAt: true },
    });

    // Keep this result intentionally generic so the endpoint cannot be used
    // to discover which email addresses have FitSwap accounts.
    if (!user || !user.isActive || user.emailVerifiedAt) {
        return { delivered: false };
    }

    await sendVerificationEmail(user.id);
    return { delivered: true };
};

const requestPasswordReset = async (email) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!validator.isEmail(normalizedEmail)) {
        throw authError('Please provide a valid email address');
    }

    assertEmailConfigured();

    const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, firstName: true, email: true, isActive: true }
    });

    // Keep the response identical when the address is unknown, so this endpoint
    // cannot be used to discover which email addresses have FitSwap accounts.
    if (!user || !user.isActive) {
        return { delivered: false };
    }

    const token = await createAuthToken(user.id, 'PASSWORD_RESET', 60 * 60 * 1000);
    const resetUrl = `${getClientUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    const firstName = escapeHtml(user.firstName || 'there');

    await sendEmail({
        to: user.email,
        subject: 'Reset your FitSwap password',
        text: `Hi ${user.firstName || 'there'}, reset your FitSwap password by opening this link within 1 hour: ${resetUrl}`,
        html: `<div style="font-family:Arial,sans-serif;color:#18181b;line-height:1.6"><h2>Reset your FitSwap password</h2><p>Hi ${firstName},</p><p>We received a request to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">Reset password</a></p><p>If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p></div>`
    });

    return { delivered: true };
};

const verifyEmail = async (token) => {
    const authToken = await findUsableAuthToken(token, 'EMAIL_VERIFICATION');

    const completed = await prisma.$transaction(async (tx) => {
        const claim = await tx.authToken.updateMany({
            where: {
                id: authToken.id,
                usedAt: null,
                expiresAt: { gt: new Date() }
            },
            data: { usedAt: new Date() }
        });

        if (!claim.count) {
            throw authError('This link has already been used or has expired. Please request a new one.');
        }

        await tx.user.update({
            where: { id: authToken.userId },
            data: { emailVerifiedAt: new Date() }
        });
        await tx.authToken.deleteMany({
            where: { userId: authToken.userId, type: 'EMAIL_VERIFICATION' }
        });

        return true;
    });

    return { verified: completed };
};

const resetPasswordWithToken = async ({ token, newPassword }) => {
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
        throw authError('New password must be at least 8 characters long');
    }

    const authToken = await findUsableAuthToken(token, 'PASSWORD_RESET');
    const password = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction(async (tx) => {
        const claim = await tx.authToken.updateMany({
            where: {
                id: authToken.id,
                usedAt: null,
                expiresAt: { gt: new Date() }
            },
            data: { usedAt: new Date() }
        });

        if (!claim.count) {
            throw authError('This link has already been used or has expired. Please request another password reset.');
        }

        await tx.user.update({
            where: { id: authToken.userId },
            data: { password, passwordChangedAt: new Date() }
        });
        await tx.authToken.deleteMany({
            where: { userId: authToken.userId, type: 'PASSWORD_RESET' }
        });
    });
};

const withProfileImageAvailability = (user) => {
    if (!user) return user;

    const { avatarKey, coverKey, avatarUrl: _avatarUrl, coverUrl: _coverUrl, ...profile } = user;

    return {
        ...profile,
        hasAvatar: Boolean(avatarKey),
        hasCover: Boolean(coverKey),
    };
};

const registerUser = async ({
    firstName,
    lastName,
    email,
    phone,
    password,
    role
}) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPhone = String(phone || '').trim() || null;
    const normalizedRole = role === 'GYM_OWNER' ? 'GYM_OWNER' : 'USER';

    if (!firstName?.trim() || !lastName?.trim()) {
        throw new Error('First name and last name are required');
    }

    if (!validator.isEmail(normalizedEmail)) {
        throw new Error('Please provide a valid email address');
    }

    if (typeof password !== 'string' || password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
    }

    if (normalizedPhone && !/^\d{10}$/.test(normalizedPhone)) {
        throw new Error('Phone number must contain exactly 10 digits');
    }

    const existingUser = await prisma.user.findUnique({
        where: {
            email: normalizedEmail
        }
    });
    if (existingUser) {
        throw new Error('An account already exists with this email address. Try signing in or reset your password.');
    }

    if (normalizedPhone) {
        const existingPhone = await prisma.user.findUnique({
            where: {
                phone: normalizedPhone
            }
        });

        if (existingPhone) {
            throw new Error('An account already exists with this phone number. Try signing in or use another number.');
        }
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    let user;
    try {
        user = await prisma.user.create({
            data: {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: normalizedEmail,
                phone: normalizedPhone,
                password: hashedPassword,
                // Public registration must never be able to create an admin or staff account.
                role: normalizedRole
            }
        });
    } catch (error) {
        // The pre-check is for a friendly answer, while the database constraint
        // remains the race-safe source of truth if two sign-ups arrive together.
        if (error?.code === 'P2002') {
            const target = Array.isArray(error.meta?.target) ? error.meta.target.join(',') : String(error.meta?.target || '');
            if (target.includes('phone')) {
                throw new Error('An account already exists with this phone number. Try signing in or use another number.');
            }
            throw new Error('An account already exists with this email address. Try signing in or reset your password.');
        }
        throw error;
    }

    return user;
};
const loginUser = async ({ email, password }) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();

    const user = await prisma.user.findUnique({
        where: {
            email: normalizedEmail
        }
    });

    if (!user) {
        throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
        throw new Error('This account has been suspended. Please contact FitSwap support.');
    }

    const isPasswordValid = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordValid) {
        throw new Error('Invalid credentials');
    }

    if (!user.emailVerifiedAt) {
        const error = authError(
            'Verify your email address before signing in. You can request a new verification link below.',
            403
        );
        error.code = 'EMAIL_NOT_VERIFIED';
        throw error;
    }

    return user;
};

const loginWithGoogleCredential = async (credential) => {
    const googleClientId = getGoogleClientId();

    if (!googleClientId) {
        throw authError('Google sign-in is not configured on the server yet.', 503);
    }

    if (typeof credential !== 'string' || credential.trim().split('.').length !== 3) {
        const error = authError('Google sign-in could not be verified. Please try again.', 401);
        error.code = 'GOOGLE_TOKEN_INVALID';
        throw error;
    }

    let payload;
    try {
        const googleClient = new OAuth2Client(googleClientId);
        const ticket = await googleClient.verifyIdToken({
            idToken: credential.trim(),
            audience: googleClientId
        });
        payload = ticket.getPayload();
    } catch (verificationError) {
        const error = authError('Google sign-in could not be verified. Please try again.', 401);
        error.code = 'GOOGLE_TOKEN_INVALID';
        throw error;
    }

    const subject = String(payload?.sub || '').trim();
    const email = String(payload?.email || '').trim().toLowerCase();

    // Only trust a signed Google identity with a verified email address. The
    // immutable `sub` is stored for every later sign-in and account link.
    if (!subject || !validator.isEmail(email) || payload?.email_verified !== true) {
        const error = authError('Google did not provide a verified email address for this account.', 401);
        error.code = 'GOOGLE_EMAIL_UNVERIFIED';
        throw error;
    }

    let user = await prisma.user.findUnique({
        where: { googleSubject: subject }
    });

    if (user) {
        if (!user.isActive) {
            throw authError('This account has been suspended. Please contact FitSwap support.', 403);
        }
        return user;
    }

    const accountWithEmail = await prisma.user.findUnique({
        where: { email }
    });

    if (accountWithEmail) {
        if (!accountWithEmail.isActive) {
            throw authError('This account has been suspended. Please contact FitSwap support.', 403);
        }

        // Do not silently replace an existing Google identity with another
        // account, even if both claim the same email address.
        if (accountWithEmail.googleSubject && accountWithEmail.googleSubject !== subject) {
            throw authError('This FitSwap account is already linked to another Google account.', 409);
        }

        return prisma.user.update({
            where: { id: accountWithEmail.id },
            data: {
                googleSubject: subject,
                emailVerifiedAt: accountWithEmail.emailVerifiedAt || new Date()
            }
        });
    }

    const { firstName, lastName } = getGoogleProfileName(payload);

    try {
        return await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                googleSubject: subject,
                // Google has already verified the signed-in email address.
                emailVerifiedAt: new Date(),
                // Password remains mandatory in the current schema. This is a
                // random, non-user-facing value; Google users can add a
                // password later through account recovery if that is enabled.
                password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12),
                role: 'USER'
            }
        });
    } catch (error) {
        if (error?.code !== 'P2002') throw error;

        // Handle two first-time sign-ins arriving at almost the same moment.
        const concurrentUser = await prisma.user.findFirst({
            where: {
                OR: [{ googleSubject: subject }, { email }]
            }
        });

        if (!concurrentUser || !concurrentUser.isActive) {
            throw authError('Google sign-in could not be completed. Please try again.', 409);
        }

        if (concurrentUser.googleSubject && concurrentUser.googleSubject !== subject) {
            throw authError('This FitSwap account is already linked to another Google account.', 409);
        }

        return prisma.user.update({
            where: { id: concurrentUser.id },
            data: {
                googleSubject: subject,
                emailVerifiedAt: concurrentUser.emailVerifiedAt || new Date()
            }
        });
    }
};

const getProfile = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: profileSelect
    });

    return withProfileImageAvailability(user);
};

const updateProfile = async (userId, { firstName, lastName, phone, username, bio, city, isProfilePublic }) => {
    const normalizedFirstName = String(firstName || '').trim();
    const normalizedLastName = String(lastName || '').trim();
    const normalizedPhone = phone ? String(phone).trim() : null;
    const normalizedUsername = username ? String(username).trim().toLowerCase() : null;
    const normalizedBio = bio ? String(bio).trim() : null;
    const normalizedCity = city ? String(city).trim() : null;

    if (!normalizedFirstName || !normalizedLastName) {
        throw new Error('First name and last name are required');
    }

    if (normalizedPhone && !/^[+\d][\d\s()-]{6,19}$/.test(normalizedPhone)) {
        throw new Error('Please provide a valid phone number');
    }

    if (normalizedPhone) {
        const phoneOwner = await prisma.user.findUnique({
            where: { phone: normalizedPhone },
            select: { id: true }
        });

        if (phoneOwner && phoneOwner.id !== userId) {
            throw new Error('Phone number already exists');
        }
    }

    if (normalizedUsername && !/^[a-z0-9_]{3,30}$/.test(normalizedUsername)) {
        throw new Error('Username must be 3 to 30 characters and use only letters, numbers, or underscores');
    }

    if (normalizedUsername) {
        const usernameOwner = await prisma.user.findUnique({
            where: { username: normalizedUsername },
            select: { id: true }
        });
        if (usernameOwner && usernameOwner.id !== userId) {
            throw new Error('That username is already taken');
        }
    }

    if (normalizedBio && normalizedBio.length > 280) {
        throw new Error('Bio must be 280 characters or fewer');
    }

    if (normalizedCity && normalizedCity.length > 80) {
        throw new Error('City must be 80 characters or fewer');
    }

    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            firstName: normalizedFirstName,
            lastName: normalizedLastName,
            phone: normalizedPhone,
            username: normalizedUsername,
            bio: normalizedBio,
            city: normalizedCity,
            ...(typeof isProfilePublic === 'boolean' ? { isProfilePublic } : {})
        },
        select: profileSelect
    });

    return withProfileImageAvailability(user);
};

const updateSettings = async (userId, settings) => {
    const data = {};

    if (typeof settings.emailNotifications === 'boolean') {
        data.emailNotifications = settings.emailNotifications;
    }
    if (typeof settings.marketplaceNotifications === 'boolean') {
        data.marketplaceNotifications = settings.marketplaceNotifications;
    }
    if (typeof settings.membershipExpiryNotifications === 'boolean') {
        data.membershipExpiryNotifications = settings.membershipExpiryNotifications;
    }
    const hasUpiChange = Object.prototype.hasOwnProperty.call(settings, 'upiId')
        || Object.prototype.hasOwnProperty.call(settings, 'upiPayeeName');
    if (hasUpiChange) {
        const upiId = String(settings.upiId || '').trim().toLowerCase();
        const upiPayeeName = String(settings.upiPayeeName || '').trim();

        if (!upiId && !upiPayeeName) {
            data.upiId = null;
            data.upiPayeeName = null;
        } else {
            if (!/^[a-z0-9._-]{2,100}@[a-z0-9._-]{2,100}$/.test(upiId)) {
                throw new Error('Enter a valid UPI ID, for example gymname@okaxis');
            }
            if (upiPayeeName.length < 2 || upiPayeeName.length > 120) {
                throw new Error('Enter the 2–120 character name shown to payers in your UPI app');
            }
            data.upiId = upiId;
            data.upiPayeeName = upiPayeeName;
        }
    }

    if (!Object.keys(data).length) {
        throw new Error('No valid settings were provided');
    }

    const user = await prisma.user.update({
        where: { id: userId },
        data,
        select: profileSelect
    });

    return withProfileImageAvailability(user);
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters long');
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true }
    });

    if (!user || !(await bcrypt.compare(currentPassword || '', user.password))) {
        throw new Error('Current password is incorrect');
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            password: await bcrypt.hash(newPassword, 10),
            passwordChangedAt: new Date()
        }
    });
};

const deleteAccount = async (userId, { password, confirmation }) => {
    if (confirmation !== 'DELETE') {
        throw new Error('Type DELETE to confirm account deletion');
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true, _count: { select: { gyms: true } } }
    });

    if (!user || !(await bcrypt.compare(password || '', user.password))) {
        throw new Error('Current password is incorrect');
    }

    if (user._count.gyms > 0) {
        throw new Error('Gym owners must transfer or close their gyms before deleting their account');
    }

    await prisma.$transaction(async (tx) => {
        const ownedListings = {
            OR: [
                { sellerId: userId },
                { membership: { userId } }
            ]
        };

        const reservedTrials = await tx.gymTrialBooking.groupBy({
            by: ['slotId'],
            where: {
                userId,
                status: { in: ['PENDING', 'CONFIRMED'] }
            },
            _count: { _all: true }
        });

        // Trial bookings are deleted with the account, but the denormalized
        // capacity counter must be released first so those places reopen.
        for (const reservation of reservedTrials) {
            const slot = await tx.gymTrialSlot.findUnique({
                where: { id: reservation.slotId },
                select: { id: true, bookedCount: true }
            });
            if (slot) {
                await tx.gymTrialSlot.update({
                    where: { id: slot.id },
                    data: {
                        bookedCount: Math.max(0, slot.bookedCount - reservation._count._all)
                    }
                });
            }
        }

        await tx.gymTrialBooking.deleteMany({ where: { userId } });

        await tx.transferRequest.deleteMany({
            where: {
                OR: [
                    { buyerId: userId },
                    { listing: ownedListings }
                ]
            }
        });
        await tx.savedListing.deleteMany({ where: { userId } });
        await tx.marketplaceListing.deleteMany({ where: ownedListings });
        await tx.userMembership.deleteMany({ where: { userId } });
        await tx.notification.deleteMany({ where: { userId } });
        await tx.user.delete({ where: { id: userId } });
    });
};

module.exports = {
    registerUser,
    loginUser,
    loginWithGoogleCredential,
    getProfile,
    updateProfile,
    updateSettings,
    changePassword,
    deleteAccount,
    sendVerificationEmail,
    requestEmailVerification,
    requestPasswordReset,
    verifyEmail,
    resetPasswordWithToken
};
