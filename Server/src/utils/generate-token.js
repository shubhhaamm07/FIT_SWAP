const jwt = require('jsonwebtoken');

const generateToken = (user, sessionId = null) => {
    return jwt.sign(
        {
            userId: user.id,
            role: user.role,
            ...(sessionId ? { sessionId } : {})
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '1d'
        }
    );
};

module.exports = generateToken;
