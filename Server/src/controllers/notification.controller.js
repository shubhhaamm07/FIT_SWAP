const notificationService = require(
    '../services/notification.service'
);

const getMyNotifications = async (
    req,
    res
) => {
    try {
        const notifications =
            await notificationService.getMyNotifications(
                req.user.id
            );

        return res.status(200).json({
            success: true,
            count: notifications.length,
            data: notifications
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const markAsRead = async (
    req,
    res
) => {
    try {
        const notification =
            await notificationService.markAsRead(
                req.params.notificationId,
                req.user.id
            );

        return res.status(200).json({
            success: true,
            message:
                'Notification marked as read',
            data: notification
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const markAllAsRead = async (
    req,
    res
) => {
    try {
        const result =
            await notificationService.markAllAsRead(
                req.user.id
            );

        return res.status(200).json({
            success: true,
            message:
                'All notifications marked as read',
            data: result
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getMyNotifications,
    markAsRead,
    markAllAsRead
};