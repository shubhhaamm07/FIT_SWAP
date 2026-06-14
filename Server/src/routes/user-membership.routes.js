const express = require('express');

const router = express.Router();

const {
    protect
} = require('../middlewares/auth.middleware');

const userMembershipController = require(
    '../controllers/user-membership.controller'
);
const {
    verifyMembershipOwnership
} = require(
    '../middlewares/membership-ownership.middleware'
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
router.get(
    '/memberships/:membershipId',
    protect,
    verifyMembershipOwnership,
    userMembershipController.getMembershipById
);

module.exports = router;