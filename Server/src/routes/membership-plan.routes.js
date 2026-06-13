const express = require('express');

const router = express.Router();

const {
    protect
} = require('../middlewares/auth.middleware');

const {
    authorize
} = require('../middlewares/role.middleware');

const membershipPlanController = require(
    '../controllers/membership-plan.controller'
);
const {
    verifyPlanOwnership
} = require('../middlewares/ownership.middleware');

const {
    verifyGymOwnership
} = require('../middlewares/gym-ownership.middleware');
router.post(
    '/gyms/:gymId/plans',
    protect,
    authorize('GYM_OWNER'),
    membershipPlanController.createMembershipPlan
);
router.get(
    '/gyms/:gymId/plans',
    membershipPlanController.getPlansByGym
);
router.get(
    '/plans/:planId',
    membershipPlanController.getPlanById
);

router.delete(
    '/plans/:planId',
    protect,
    authorize('GYM_OWNER'),
    verifyPlanOwnership,
    membershipPlanController.deletePlan
);
router.patch(
    '/plans/:planId',
    protect,
    authorize('GYM_OWNER'),
    verifyPlanOwnership,
    membershipPlanController.updatePlan
);
router.post(
    '/gyms/:gymId/plans',
    protect,
    authorize('GYM_OWNER'),
    verifyGymOwnership,
    membershipPlanController.createMembershipPlan
);

module.exports = router;