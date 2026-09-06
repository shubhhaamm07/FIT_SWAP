const prisma = require('../lib/prisma');

// Active browser tabs subscribe through the authenticated SSE route. Keeping
// the stream registry in this process avoids exposing notification data to a
// third party; the database remains the durable notification source of truth.
const subscribersByUserId = new Map();

const publishNotification = (notification) => {
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

const subscribe = (userId, response) => {
    const subscribers = subscribersByUserId.get(userId) || new Set();
    subscribers.add(response);
    subscribersByUserId.set(userId, subscribers);

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
    publishNotification(notification);
    return notification;
};

const createTransactionalNotification = (userId, title, message) =>
    createNotification(userId, title, message, { category: 'TRANSACTIONAL' });

const getMyNotifications = async (
    userId
) => {
    return prisma.notification.findMany({
        where: {
            userId
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
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
