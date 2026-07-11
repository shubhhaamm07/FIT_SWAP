const chartService = require("../services/chart.service");

const getDashboardCharts = async (req, res, next) => {
    try {
        const charts = await chartService.getDashboardCharts(
            req.user.id
        );

        return res.status(200).json({
            success: true,
            data: charts,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboardCharts,
};