const prisma = require('../lib/prisma');
const crypto = require('crypto');
const { getRedisClient } = require('../config/rate-limit-store');
const { buildPaginationMeta, getPagination } = require('../utils/pagination');

// Active browser tabs subscribe through the authenticated SSE route. Keeping
// the stream registry in this process avoids exposing notification data to a
// third party; the database remains the durable notification source of truth.
const subscribersByUserId = new Map();
const processId = crypto.randomUUID();
const redisChannel = 'fitswap:notifications';
let redisSubscriber;
let redisSubscription;

const publishLocalNotification = (notification) => {
    const subscribers = subscribersByUserId.get(notification.userId);
    if (!subscribers?.size) return;

    const payload = `event: notification\ndata: ${JSON.stringify(notification)}\n\n`;
    for (const response of subscribers) {
        try {
            response.write(payload);
        } catch (_error) {
            subscribers.delete(response);
        }
    }
    if (!subscribers.size) subscribersByUserId.delete(notification.userId);
};

const ensureRedisSubscription = async () => {
    if (redisSubscription) return redisSubscription;
    redisSubscription = (async () => {
        const publisher = await getRedisClient();
        if (!publisher) return false;

        redisSubscriber = publisher.duplicate();
        redisSubscriber.on('error', (error) => {
            console.error('Redis notification subscriber error', { name: error.name });
        });
        await redisSubscriber.connect();
        await redisSubscriber.subscribe(redisChannel, (message) => {
            try {
                const envelope = JSON.parse(message);
                if (envelope.origin === processId || !envelope.notification?.userId) return;
                publishLocalNotification(envelope.notification);
            } catch (_error) {
                // Ignore malformed cross-instance events; the database inbox is durable.
            }
        });
        return true;
    })().catch((error) => {
        console.error('Redis notification subscription unavailable', { name: error.name });
        redisSubscriber = undefined;
        redisSubscription = undefined;
        return false;
    });
    return redisSubscription;
};

const publishCrossInstanceNotification = async (notification) => {
    const publisher = await getRedisClient();
    if (!publisher) return;
    try {
        await publisher.publish(redisChannel, JSON.stringify({ origin: processId, notification }));
    } catch (error) {
        // Local SSE still works, and the persisted inbox is available on reload.
        console.error('Redis notification publish unavailable', { name: error.name });
    }
};

const subscribe = (userId, response) => {
    const subscribers = subscribersByUserId.get(userId) || new Set();
    subscribers.add(response);
    subscribersByUserId.set(userId, subscribers);
    // This is a no-op without REDIS_URL. With Redis, each API process receives
    // notifications created by the other Render instances.
    void ensureRedisSubscription();

    return () => {
        subscribers.delete(response);
        if (!subscribers.size) subscribersByUserId.delete(userId);
    };
};

const createNotification = async (
    userId,
    title,
    message,
    options = {}
) => {
    // Booking confirmations and other transactional updates must still reach
    // the in-app inbox when a user has disabled marketplace marketing/activity.
    if (options.category !== 'TRANSACTIONAL') {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { marketplaceNotifications: true }
        });

        if (!user?.marketplaceNotifications) {
            return null;
        }
    }

    const notification = await prisma.notification.create({
        data: {
            userId,
            title,
            message
        }
    });
    publishLocalNotification(notification);
    void publishCrossInstanceNotification(notification);
    return notification;
};

const createTransactionalNotification = (userId, title, message) =>
    createNotification(userId, title, message, { category: 'TRANSACTIONAL' });

const getMyNotifications = async (userId, query = {}) => {
    const { page, limit, skip } = getPagination(query, { defaultLimit: 50, maxLimit: 100 });
    const where = { userId };
    const [total, items] = await Promise.all([
        prisma.notification.count({ where }),
        prisma.notification.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    ]);
    return { items, pagination: buildPaginationMeta({ page, limit, total }) };
};

const markAsRead = async (
    notificationId,
    userId
) => {
    const notification =
        await prisma.notification.findFirst({
            where: {
                id: notificationId,
                userId
            }
        });

    if (!notification) {
        throw new Error(
            'Notification not found'
        );
    }

    return prisma.notification.update({
        where: {
            id: notificationId
        },
        data: {
            isRead: true
        }
    });
};

const markAllAsRead = async (
    userId
) => {
    return prisma.notification.updateMany({
        where: {
            userId,
            isRead: false
        },
        data: {
            isRead: true
        }
    });
};

module.exports = {
    createNotification,
    createTransactionalNotification,
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    subscribe
};
