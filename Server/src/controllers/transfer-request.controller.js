const transferRequestService = require(
    '../services/transfer-request.service'
);

const createTransferRequest = async (
    req,
    res
) => {
    try {
        const transferRequest =
            await transferRequestService.createTransferRequest(
                req.user.id,
                req.body.listingId
            );

        return res.status(201).json({
            success: true,
            data: transferRequest
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
const getMyTransferRequests = async (
    req,
    res
) => {
    try {
        const requests =
            await transferRequestService.getMyTransferRequests(
                req.user.id
            );

        return res.status(200).json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const getIncomingTransferRequests = async (
    req,
    res
) => {
    try {
        const requests =
            await transferRequestService.getIncomingTransferRequests(
                req.user.id
            );

        return res.status(200).json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
const approveTransferRequest = async (
    req,
    res
) => {
    try {
        const request =
            await transferRequestService.approveTransferRequest(
                req.params.requestId,
                req.user.id
            );

        return res.status(200).json({
            success: true,
            message:
                'Transfer request approved successfully',
            data: request
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
const getGymCashApprovalRequests = async (req, res) => {
    try {
        const requests = await transferRequestService.getGymCashApprovalRequests(req.user.id);
        return res.status(200).json({ success: true, count: requests.length, data: requests });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
const approveCashTransferByGymOwner = async (req, res) => {
    try {
        const request = await transferRequestService.approveCashTransferByGymOwner(req.params.requestId, req.user.id);
        return res.status(200).json({ success: true, message: 'Cash transfer approved successfully', data: request });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
const rejectCashTransferByGymOwner = async (req, res) => {
    try {
        const request = await transferRequestService.rejectCashTransferByGymOwner(req.params.requestId, req.user.id);
        return res.status(200).json({ success: true, message: 'Cash transfer rejected successfully', data: request });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
const rejectTransferRequest = async (
    req,
    res
) => {
    try {
        const request =
            await transferRequestService.rejectTransferRequest(
                req.params.requestId,
                req.user.id
            );

        return res.status(200).json({
            success: true,
            message:
                'Transfer request rejected successfully',
            data: request
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const cancelTransferRequest = async (
    req,
    res
) => {
    try {
        const request =
            await transferRequestService.cancelTransferRequest(
                req.params.requestId,
                req.user.id
            );

        return res.status(200).json({
            success: true,
            message: 'Transfer request cancelled successfully',
            data: request
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
module.exports = {
    createTransferRequest,
    getMyTransferRequests,
    getIncomingTransferRequests,
    approveTransferRequest,
    getGymCashApprovalRequests,
    approveCashTransferByGymOwner,
    rejectCashTransferByGymOwner,
    rejectTransferRequest,
    cancelTransferRequest
};
