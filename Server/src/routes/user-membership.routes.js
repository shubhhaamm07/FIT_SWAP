const express = require('express');

const router = express.Router();

const {
    protect
} = require('../middlewares/auth.middleware');

const userMembershipController = require(
    '../controllers/user-membership.controller'
);

router.post(
    '/memberships/purchase',
    protect,
    userMembershipController.purchaseMembership
);


router.get(
    '/memberships/my',
    protect,
    userMembershipController.getMyMemberships
);

module.exports = router;