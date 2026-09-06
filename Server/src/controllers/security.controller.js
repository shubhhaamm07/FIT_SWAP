const securityService = require('../services/security.service');

const overview = async (req, res) => {
    try {
        const data = await securityService.getSecurityOverview(req.user.id, req.user.sessionId);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Unable to load account security data' });
    }
};

const revokeOne = async (req, res) => {
    try {
        const revoked = await securityService.revokeSession(req.params.sessionId, req.user.id, 'SIGNED_OUT_BY_USER');
        if (!revoked) return res.status(404).json({ success: false, message: 'Active session was not found' });
        return res.status(200).json({ success: true, message: 'Device signed out successfully' });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message || 'Unable to sign out this device' });
    }
};

const revokeOthers = async (req, res) => {
    try {
        const result = await securityService.revokeOtherSessions(req.user.id, req.user.sessionId);
        return res.status(200).json({ success: true, message: `${result.count} other device${result.count === 1 ? '' : 's'} signed out`, data: { count: result.count } });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message || 'Unable to sign out other devices' });
    }
};

module.exports = { overview, revokeOne, revokeOthers };
