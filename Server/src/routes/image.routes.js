const express = require("express");

const router = express.Router();

const imageController = require("../controllers/image.controller");

const upload = require("../middlewares/upload.middleware");

const { protect } = require("../middlewares/auth.middleware");
const {
    uploadLimiter,
} = require("../middlewares/rateLimiter.middleware");

router.post(
    "/gyms/:gymId/images",
    protect,
    uploadLimiter,
    upload.array("images", 8),
    imageController.uploadGymImages
);
router.delete(
    "/gyms/:gymId/images/:imageId",
    protect,
    uploadLimiter,
    imageController.deleteGymImage
);
router.patch(
    "/gyms/:gymId/images/:imageId/primary",
    protect,
    uploadLimiter,
    imageController.setPrimaryImage
);
router.patch(
    "/gyms/:gymId/images/reorder",
    protect,
    uploadLimiter,
    imageController.reorderGymImages
);

module.exports = router;