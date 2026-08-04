const gymOwnerDashboardService = require('../services/gym-owner-dashboard.service');

const getDashboard = async (req, res) => {
    try {
        const dashboard = await gymOwnerDashboardService.getGymOwnerDashboard(
            req.user.userId
        );

        return res.status(200).json({
            success: true,
            data: dashboard
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Unable to load the gym owner dashboard'
        });
    }
};

const createCollectionHandler = (serviceMethod) => async (req, res) => {
    try {
        const data = await serviceMethod(req.user.userId);
        return res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Unable to load gym owner data'
        });
    }
};

const getSales = async (req, res) => {
    try {
        const data = await gymOwnerDashboardService.getGymOwnerSales(req.user.userId);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Unable to load gym owner sales data'
        });
    }
};

module.exports = {
    getDashboard,
    getMembers: createCollectionHandler(gymOwnerDashboardService.getGymOwnerMembers),
    getSales,
    getTransfers: createCollectionHandler(gymOwnerDashboardService.getGymOwnerTransfers)
};
