const userMembershipService = require(
    '../services/user-membership.service'
);

const purchaseMembership = async (
    req,
    res
) => {
    try {
        const membership =
            await userMembershipService.purchaseMembership(
                req.user.id,
                req.body.planId
            );

        return res.status(201).json({
            success: true,
            data: membership
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
const getMyMemberships = async (
    req,
    res
) => {
    try {
        const memberships =
            await userMembershipService.getMyMemberships(
                req.user.id
            );
        return res.status(200).json({
            success: true,
            count: memberships.length,
            data: memberships
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    purchaseMembership,
    getMyMemberships
};