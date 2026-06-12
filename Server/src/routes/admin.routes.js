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

module.exports = router;