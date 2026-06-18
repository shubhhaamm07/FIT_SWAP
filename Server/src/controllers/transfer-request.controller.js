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
module.exports = {
    createTransferRequest,
    getMyTransferRequests,
    getIncomingTransferRequests,
    approveTransferRequest,
    rejectTransferRequest
};