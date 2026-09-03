const { generateDietPlan } = require("../services/diet-planner.service");

const generatePlan = async (req, res, next) => {
    try {
        const plan = await generateDietPlan(req.body);

        return res.status(200).json({
            success: true,
            data: plan,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    generateDietPlan: generatePlan,
};
