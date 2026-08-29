const upiPaymentService = require('../services/upi-payment.service');

const send = (res, status, promise, fallbackMessage) => promise
    .then((data) => res.status(status).json({ success: true, data }))
    .catch((error) => res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || fallbackMessage,
    }));

const createGymMembershipRequest = (req, res) =>
    send(res, 201, upiPaymentService.createGymMembershipRequest(req.user.id, req.body.planId), 'Unable to create UPI payment request.');

const createMarketplaceRequest = (req, res) =>
    send(res, 201, upiPaymentService.createMarketplaceRequest(req.user.id, req.body.listingId), 'Unable to create UPI payment request.');

const markPaymentPaid = (req, res) =>
    send(res, 200, upiPaymentService.markPaymentPaid(req.user.id, req.params.requestId, req.body.utr), 'Unable to record payment reference.');

const confirmPaymentReceived = (req, res) =>
    send(res, 200, upiPaymentService.confirmPaymentReceived(req.user.id, req.params.requestId), 'Unable to confirm payment.');

const approveMarketplaceTransfer = (req, res) =>
    send(res, 200, upiPaymentService.approveMarketplaceTransfer(req.user.id, req.params.requestId), 'Unable to approve transfer.');

const rejectPayment = (req, res) =>
    send(res, 200, upiPaymentService.rejectPayment(req.user.id, req.params.requestId, req.body.reason), 'Unable to reject payment request.');

const cancelPaymentRequest = (req, res) =>
    send(res, 200, upiPaymentService.cancelPaymentRequest(req.user.id, req.params.requestId), 'Unable to cancel payment request.');

const getMyRequests = (req, res) =>
    send(res, 200, upiPaymentService.getMyUpiRequests(req.user.id), 'Unable to load UPI payment requests.');

const getGymApprovalRequests = (req, res) =>
    send(res, 200, upiPaymentService.getGymApprovalRequests(req.user.id), 'Unable to load gym approval requests.');

module.exports = {
    createGymMembershipRequest,
    createMarketplaceRequest,
    markPaymentPaid,
    confirmPaymentReceived,
    approveMarketplaceTransfer,
    rejectPayment,
    cancelPaymentRequest,
    getMyRequests,
    getGymApprovalRequests,
};
