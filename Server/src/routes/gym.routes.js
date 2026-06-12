const express = require('express');

const router = express.Router();

const gymController = require('../controllers/gym.controller');

const {
    protect
} = require('../middlewares/auth.middleware');

router.post(
    '/',
    protect,
    gymController.createGym
);

module.exports = router;