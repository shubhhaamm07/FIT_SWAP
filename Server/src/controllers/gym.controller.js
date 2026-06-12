const gymService = require('../services/gym.service');

const createGym = async (req, res) => {
    try {
        const gym = await gymService.createGym(
            req.body,
            req.user.userId
        );

        return res.status(201).json({
            success: true,
            data: gym
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
console.log(gymService);
module.exports = {
    createGym
};