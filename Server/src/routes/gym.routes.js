const express = require('express');

const router = express.Router();
const {
    authorize
} = require('../middlewares/role.middleware');


const {
    protect,
    requireRecentAuthentication,
} = require('../middlewares/auth.middleware');
const { adminMutationLimiter } = require('../middlewares/rateLimiter.middleware');
const gymController = require('../controllers/gym.controller');
const gymPostController = require('../controllers/gym-post.controller');
const upload = require('../middlewares/upload.middleware');
const { uploadLimiter } = require('../middlewares/rateLimiter.middleware');
const receivePoster = (req, res, next) => upload.single('poster')(req, res, (error) => {
    if (!error) return next();
    return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
        success: false,
        message: error.code === 'LIMIT_FILE_SIZE'
            ? 'Poster must be 5 MB or smaller.'
            : 'Upload one poster image only.',
    });
});

router.get('/', gymController.getAllGyms);

router.get(
    '/my-gyms',
    protect,
    gymController.getMyGyms
);

router.get('/:id/posts', protect, gymPostController.listMember);
router.get('/:id/posts/:postId/poster', protect, gymPostController.memberPoster);
router.get('/:id/my-posts', protect, authorize('GYM_OWNER'), gymPostController.listOwner);
router.get('/:id/my-posts/:postId/poster', protect, authorize('GYM_OWNER'), gymPostController.ownerPoster);
router.post('/:id/posts', protect, authorize('GYM_OWNER'), uploadLimiter, receivePoster, gymPostController.create);
router.patch('/:id/posts/:postId', protect, authorize('GYM_OWNER'), uploadLimiter, receivePoster, gymPostController.update);
router.delete('/:id/posts/:postId', protect, authorize('GYM_OWNER'), uploadLimiter, gymPostController.remove);

router.get('/:id', gymController.getGymById);

router.post(
    '/',
    protect,
    authorize('GYM_OWNER', 'ADMIN'),
    gymController.createGym
);
router.patch(
    '/:id',
    protect,
    authorize('GYM_OWNER'),
    gymController.updateGym
);
router.patch(
    '/:id/status',
    protect,
    authorize('ADMIN'),
    requireRecentAuthentication(),
    adminMutationLimiter,
    gymController.updateGymStatus
);


module.exports = router;
