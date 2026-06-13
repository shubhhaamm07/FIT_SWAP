const membershipPlanService = require(
    '../services/membership-plan.service'
);

const createMembershipPlan = async (
    req,
    res
) => {
    try {
        const plan =
            await membershipPlanService.createMembershipPlan(
                req.params.gymId,
                req.body
            );

        return res.status(201).json({
            success: true,
            data: plan
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const getPlansByGym = async (req, res) => {
    try {
        const plans =
            await membershipPlanService.getPlansByGym(
                req.params.gymId
            );

        return res.status(200).json({
            success: true,
            count: plans.length,
            data: plans
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const getPlanById = async (req, res) => {
    try {
        const plan =
            await membershipPlanService.getPlanById(
                req.params.planId
            );

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: plan
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const deletePlan = async (req, res) => {
    try {
        await membershipPlanService.deletePlan(
            req.params.planId
        );

        return res.status(200).json({
            success: true,
            message: 'Plan deleted successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const updatePlan = async (req, res) => {
    try {
        const updatedPlan =
            await membershipPlanService.updatePlan(
                req.params.planId,
                req.body
            );

        return res.status(200).json({
            success: true,
            data: updatedPlan
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
module.exports = {
    createMembershipPlan,
    getPlansByGym,
    getPlanById,
    deletePlan,
    updatePlan
};