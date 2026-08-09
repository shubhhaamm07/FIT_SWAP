const adminService = require('../services/admin.service');

const getDashboard = async (req, res) => {
    try {
        const dashboard = await adminService.getAdminDashboard();
        return res.status(200).json({
            success: true,
            data: dashboard
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Unable to load the admin dashboard'
        });
    }
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

const getAnalytics = async (req, res) => {
    try {
        const analytics = await adminService.getPlatformAnalytics();
        return res.status(200).json({ success: true, data: analytics });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Unable to load platform analytics'
        });
    }
};

const getAnnouncementRecipients = async (req, res) => {
    try {
        const recipients = await adminService.getAnnouncementRecipients();
        return res.status(200).json({ success: true, count: recipients.length, data: recipients });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Unable to load announcement recipients'
        });
    }
};

const createAnnouncement = async (req, res) => {
    try {
        const announcement = await adminService.sendAnnouncement({
            adminId: req.user.id,
            ...req.body
        });
        return res.status(201).json({
            success: true,
            message: 'Announcement sent successfully',
            data: announcement
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

const getAnnouncements = async (req, res) => {
    try {
        const announcements = await adminService.getAnnouncements();
        return res.status(200).json({ success: true, count: announcements.length, data: announcements });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Unable to load announcements'
        });
    }
};

const getAuditLogs = async (req, res) => {
    try {
        const auditLogs = await adminService.getAuditLogs();
        return res.status(200).json({ success: true, count: auditLogs.length, data: auditLogs });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Unable to load audit logs'
        });
    }
};

module.exports = {
    getDashboard,
    getPendingGyms,
    getAnalytics,
    getAnnouncementRecipients,
    createAnnouncement,
    getAnnouncements,
    getAuditLogs
};
