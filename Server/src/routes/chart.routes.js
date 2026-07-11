const express = require("express");

const {
    getDashboardCharts,
} = require("../controllers/chart.controller");

const {
    protect,
} = require("../middlewares/auth.middleware");

const router = express.Router();

router.get(
    "/dashboard/charts",
    protect,
    getDashboardCharts
);

module.exports = router;