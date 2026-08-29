const platformBillingService = require('../services/platform-billing.service');

const send = (res, status, promise, fallbackMessage) => promise
    .then((data) => res.status(status).json({ success: true, data }))
    .catch((error) => res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || fallbackMessage,
    }));

const createOwnerSubscription = (req, res) =>
    send(res, 201, platformBillingService.createOwnerSubscriptionRequest(req.user.id, req.body.planCode), 'Unable to create the FitSwap Business payment request.');

const createListingBoost = (req, res) =>
    send(res, 201, platformBillingService.createListingBoostRequest(req.user.id, req.params.listingId), 'Unable to create the listing-boost payment request.');

const markPaymentPaid = (req, res) =>
    send(res, 200, platformBillingService.markPlatformPaymentPaid(req.user.id, req.params.requestId, req.body.utr), 'Unable to record the payment reference.');

const cancelPayment = (req, res) =>
    send(res, 200, platformBillingService.cancelPlatformPayment(req.user.id, req.params.requestId), 'Unable to cancel the payment request.');

const getMyBillingSummary = (req, res) =>
    send(res, 200, platformBillingService.getMyBillingSummary(req.user.id), 'Unable to load FitSwap billing.');

const getPlatformPayments = (req, res) =>
    send(res, 200, platformBillingService.getPlatformPaymentsForAdmin(), 'Unable to load platform payment requests.');

const confirmPlatformPayment = (req, res) =>
    send(res, 200, platformBillingService.completePlatformPayment(req.user.id, req.params.requestId), 'Unable to confirm platform payment.');

const rejectPlatformPayment = (req, res) =>
    send(res, 200, platformBillingService.rejectPlatformPayment(req.user.id, req.params.requestId, req.body.reason), 'Unable to reject platform payment.');

module.exports = {
    createOwnerSubscription,
    createListingBoost,
    markPaymentPaid,
    cancelPayment,
    getMyBillingSummary,
    getPlatformPayments,
    confirmPlatformPayment,
    rejectPlatformPayment,
};
