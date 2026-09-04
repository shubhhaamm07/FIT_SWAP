const userMembershipService = require(
    '../services/user-membership.service'
);
const { getEligibilityForSeller } = require('../services/transfer-policy.service');

const purchaseMembership = async (
    req,
    res
) => {
    return res.status(410).json({
        success: false,
        message: 'Direct membership activation is unavailable. Open the gym page and complete secure online checkout.',
    });
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
const getMembershipById = async (
    req,
    res
) => {
    try {
        return res.status(200).json({
            success: true,
            data: req.membership
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const getTransferEligibility = async (req, res) => {
    try {
        const eligibility = await getEligibilityForSeller(
            req.user.id,
            req.params.membershipId
        );

        return res.status(200).json({
            success: true,
            data: eligibility
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};
const freezeMembership = async (
    req,
    res
) => {
    try {
        const membership =
            await userMembershipService.freezeMembership(
                req.params.membershipId,
                req.user.id
            );

        return res.status(200).json({
            success: true,
            message:
                'Membership frozen successfully',
            data: membership
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
const unfreezeMembership = async (
    req,
    res
) => {
    try {
        const membership =
            await userMembershipService.unfreezeMembership(
                req.params.membershipId,
                req.user.id
            );

        return res.status(200).json({
            success: true,
            message:
                'Membership unfrozen successfully',
            data: membership
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
module.exports = {
    purchaseMembership,
    getMyMemberships,
    getMembershipById,
    getTransferEligibility,
    freezeMembership,
    unfreezeMembership
};
