const paymentService = require('../services/payment.service');

const createOrder = async (req, res) => {
    try {
        const order = await paymentService.createOrder(req.user.id, req.body.listingId);

        return res.status(201).json({
            success: true,
            data: order,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Unable to create payment order.',
        });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const result = await paymentService.verifyPayment(req.user.id, req.body);

        return res.status(200).json({
            success: true,
            message: result.alreadyVerified
                ? 'Payment was already verified.'
                : 'Payment verified and membership transferred successfully.',
            data: result,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || 'Unable to verify payment.',
        });
    }
};

module.exports = {
    createOrder,
    verifyPayment,
};
