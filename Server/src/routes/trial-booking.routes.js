const express = require('express');

const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const trialBookingController = require('../controllers/trial-booking.controller');

const router = express.Router();

// An approved gym's future, non-full slots are visible to signed-in members.
router.get(
    '/trial-slots',
    protect,
    authorize('USER'),
    trialBookingController.listAvailableTrialSlots
);

router.post(
    '/trial-bookings',
    protect,
    authorize('USER'),
    trialBookingController.bookTrialSlot
);

router.get(
    '/trial-bookings/my',
    protect,
    authorize('USER'),
    trialBookingController.listMyTrialBookings
);

router.patch(
    '/trial-bookings/:bookingId/cancel',
    protect,
    authorize('USER'),
    trialBookingController.cancelMyTrialBooking
);

router.post(
    '/gym-owner/trial-slots',
    protect,
    authorize('GYM_OWNER'),
    trialBookingController.createTrialSlot
);

router.get(
    '/gym-owner/trial-slots',
    protect,
    authorize('GYM_OWNER'),
    trialBookingController.listOwnerTrialSlots
);

router.patch(
    '/gym-owner/trial-slots/:slotId',
    protect,
    authorize('GYM_OWNER'),
    trialBookingController.updateTrialSlot
);

router.patch(
    '/gym-owner/trial-slots/:slotId/deactivate',
    protect,
    authorize('GYM_OWNER'),
    trialBookingController.deactivateTrialSlot
);

router.get(
    '/gym-owner/trial-bookings',
    protect,
    authorize('GYM_OWNER'),
    trialBookingController.listOwnerTrialBookings
);

router.patch(
    '/gym-owner/trial-bookings/:bookingId/status',
    protect,
    authorize('GYM_OWNER'),
    trialBookingController.updateBookingStatusByOwner
);

module.exports = router;
