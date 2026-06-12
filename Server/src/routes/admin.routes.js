const express = require('express');

const router = express.Router();

const adminController = require('../controllers/admin.controller');

const {
    protect
} = require('../middlewares/auth.middleware');

const {
    authorize
} = require('../middlewares/role.middleware');

router.get(
    '/dashboard',
    protect,
    authorize('ADMIN'),
    adminController.getDashboard
);
router.get(
    '/pending-gyms',
    protect,
    authorize('ADMIN'),
    adminController.getPendingGyms
);

module.exports = router;