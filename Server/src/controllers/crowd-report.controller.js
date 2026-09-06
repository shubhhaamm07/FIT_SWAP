const crowdReportService = require('../services/crowd-report.service');

const getCrowd = async (req, res) => {
    try {
        const data = await crowdReportService.getGymCrowd(req.params.gymId);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message || 'Unable to load crowd level' });
    }
};

const reportCrowd = async (req, res) => {
    try {
        const data = await crowdReportService.reportGymCrowd(req.params.gymId, req.user.id, req.body);
        return res.status(200).json({ success: true, message: 'Crowd level shared for the next 90 minutes', data });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message || 'Unable to submit crowd level' });
    }
};

module.exports = { getCrowd, reportCrowd };
