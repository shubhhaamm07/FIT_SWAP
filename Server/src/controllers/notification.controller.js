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

// A signed-in browser can keep a single long-lived connection open. No token
// is placed in the URL: `protect` authenticates the existing HTTP-only cookie.
const streamMyNotifications = (req, res) => {
    res.status(200).set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no'
    });
    res.flushHeaders?.();
    res.write('event: ready\ndata: {"connected":true}\n\n');

    const unsubscribe = notificationService.subscribe(req.user.id, res);
    const keepAlive = setInterval(() => res.write(': keep-alive\n\n'), 25000);
    req.on('close', () => {
        clearInterval(keepAlive);
        unsubscribe();
    });
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
    streamMyNotifications,
    markAsRead,
    markAllAsRead
};
