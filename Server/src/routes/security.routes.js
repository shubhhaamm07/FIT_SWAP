const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const controller = require('../controllers/security.controller');

const router = express.Router();
router.get('/security/overview', protect, controller.overview);
router.post('/security/sessions/revoke-others', protect, controller.revokeOthers);
router.post('/security/sessions/:sessionId/revoke', protect, controller.revokeOne);

module.exports = router;
