const authService = require('../services/auth.service');
const generateToken = require('../utils/generate-token');
const register = async (req, res) => {
    try {
        const user = await authService.registerUser(req.body);

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                id: user.id,
                email: user.email
            }
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
const login = async (req, res) => {
    try {
        const user = await authService.loginUser(req.body);

        const token = generateToken(user);

        return res.status(200).json({
            success: true,
            token,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error.message
        });
    }
};
const getMe = async (req, res) => {
    return res.status(200).json({
        success: true,
        user: req.user
    });
};
module.exports = {
    register, login, getMe
};