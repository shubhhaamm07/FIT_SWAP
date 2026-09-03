const { generateDietPlan } = require("../services/diet-planner.service");

const generatePlan = async (req, res, next) => {
    try {
        const plan = await generateDietPlan(req.body);

        return res.status(200).json({
            success: true,
            data: plan,
        });
    } catch (error) {
        // Gemini failures are converted to safe, user-facing messages in the
        // service. Return those messages instead of the application's generic
        // 5xx response, while keeping provider details and API keys private.
        if (String(error.code || "").startsWith("GEMINI_")) {
            return res.status(error.status || 502).json({
                success: false,
                code: error.code,
                message: error.message,
            });
        }

        next(error);
    }
};

module.exports = {
    generateDietPlan: generatePlan,
};
