const bcrypt = require('bcryptjs');
const validator = require('validator');
const prisma = require('../lib/prisma');

const profileSelect = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    role: true,
    avatarUrl: true,
    avatarKey: true,
    coverUrl: true,
    coverKey: true,
    emailNotifications: true,
    marketplaceNotifications: true,
    createdAt: true,
    _count: {
        select: {
            memberships: true,
            listings: true,
            savedListings: true
        }
    }
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

    const existingUser = await prisma.user.findUnique({
        where: {
            email: normalizedEmail
        }
    });
    if (phone) {
        const existingPhone = await prisma.user.findUnique({
            where: {
                phone
            }
        });

        if (existingPhone) {
            throw new Error("Phone number already exists");
        }
    }
    if (existingUser) {
        throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: normalizedEmail,
            phone,
            password: hashedPassword,
            // Public registration must never be able to create an admin or staff account.
            role: normalizedRole
        }
    });

    return user;
};
const loginUser = async ({ email, password }) => {
    const user = await prisma.user.findUnique({
        where: {
            email
        }
    });

    if (!user) {
        throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordValid) {
        throw new Error('Invalid credentials');
    }

    return user;
};

const getProfile = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: profileSelect
    });

    return withProfileImageAvailability(user);
};

const updateProfile = async (userId, { firstName, lastName, phone }) => {
    const normalizedFirstName = String(firstName || '').trim();
    const normalizedLastName = String(lastName || '').trim();
    const normalizedPhone = phone ? String(phone).trim() : null;

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

    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            firstName: normalizedFirstName,
            lastName: normalizedLastName,
            phone: normalizedPhone
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
        data: { password: await bcrypt.hash(newPassword, 10) }
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
    getProfile,
    updateProfile,
    updateSettings,
    changePassword,
    deleteAccount
};
