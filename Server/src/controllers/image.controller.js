const imageService = require("../services/image.service");
const authService = require('../services/auth.service');

const uploadGymImages = async (req, res) => {

    try {

        const { gymId } = req.params;

        const userId = req.user.id;

        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please upload at least one image."
            });
        }

        const images = await imageService.uploadGymImages({
            gymId,
            userId,
            files
        });

        return res.status(201).json({
            success: true,
            message: "Images uploaded successfully.",
            data: images
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};
const deleteGymImage = async (req, res) => {

    try {

        await imageService.deleteGymImage({
            gymId: req.params.gymId,
            imageId: req.params.imageId,
            userId: req.user.id,
        });

        return res.status(200).json({
            success: true,
            message: "Image deleted successfully.",
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }

};
const setPrimaryImage = async (req, res) => {

    try {

        const result = await imageService.setPrimaryImage({
            gymId: req.params.gymId,
            imageId: req.params.imageId,
            userId: req.user.id,
        });

        return res.status(200).json({
            success: true,
            message: result.message,
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }

};
const reorderGymImages = async (req, res) => {

    try {

        const result = await imageService.reorderGymImages({
            gymId: req.params.gymId,
            userId: req.user.id,
            images: req.body.images,
        });

        return res.status(200).json({
            success: true,
            message: result.message,
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }

};

const uploadProfileImage = async (req, res) => {
    try {
        await imageService.uploadProfileImage({
            userId: req.user.id,
            file: req.file,
            type: req.params.type,
        });
        const user = await authService.getProfile(req.user.id);

        return res.status(200).json({
            success: true,
            message: `${req.params.type === 'avatar' ? 'Profile photo' : 'Cover photo'} updated successfully.`,
            data: user,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

const getProfileImage = async (req, res) => {
    try {
        const image = await imageService.getProfileImage({
            userId: req.user.id,
            type: req.params.type,
        });

        res.set({
            'Content-Type': image.ContentType || 'image/jpeg',
            'Cache-Control': 'private, max-age=3600',
        });
        image.Body.pipe(res);
    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    uploadGymImages,
    deleteGymImage,
    setPrimaryImage,
    reorderGymImages,
    uploadProfileImage,
    getProfileImage,
};
