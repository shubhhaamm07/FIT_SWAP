const { generateDietPlan, swapDietMeal } = require("../services/diet-planner.service");

const generatePlan = async (req, res, next) => {
    try {
        const plan = await generateDietPlan(req.body);

        return res.status(200).json({
            success: true,
            data: plan,
        });
    } catch (error) {
        // Provider failures are converted to safe, user-facing messages in the
        // service. Keep provider details and API keys private.
        if (String(error.code || "").startsWith("GROQ_")) {
            return res.status(error.status || 502).json({
                success: false,
                message: error.message,
            });
        }

        next(error);
    }
};

const swapMeal = async (req, res, next) => {
    try {
        const meal = await swapDietMeal(req.body);

        return res.status(200).json({
            success: true,
            data: meal,
        });
    } catch (error) {
        if (String(error.code || "").startsWith("GROQ_")) {
            return res.status(error.status || 502).json({
                success: false,
                message: error.message,
            });
        }

        next(error);
    }
};

module.exports = {
    generateDietPlan: generatePlan,
    swapMeal,
};
