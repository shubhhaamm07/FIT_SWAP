const adminService = require('../services/admin.service');

const getDashboard = (req, res) => {
    return res.status(200).json({
        success: true,
        message: 'Welcome Admin',
        user: req.user
    });
};
// const adminService = require('../services/admin.service');

const getPendingGyms = async (req, res) => {
    try {
        const gyms = await adminService.getPendingGyms();

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
module.exports = {
    getDashboard, getPendingGyms
};