const gymService = require('../services/gym.service');
const adminService = require('../services/admin.service');
const gymVerification = require('../services/gym-verification.service');

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
        const { status, documentId, expectedUpdatedAt, reviewNote } = req.body || {};

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

        if (status !== 'PENDING') {
            const gym = await gymVerification.review({
                gymId: req.params.id, adminId: req.user.id, status,
                documentId, expectedUpdatedAt, reviewNote
            });
            return res.status(200).json({
                success: true, message: 'Gym review saved and owner notified.', data: gym
            });
        }

        const gym = await gymService.updateGymStatus(
            req.params.id,
            status,
            req.user.userId
        );

        try {
            await adminService.createAuditLog({
                adminId: req.user.userId,
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
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode ? error.message : 'Unable to save the gym review. Please try again.'
        });
    }
};
const updateGym = async (req, res) => {
    try {
        const gym = await gymService.updateGymByOwner(req.params.id, req.user.userId, req.body);
        return res.status(200).json({
            success: true,
            message: gym.status === 'PENDING'
                ? 'Gym profile updated. Approval is required before it appears publicly.'
                : 'Gym profile updated successfully',
            data: gym
        });
    } catch (error) {
        return res.status(error.code === 'P2025' ? 409 : 400).json({
            success: false,
            message: error.code === 'P2025'
                ? 'The gym changed while you were editing. Refresh its profile and try again.'
                : error.message
        });
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
