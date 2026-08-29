const disabled = (req, res) => res.status(410).json({
    success: false,
    message: 'Online checkout is currently unavailable. Use the secure UPI payment workflow instead.',
});

module.exports = {
    createOrder: disabled,
    verifyPayment: disabled,
    createGymMembershipOrder: disabled,
    verifyGymMembershipPayment: disabled,
};
