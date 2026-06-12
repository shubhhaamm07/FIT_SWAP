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
const getMyGyms = async (req, res) => {
    try {
        const gyms = await gymService.getMyGyms(
            req.user.userId
        );

        return res.status(200).json({
            success: true,
            count: gyms.length,
            data: gyms
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message

        });
    }
};
const getAllGyms = async (req, res) => {
    try {
        const gyms = await gymService.getAllGyms();

        return res.status(200).json({
            success: true,
            count: gyms.length,
            data: gyms
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const updateGymStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const validStatuses = [
            'PENDING',
            'APPROVED',
            'REJECTED'
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const gym = await gymService.updateGymStatus(
            req.params.id,
            status
        );

        return res.status(200).json({
            success: true,
            message: 'Gym status updated successfully',
            data: gym
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
console.log(gymService);
module.exports = {
    createGym, getMyGyms, getAllGyms, updateGymStatus
};