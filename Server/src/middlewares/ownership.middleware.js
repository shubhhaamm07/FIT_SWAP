const membershipPlanService = require(
    '../services/membership-plan.service'
);

const verifyPlanOwnership = async (
    req,
    res,
    next
) => {
    try {
        const plan =
            await membershipPlanService.getPlanWithGym(
                req.params.planId
            );

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }


        if (plan.gym.ownerId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Chl na Lode'
            });
        }

        req.plan = plan;

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    verifyPlanOwnership
};