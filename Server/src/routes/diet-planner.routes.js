const express = require("express");

const { generateDietPlan } = require("../controllers/diet-planner.controller");
const { protect } = require("../middlewares/auth.middleware");
const { dietPlannerLimiter } = require("../middlewares/rateLimiter.middleware");

const router = express.Router();

router.post("/diet-planner/generate", protect, dietPlannerLimiter, generateDietPlan);

module.exports = router;
