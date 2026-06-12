const express = require('express');

const router = express.Router();
const {
    authorize
} = require('../middlewares/role.middleware');


const {
    protect
} = require('../middlewares/auth.middleware');
const gymController = require('../controllers/gym.controller');

router.get('/', gymController.getAllGyms);

router.get(
    '/my-gyms',
    protect,
    gymController.getMyGyms
);

router.post(
    '/',
    protect,
    gymController.createGym
);
router.patch(
    '/:id/status',
    protect,
    authorize('ADMIN'),
    gymController.updateGymStatus
);


module.exports = router;