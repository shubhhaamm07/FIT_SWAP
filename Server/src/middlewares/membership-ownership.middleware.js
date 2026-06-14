const userMembershipService = require(
    '../services/user-membership.service'
);

const verifyMembershipOwnership = async (
    req,
    res,
    next
) => {
    try {
        const membership =
            await userMembershipService.getMembershipById(
                req.params.membershipId
            );

        if (!membership) {
            return res.status(404).json({
                success: false,
                message: 'Membership not found'
            });
        }

        if (
            membership.userId !== req.user.id
        ) {
            return res.status(403).json({
                success: false,
                message:
                    'You do not own this membership'
            });
        }

        req.membership = membership;

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    verifyMembershipOwnership
};