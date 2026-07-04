const express = require('express');
const router = express.Router();

const { protect } = require(
    '../middlewares/auth.middleware'
);

const notificationController = require(
    '../controllers/notification.controller'
);

router.get(
    '/notifications',
    protect,
    notificationController.getMyNotifications
);

router.patch(
    '/notifications/:notificationId/read',
    protect,
    notificationController.markAsRead
);

router.patch(
    '/notifications/read-all',
    protect,
    notificationController.markAllAsRead
);

module.exports = router;