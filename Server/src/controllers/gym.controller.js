const gymService = require('../services/gym.service');
const adminService = require('../services/admin.service');

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

        try {
            await adminService.createAuditLog({
                adminId: req.user.id,
                action: 'GYM_STATUS_UPDATED',
                targetType: 'GYM',
                targetId: gym.id,
                summary: `${gym.name} was marked ${status.toLowerCase()}`,
                metadata: { status }
            });
        } catch (auditError) {
            // The approval succeeded; audit logging must not turn it into a failed request.
        }

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
const updateGym = async (req, res) => {
    try {
        const gym = await gymService.updateGymByOwner(req.params.id, req.user.userId, req.body);
        return res.status(200).json({
            success: true,
            message: 'Gym profile updated successfully',
            data: gym
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
const getGymById = async (req, res) => {
    try {
        const gym = await gymService.getGymById(req.params.id);
        if (!gym) {
            return res.status(404).json({
                success: false,
                message: 'Gym not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: gym
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
module.exports = {
    createGym, getMyGyms, getAllGyms, getGymById, updateGymStatus, updateGym
};
