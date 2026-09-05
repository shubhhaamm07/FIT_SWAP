const prisma = require('../lib/prisma');
const notificationService = require('./notification.service');
const { verificationDocumentSelect } = require('./gym-verification-fields');

const REQUIRED_GYM_FIELDS = ['name', 'address', 'city', 'state', 'pincode', 'phone'];
const REAPPROVAL_FIELDS = ['name', 'address', 'city', 'state', 'pincode', 'latitude', 'longitude'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

const normalizeText = (value, fieldName, { optional = false } = {}) => {
    if (value === undefined || value === null) {
        if (optional) return null;
        return '';
    }

    if (typeof value !== 'string' && typeof value !== 'number') {
        throw new Error(`${fieldName} must be text`);
    }

    const normalized = String(value).trim();
    return normalized || (optional ? null : '');
};

const normalizeCoordinate = (value, fieldName, minimum, maximum) => {
    const isNumber = typeof value === 'number';
    const isNumericString = typeof value === 'string'
        && /^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim());

    if (!isNumber && !isNumericString) {
        throw new Error(`${fieldName} must be a valid number`);
    }

    const coordinate = Number(value);

    if (!Number.isFinite(coordinate) || coordinate < minimum || coordinate > maximum) {
        throw new Error(`${fieldName} must be between ${minimum} and ${maximum}`);
    }

    return coordinate;
};

const normalizeCoordinates = (gymData) => {
    const hasLatitude = hasOwn(gymData, 'latitude');
    const hasLongitude = hasOwn(gymData, 'longitude');

    if (hasLatitude !== hasLongitude) {
        throw new Error('Latitude and longitude must be provided together');
    }

    if (!hasLatitude) return {};

    const latitudeIsEmpty = gymData.latitude === null
        || gymData.latitude === undefined
        || (typeof gymData.latitude === 'string' && !gymData.latitude.trim());
    const longitudeIsEmpty = gymData.longitude === null
        || gymData.longitude === undefined
        || (typeof gymData.longitude === 'string' && !gymData.longitude.trim());

    if (latitudeIsEmpty || longitudeIsEmpty) {
        if (latitudeIsEmpty && longitudeIsEmpty) {
            return { latitude: null, longitude: null };
        }

        throw new Error('Latitude and longitude must be provided together');
    }

    return {
        latitude: normalizeCoordinate(gymData.latitude, 'Latitude', -90, 90),
        longitude: normalizeCoordinate(gymData.longitude, 'Longitude', -180, 180)
    };
};

const sanitizeGymData = (gymData) => {
    if (!gymData || typeof gymData !== 'object' || Array.isArray(gymData)) {
        throw new Error('Gym details are required');
    }

    const sanitized = {
        name: normalizeText(gymData.name, 'Name'),
        address: normalizeText(gymData.address, 'Address'),
        city: normalizeText(gymData.city, 'City'),
        state: normalizeText(gymData.state, 'State'),
        pincode: normalizeText(gymData.pincode, 'Pincode'),
        phone: normalizeText(gymData.phone, 'Phone'),
        email: normalizeText(gymData.email, 'Email', { optional: true }),
        description: normalizeText(gymData.description, 'Description', { optional: true }),
        ...normalizeCoordinates(gymData)
    };

    if (REQUIRED_GYM_FIELDS.some((field) => !sanitized[field])) {
        throw new Error('Name, address, city, state, pincode, and phone are required');
    }

    if (sanitized.email) {
        sanitized.email = sanitized.email.toLowerCase();

        if (!EMAIL_PATTERN.test(sanitized.email)) {
            throw new Error('Please provide a valid gym email address');
        }
    }

    return sanitized;
};

const suspendFutureTrialOperations = async (database, gymId, { reason, actorId = null }) => {
    const now = new Date();
    const activeStatuses = ['PENDING', 'CONFIRMED'];
    const affectedBookings = await database.gymTrialBooking.findMany({
        where: {
            status: { in: activeStatuses },
            slot: { gymId, startAt: { gt: now } }
        },
        select: { userId: true }
    });

    await database.gymTrialBooking.updateMany({
        where: {
            status: { in: activeStatuses },
            slot: { gymId, startAt: { gt: now } }
        },
        data: {
            status: 'CANCELLED',
            cancellationReason: reason,
            cancelledAt: now,
            ...(actorId ? { lastUpdatedById: actorId } : {})
        }
    });

    await database.gymTrialSlot.updateMany({
        where: { gymId, isActive: true, startAt: { gt: now } },
        data: { isActive: false, bookedCount: 0 }
    });

    return [...new Set(affectedBookings.map((booking) => booking.userId))];
};

const notifySuspendedTrialBookings = async (userIds, gymName, message) => {
    await Promise.all(userIds.map(async (userId) => {
        try {
            await notificationService.createNotification(
                userId,
                'Gym trial cancelled',
                `Your upcoming trial at ${gymName} was cancelled because ${message}. Please choose another available slot.`,
                { category: 'TRANSACTIONAL' }
            );
        } catch (_error) {
            // The business change succeeded; inbox delivery can safely fail alone.
        }
    }));
};

const createGym = async (gymData, ownerId) => {
    const sanitizedGymData = sanitizeGymData(gymData);

    const gym = await prisma.gym.create({
        data: {
            ...sanitizedGymData,
            ownerId
        }
    });

    return gym;
};
const getMyGyms = async (ownerId) => {
    const gyms = await prisma.gym.findMany({
        where: {
            ownerId
        },
        include: {
            verificationDocuments: {
                select: verificationDocumentSelect,
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
            },
            images: {
                orderBy: [
                    { isPrimary: 'desc' },
                    { displayOrder: 'asc' }
                ]
            },
            plans: {
                orderBy: { createdAt: 'desc' }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return gyms;
};
const getAllGyms = async () => {
    const gyms = await prisma.gym.findMany({
        where: {
            status: 'APPROVED'
        },
        include: {
            images: {
                orderBy: [
                    { isPrimary: 'desc' },
                    { displayOrder: 'asc' }
                ]
            },
            plans: {
                orderBy: { price: 'asc' }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return gyms;
};
const updateGymStatus = async (gymId, status, actorId = null) => {
    const result = await prisma.$transaction(async (tx) => {
        const existingGym = await tx.gym.findUnique({
            where: { id: gymId },
            select: { id: true, name: true }
        });
        if (!existingGym) throw new Error('Gym not found');

        const gym = await tx.gym.update({
            where: { id: gymId },
            data: { status }
        });

        const affectedUserIds = status === 'APPROVED'
            ? []
            : await suspendFutureTrialOperations(tx, gymId, {
                reason: 'This gym is no longer approved for trial sessions',
                actorId
            });

        return { gym, affectedUserIds };
    });

    if (result.affectedUserIds.length) {
        await notifySuspendedTrialBookings(
            result.affectedUserIds,
            result.gym.name,
            'the gym is no longer approved for trial sessions'
        );
    }

    return result.gym;
};

const updateGymByOwner = async (gymId, ownerId, gymData) => {
    const gym = await prisma.gym.findFirst({
        where: { id: gymId, ownerId },
        select: {
            id: true,
            name: true,
            status: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
            latitude: true,
            longitude: true,
            updatedAt: true
        }
    });

    if (!gym) {
        throw new Error('Gym not found or you do not have permission to edit it');
    }

    const sanitizedGymData = sanitizeGymData(gymData);
    // Fail a stale edit rather than allowing it to change details that an admin
    // has just approved. Prisma includes these guards in the UPDATE itself.
    const updateWhere = { id: gymId, ownerId, status: gym.status, updatedAt: gym.updatedAt };
    const requiresReapproval = gym.status === 'APPROVED'
        && REAPPROVAL_FIELDS.some((field) => (
            hasOwn(sanitizedGymData, field)
            && gym[field] !== sanitizedGymData[field]
        ));

    if (!requiresReapproval) {
        return prisma.gym.update({
            where: updateWhere,
            data: sanitizedGymData
        });
    }

    const result = await prisma.$transaction(async (tx) => {
        const updatedGym = await tx.gym.update({
            where: updateWhere,
            data: { ...sanitizedGymData, status: 'PENDING' }
        });
        const affectedUserIds = await suspendFutureTrialOperations(tx, gymId, {
            reason: 'The gym name or location details were changed and need approval',
            actorId: ownerId
        });
        return { gym: updatedGym, affectedUserIds };
    });

    if (result.affectedUserIds.length) {
        await notifySuspendedTrialBookings(
            result.affectedUserIds,
            result.gym.name,
            'the gym name or location details changed and are being reviewed'
        );
    }

    return result.gym;
};
const getGymById = async (gymId) => {
    return prisma.gym.findFirst({
        where: {
            id: gymId,
            status: 'APPROVED'
        },
        include: {
            images: {
                orderBy: [
                    { isPrimary: 'desc' },
                    { displayOrder: 'asc' }
                ]
            },
            plans: {
                orderBy: { price: 'asc' }
            }
        }
    });
};
module.exports = {
    createGym, getMyGyms, getAllGyms, updateGymStatus, updateGymByOwner, getGymById,
    suspendFutureTrialOperations
};
