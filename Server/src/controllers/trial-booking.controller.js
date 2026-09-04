const trialBookingService = require('../services/trial-booking.service');

const sendError = (res, error, fallback) => res
    .status(error.statusCode || 500)
    .json({
        success: false,
        message: error.statusCode ? error.message : fallback
    });

const createTrialSlot = async (req, res) => {
    try {
        const data = await trialBookingService.createTrialSlot(req.user.id, req.body);
        return res.status(201).json({ success: true, message: 'Trial slot created', data });
    } catch (error) {
        return sendError(res, error, 'Unable to create trial slot');
    }
};

const listOwnerTrialSlots = async (req, res) => {
    try {
        const data = await trialBookingService.listOwnerTrialSlots(req.user.id, req.query);
        return res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        return sendError(res, error, 'Unable to load trial slots');
    }
};

const updateTrialSlot = async (req, res) => {
    try {
        const data = await trialBookingService.updateTrialSlot(req.user.id, req.params.slotId, req.body);
        return res.status(200).json({ success: true, message: 'Trial slot updated', data });
    } catch (error) {
        return sendError(res, error, 'Unable to update trial slot');
    }
};

const deactivateTrialSlot = async (req, res) => {
    try {
        const data = await trialBookingService.deactivateTrialSlot(
            req.user.id,
            req.params.slotId,
            req.body.reason
        );
        return res.status(200).json({ success: true, message: 'Trial slot deactivated', data });
    } catch (error) {
        return sendError(res, error, 'Unable to deactivate trial slot');
    }
};

const listAvailableTrialSlots = async (req, res) => {
    try {
        const data = await trialBookingService.listAvailableTrialSlots(req.query);
        return res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        return sendError(res, error, 'Unable to load available trial slots');
    }
};

const bookTrialSlot = async (req, res) => {
    try {
        const data = await trialBookingService.bookTrialSlot(req.user.id, req.body);
        return res.status(201).json({ success: true, message: 'Trial slot booked', data });
    } catch (error) {
        return sendError(res, error, 'Unable to book trial slot');
    }
};

const listMyTrialBookings = async (req, res) => {
    try {
        const data = await trialBookingService.listMyTrialBookings(req.user.id);
        return res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        return sendError(res, error, 'Unable to load trial bookings');
    }
};

const cancelMyTrialBooking = async (req, res) => {
    try {
        const data = await trialBookingService.cancelMyTrialBooking(
            req.user.id,
            req.params.bookingId,
            req.body.reason
        );
        return res.status(200).json({ success: true, message: 'Trial booking cancelled', data });
    } catch (error) {
        return sendError(res, error, 'Unable to cancel trial booking');
    }
};

const listOwnerTrialBookings = async (req, res) => {
    try {
        const data = await trialBookingService.listOwnerTrialBookings(req.user.id, req.query);
        return res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        return sendError(res, error, 'Unable to load gym trial bookings');
    }
};

const updateBookingStatusByOwner = async (req, res) => {
    try {
        const data = await trialBookingService.updateBookingStatusByOwner(
            req.user.id,
            req.params.bookingId,
            req.body.status,
            req.body.reason
        );
        return res.status(200).json({ success: true, message: 'Trial booking updated', data });
    } catch (error) {
        return sendError(res, error, 'Unable to update trial booking');
    }
};

module.exports = {
    createTrialSlot,
    listOwnerTrialSlots,
    updateTrialSlot,
    deactivateTrialSlot,
    listAvailableTrialSlots,
    bookTrialSlot,
    listMyTrialBookings,
    cancelMyTrialBooking,
    listOwnerTrialBookings,
    updateBookingStatusByOwner
};
