const prisma = require('../lib/prisma');

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

    return prisma.notification.create({
        data: {
            userId,
            title,
            message
        }
    });
};

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
    getMyNotifications,
    markAsRead,
    markAllAsRead
};
