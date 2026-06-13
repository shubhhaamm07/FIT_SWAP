const gymService = require('../services/gym.service');

const verifyGymOwnership = async (
    req,
    res,
    next
) => {
    try {
        const gym = await gymService.getGymById(
            req.params.gymId
        );

        if (!gym) {
            return res.status(404).json({
                success: false,
                message: 'Gym not found'
            });
        }

        if (gym.ownerId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You do not own this gym'
            });
        }

        req.gym = gym;

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    verifyGymOwnership
};