const crypto = require('crypto');

const prisma = require('../lib/prisma');
const notificationService = require('./notification.service');

const ACTIVE_BOOKING_STATUSES = ['PENDING', 'CONFIRMED'];
const TERMINAL_BOOKING_STATUSES = ['COMPLETED', 'NO_SHOW', 'CANCELLED'];
const OWNER_STATUS_UPDATES = ['CONFIRMED', ...TERMINAL_BOOKING_STATUSES];
const TRIAL_COOLDOWN_DAYS = 30;
const MAX_UPCOMING_BOOKINGS = 3;
const MAX_SLOT_CAPACITY = 100;

const fail = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
};

const parseDate = (value, fieldName) => {
    const date = new Date(value);
    if (!value || Number.isNaN(date.getTime())) {
        fail(400, `${fieldName} must be a valid date and time`);
    }
    return date;
};

const parseCapacity = (value) => {
    const capacity = Number(value);
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > MAX_SLOT_CAPACITY) {
        fail(400, `Capacity must be a whole number between 1 and ${MAX_SLOT_CAPACITY}`);
    }
    return capacity;
};

const parseOptionalBoolean = (value, fieldName) => {
    if (value === undefined) return undefined;
    if (typeof value !== 'boolean') fail(400, `${fieldName} must be true or false`);
    return value;
};

const validateSchedule = (startAt, endAt) => {
    const now = new Date();
    const durationMs = endAt.getTime() - startAt.getTime();

    if (startAt <= now) fail(400, 'Trial slots must start in the future');
    if (endAt <= startAt) fail(400, 'Trial slot end time must be after its start time');
    if (durationMs < 15 * 60 * 1000 || durationMs > 4 * 60 * 60 * 1000) {
        fail(400, 'A trial slot must be between 15 minutes and 4 hours long');
    }
};

const sendNotificationSafely = async (userId, title, message) => {
    try {
        await notificationService.createNotification(userId, title, message, {
            category: 'TRANSACTIONAL'
        });
    } catch (error) {
        // A completed booking action should not be rolled back by notification delivery.
    }
};

const slotInclude = {
    gym: {
        select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
            ownerId: true,
            status: true,
            images: {
                where: { isPrimary: true },
                take: 1,
                select: { imageUrl: true }
            }
        }
    }
};

const bookingInclude = {
    slot: {
        include: slotInclude
    },
    user: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
        }
    }
};

const serializeSlot = (slot) => {
    const { ownerId: _ownerId, ...publicGym } = slot.gym || {};
    return {
        ...slot,
        gym: publicGym,
        remainingCapacity: Math.max(0, slot.capacity - slot.bookedCount),
        isFull: slot.bookedCount >= slot.capacity
    };
};

const serializeBooking = (booking, { includeUser = false } = {}) => {
    const {
        user: bookingUser,
        userId: _userId,
        lastUpdatedById: _lastUpdatedById,
        ...publicBooking
    } = booking;

    return {
        ...publicBooking,
        slot: serializeSlot(booking.slot),
        ...(includeUser ? { user: bookingUser } : {})
    };
};

const assertOwnedGym = async (client, gymId, ownerId) => {
    const gym = await client.gym.findFirst({
        where: { id: gymId, ownerId },
        select: { id: true, name: true, status: true, ownerId: true }
    });

    if (!gym) fail(404, 'Gym not found or you do not have permission to manage it');
    return gym;
};

const createTrialSlot = async (ownerId, input = {}) => {
    const gymId = String(input.gymId || '').trim();
    if (!gymId) fail(400, 'Gym is required');

    const [gym, startAt, endAt, capacity] = await Promise.all([
        assertOwnedGym(prisma, gymId, ownerId),
        Promise.resolve(parseDate(input.startAt, 'Start time')),
        Promise.resolve(parseDate(input.endAt, 'End time')),
        Promise.resolve(parseCapacity(input.capacity))
    ]);

    if (gym.status !== 'APPROVED') fail(400, 'Trial slots can only be created for an approved gym');
    validateSchedule(startAt, endAt);
    const requiresApproval = parseOptionalBoolean(input.requiresApproval, 'Requires approval') ?? false;

    try {
        const slot = await prisma.gymTrialSlot.create({
            data: {
                gymId,
                startAt,
                endAt,
                capacity,
                requiresApproval
            },
            include: slotInclude
        });
        return serializeSlot(slot);
    } catch (error) {
        if (error.code === 'P2002') fail(409, 'A trial slot already exists for this gym at that time');
        throw error;
    }
};

const listOwnerTrialSlots = async (ownerId, query = {}) => {
    const gymId = query.gymId ? String(query.gymId) : undefined;
    if (gymId) await assertOwnedGym(prisma, gymId, ownerId);

    const where = {
        gym: { ownerId },
        ...(gymId ? { gymId } : {})
    };

    if (query.upcoming === 'true') where.startAt = { gte: new Date() };
    if (query.active === 'true') where.isActive = true;
    if (query.active === 'false') where.isActive = false;

    const slots = await prisma.gymTrialSlot.findMany({
        where,
        include: slotInclude,
        orderBy: { startAt: 'asc' },
        take: 250
    });

    return slots.map(serializeSlot);
};

const updateTrialSlot = async (ownerId, slotId, input = {}) => {
    const existing = await prisma.gymTrialSlot.findFirst({
        where: { id: slotId, gym: { ownerId } },
        include: { _count: { select: { bookings: true } } }
    });

    if (!existing) fail(404, 'Trial slot not found');
    if (existing.startAt <= new Date()) fail(400, 'Past or started trial slots cannot be edited');
    if (!existing.isActive) fail(400, 'A deactivated trial slot cannot be edited');

    const scheduleWasProvided = input.startAt !== undefined || input.endAt !== undefined;
    if (scheduleWasProvided && existing._count.bookings > 0) {
        fail(409, 'The schedule cannot be changed after a trial has been booked');
    }

    const startAt = input.startAt === undefined
        ? existing.startAt
        : parseDate(input.startAt, 'Start time');
    const endAt = input.endAt === undefined
        ? existing.endAt
        : parseDate(input.endAt, 'End time');
    validateSchedule(startAt, endAt);

    const capacity = input.capacity === undefined
        ? existing.capacity
        : parseCapacity(input.capacity);
    if (capacity < existing.bookedCount) {
        fail(409, `Capacity cannot be lower than the ${existing.bookedCount} reserved places`);
    }
    const requiresApproval = parseOptionalBoolean(input.requiresApproval, 'Requires approval');

    try {
        const slot = await prisma.gymTrialSlot.update({
            where: { id: existing.id },
            data: {
                startAt,
                endAt,
                capacity,
                ...(requiresApproval === undefined
                    ? {}
                    : { requiresApproval })
            },
            include: slotInclude
        });
        return serializeSlot(slot);
    } catch (error) {
        if (error.code === 'P2002') fail(409, 'A trial slot already exists for this gym at that time');
        throw error;
    }
};

const deactivateTrialSlot = async (ownerId, slotId, reason) => {
    const now = new Date();
    const cancellationReason = String(reason || 'Trial slot cancelled by the gym').trim().slice(0, 300);

    const result = await prisma.$transaction(async (tx) => {
        const slot = await tx.gymTrialSlot.findFirst({
            where: { id: slotId, gym: { ownerId } },
            include: slotInclude
        });
        if (!slot) fail(404, 'Trial slot not found');
        if (!slot.isActive) fail(400, 'Trial slot is already inactive');
        if (slot.startAt <= now) fail(400, 'Past or started trial slots cannot be deactivated');

        const affectedBookings = await tx.gymTrialBooking.findMany({
            where: { slotId, status: { in: ACTIVE_BOOKING_STATUSES } },
            select: { id: true, userId: true }
        });

        await tx.gymTrialBooking.updateMany({
            where: { slotId, status: { in: ACTIVE_BOOKING_STATUSES } },
            data: {
                status: 'CANCELLED',
                cancellationReason,
                cancelledAt: now,
                lastUpdatedById: ownerId
            }
        });

        const updatedSlot = await tx.gymTrialSlot.update({
            where: { id: slotId },
            data: { isActive: false, bookedCount: 0 },
            include: slotInclude
        });

        return { slot: serializeSlot(updatedSlot), affectedBookings };
    });

    await Promise.all(result.affectedBookings.map(({ userId }) =>
        sendNotificationSafely(
            userId,
            'Gym trial cancelled',
            `Your trial at ${result.slot.gym.name} was cancelled by the gym. Please choose another available slot.`
        )
    ));

    return result.slot;
};

const listAvailableTrialSlots = async (query = {}) => {
    const now = new Date();
    const where = {
        isActive: true,
        startAt: { gt: now },
        gym: { status: 'APPROVED' }
    };

    if (query.gymId) where.gymId = String(query.gymId);
    if (query.city) where.gym.city = { equals: String(query.city).trim(), mode: 'insensitive' };

    if (query.from !== undefined || query.to !== undefined) {
        if (!query.from || !query.to) fail(400, 'Both trial range boundaries are required');
        const requestedStart = parseDate(query.from, 'Trial range start');
        const requestedEnd = parseDate(query.to, 'Trial range end');
        if (requestedEnd <= requestedStart) fail(400, 'Trial range end must be after its start');
        if (requestedEnd.getTime() - requestedStart.getTime() > 2 * 24 * 60 * 60 * 1000) {
            fail(400, 'Trial date filters cannot span more than two days');
        }
        const rangeStart = requestedStart > now ? requestedStart : now;
        where.startAt = { gte: rangeStart, lt: requestedEnd };
    } else if (query.date) {
        const date = parseDate(query.date, 'Date');
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const rangeStart = dayStart > now ? dayStart : now;
        where.startAt = { gte: rangeStart, lt: dayEnd };
    }

    const slots = await prisma.gymTrialSlot.findMany({
        where,
        include: slotInclude,
        orderBy: { startAt: 'asc' },
        take: 200
    });

    return slots
        .map(serializeSlot)
        .filter((slot) => !slot.isFull);
};

const generateBookingReference = () =>
    `FST-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

const createBookingInTransaction = async (userId, slotId) => prisma.$transaction(async (tx) => {
    const now = new Date();
    const cooldownStart = new Date(now);
    cooldownStart.setDate(cooldownStart.getDate() - TRIAL_COOLDOWN_DAYS);

    const slot = await tx.gymTrialSlot.findUnique({
        where: { id: slotId },
        include: slotInclude
    });

    if (!slot || !slot.isActive || slot.gym.status !== 'APPROVED') {
        fail(404, 'This trial slot is not available');
    }
    if (slot.startAt <= now) fail(400, 'This trial slot has already started');

    const [existingSlotBooking, sameGymBooking, upcomingBookingCount] = await Promise.all([
        tx.gymTrialBooking.findFirst({
            where: { slotId, userId },
            select: { id: true }
        }),
        tx.gymTrialBooking.findFirst({
            where: {
                userId,
                status: {
                    in: [...ACTIVE_BOOKING_STATUSES, 'COMPLETED', 'NO_SHOW']
                },
                slot: {
                    gymId: slot.gymId,
                    startAt: { gte: cooldownStart }
                }
            },
            select: { id: true, status: true }
        }),
        tx.gymTrialBooking.count({
            where: {
                userId,
                status: { in: ACTIVE_BOOKING_STATUSES },
                slot: { startAt: { gt: now } }
            }
        })
    ]);

    if (existingSlotBooking) {
        fail(409, 'You have already used this trial slot. Please choose another time');
    }
    if (sameGymBooking) {
        fail(409, `Only one trial at the same gym is allowed within ${TRIAL_COOLDOWN_DAYS} days`);
    }
    if (upcomingBookingCount >= MAX_UPCOMING_BOOKINGS) {
        fail(409, `You can have at most ${MAX_UPCOMING_BOOKINGS} upcoming gym trials`);
    }

    const reserved = await tx.gymTrialSlot.updateMany({
        where: {
            id: slotId,
            isActive: true,
            startAt: { gt: now },
            bookedCount: { lt: slot.capacity }
        },
        data: { bookedCount: { increment: 1 } }
    });

    if (reserved.count !== 1) fail(409, 'This trial slot is full or no longer available');

    return tx.gymTrialBooking.create({
        data: {
            slotId,
            userId,
            status: slot.requiresApproval ? 'PENDING' : 'CONFIRMED',
            bookingReference: generateBookingReference()
        },
        include: bookingInclude
    });
}, { isolationLevel: 'Serializable' });

const bookTrialSlot = async (userId, input = {}) => {
    const slotId = String(input.slotId || '').trim();
    if (!slotId) fail(400, 'Trial slot is required');

    let booking;
    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            booking = await createBookingInTransaction(userId, slotId);
            break;
        } catch (error) {
            if (error.code === 'P2002') fail(409, 'You have already booked this trial slot');
            if (error.code !== 'P2034' || attempt === 2) throw error;
        }
    }

    const stateMessage = booking.status === 'PENDING'
        ? 'Your request is waiting for gym approval.'
        : 'Your trial is confirmed.';

    await Promise.all([
        sendNotificationSafely(
            userId,
            'Gym trial booked',
            `${stateMessage} Booking reference: ${booking.bookingReference}`
        ),
        sendNotificationSafely(
            booking.slot.gym.ownerId,
            'New gym trial booking',
            `A user booked a trial at ${booking.slot.gym.name}. Reference: ${booking.bookingReference}`
        )
    ]);

    return serializeBooking(booking);
};

const listMyTrialBookings = async (userId) => {
    const bookings = await prisma.gymTrialBooking.findMany({
        where: { userId },
        include: bookingInclude,
        orderBy: { createdAt: 'desc' },
        take: 100
    });
    return bookings.map((booking) => serializeBooking(booking));
};

const cancelMyTrialBooking = async (userId, bookingId, reason) => {
    const now = new Date();
    const cancellationReason = String(reason || 'Cancelled by user').trim().slice(0, 300);

    const booking = await prisma.$transaction(async (tx) => {
        const existing = await tx.gymTrialBooking.findFirst({
            where: { id: bookingId, userId },
            include: bookingInclude
        });

        if (!existing) fail(404, 'Trial booking not found');
        if (!ACTIVE_BOOKING_STATUSES.includes(existing.status)) {
            fail(400, 'Only pending or confirmed trial bookings can be cancelled');
        }
        if (existing.slot.startAt <= now) fail(400, 'A trial cannot be cancelled after it has started');

        await tx.gymTrialSlot.update({
            where: { id: existing.slotId },
            data: { bookedCount: { decrement: 1 } }
        });

        return tx.gymTrialBooking.update({
            where: { id: bookingId },
            data: {
                status: 'CANCELLED',
                cancellationReason,
                cancelledAt: now,
                lastUpdatedById: userId
            },
            include: bookingInclude
        });
    }, { isolationLevel: 'Serializable' });

    await sendNotificationSafely(
        booking.slot.gym.ownerId,
        'Gym trial cancelled',
        `Trial ${booking.bookingReference} at ${booking.slot.gym.name} was cancelled by the user.`
    );

    return serializeBooking(booking);
};

const listOwnerTrialBookings = async (ownerId, query = {}) => {
    const where = { slot: { gym: { ownerId } } };

    if (query.gymId) {
        await assertOwnedGym(prisma, String(query.gymId), ownerId);
        where.slot = { gymId: String(query.gymId), gym: { ownerId } };
    }
    if (query.status) {
        const status = String(query.status).toUpperCase();
        if (![...ACTIVE_BOOKING_STATUSES, ...TERMINAL_BOOKING_STATUSES].includes(status)) {
            fail(400, 'Invalid trial booking status');
        }
        where.status = status;
    }

    const bookings = await prisma.gymTrialBooking.findMany({
        where,
        include: bookingInclude,
        orderBy: { createdAt: 'desc' },
        take: 250
    });
    return bookings.map((booking) => serializeBooking(booking, { includeUser: true }));
};

const updateBookingStatusByOwner = async (ownerId, bookingId, requestedStatus, reason) => {
    const status = String(requestedStatus || '').trim().toUpperCase();
    if (!OWNER_STATUS_UPDATES.includes(status)) fail(400, 'Invalid trial booking status');

    const now = new Date();
    const cancellationReason = reason ? String(reason).trim().slice(0, 300) : null;

    const booking = await prisma.$transaction(async (tx) => {
        const existing = await tx.gymTrialBooking.findFirst({
            where: { id: bookingId, slot: { gym: { ownerId } } },
            include: bookingInclude
        });

        if (!existing) fail(404, 'Trial booking not found');
        if (!ACTIVE_BOOKING_STATUSES.includes(existing.status)) {
            fail(400, `A ${existing.status.toLowerCase()} trial booking cannot be changed`);
        }
        if (status === 'CONFIRMED' && existing.status !== 'PENDING') {
            fail(400, 'Only a pending trial booking can be confirmed');
        }
        if (['COMPLETED', 'NO_SHOW'].includes(status) && now < existing.slot.startAt) {
            fail(400, `The booking cannot be marked ${status.toLowerCase()} before the trial starts`);
        }
        if (status === 'CANCELLED' && !cancellationReason) {
            fail(400, 'A cancellation reason is required');
        }

        const leavesCapacity = TERMINAL_BOOKING_STATUSES.includes(status);
        if (leavesCapacity) {
            await tx.gymTrialSlot.update({
                where: { id: existing.slotId },
                data: { bookedCount: { decrement: 1 } }
            });
        }

        return tx.gymTrialBooking.update({
            where: { id: bookingId },
            data: {
                status,
                lastUpdatedById: ownerId,
                ...(status === 'COMPLETED' ? { completedAt: now } : {}),
                ...(status === 'NO_SHOW' ? { noShowAt: now } : {}),
                ...(status === 'CANCELLED'
                    ? { cancelledAt: now, cancellationReason }
                    : {})
            },
            include: bookingInclude
        });
    }, { isolationLevel: 'Serializable' });

    const statusMessages = {
        CONFIRMED: `Your trial at ${booking.slot.gym.name} is confirmed.`,
        COMPLETED: `Your trial at ${booking.slot.gym.name} was marked completed.`,
        NO_SHOW: `Your trial at ${booking.slot.gym.name} was marked as a no-show.`,
        CANCELLED: `Your trial at ${booking.slot.gym.name} was cancelled by the gym. Reason: ${cancellationReason}`
    };
    await sendNotificationSafely(booking.userId, 'Gym trial update', statusMessages[status]);

    return serializeBooking(booking, { includeUser: true });
};

module.exports = {
    createTrialSlot,
    listOwnerTrialSlots,
    updateTrialSlot,
    deactivateTrialSlot,
    listAvailableTrialSlots,
    bookTrialSlot,
    listMyTrialBookings,
    cancelMyTrialBooking,
    listOwnerTrialBookings,
    updateBookingStatusByOwner
};
