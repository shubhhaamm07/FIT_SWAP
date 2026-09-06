const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const controller = require('../controllers/crowd-report.controller');

const router = express.Router();
router.get('/gyms/:gymId/crowd', protect, controller.getCrowd);
router.post('/gyms/:gymId/crowd-reports', protect, authorize('USER'), controller.reportCrowd);

module.exports = router;
