const {
    PutObjectCommand,
    DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { fileTypeFromBuffer } = require("file-type");
const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
];
const { v4: uuid } = require("uuid");

const prisma = require("../lib/prisma");
const s3 = require("../config/aws");

/**
 * Delete an object from S3
 */
const deleteS3Object = async (key) => {
    await s3.send(
        new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
        })
    );
};

/**
 * Upload Gym Images
 */
const uploadGymImages = async ({ gymId, userId, files }) => {

    // Verify gym exists
    const gym = await prisma.gym.findUnique({
        where: {
            id: gymId,
        },
    });

    if (!gym) {
        throw new Error("Gym not found.");
    }

    // Verify ownership
    if (gym.ownerId !== userId) {
        throw new Error(
            "You are not allowed to upload images for this gym."
        );
    }

    // Check maximum image count
    const existingCount = await prisma.gymImage.count({
        where: {
            gymId,
        },
    });

    if (existingCount + files.length > 8) {
        throw new Error("A gym can have a maximum of 8 images.");
    }

    const uploadedObjects = [];

    try {

        // Upload all files to S3
        for (const file of files) {

            // Validate actual file type (Magic Bytes)
            const detectedType = await fileTypeFromBuffer(file.buffer);

            if (!detectedType) {
                throw new Error("Unable to determine file type.");
            }

            if (
                !ALLOWED_IMAGE_TYPES.includes(detectedType.mime)
            ) {
                throw new Error(
                    "Only JPEG, PNG and WEBP images are allowed."
                );
            }

            // Use actual detected extension
            const extension = detectedType.ext;

            const key = `gyms/${gymId}/${uuid()}.${extension}`;

            await s3.send(
                new PutObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: key,
                    Body: file.buffer,
                    ContentType: detectedType.mime,
                })
            );

            uploadedObjects.push({
                key,
                url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
            });
        }

        // Save image metadata in a transaction
        const images = await prisma.$transaction(async (tx) => {

            const createdImages = [];

            for (const object of uploadedObjects) {

                const image = await tx.gymImage.create({
                    data: {
                        gymId,
                        imageKey: object.key,
                        imageUrl: object.url,
                        isPrimary:
                            existingCount === 0 &&
                            createdImages.length === 0,
                        displayOrder:
                            existingCount + createdImages.length,
                    },
                });

                createdImages.push(image);
            }

            return createdImages;
        });

        return images;

    } catch (error) {

        // Roll back uploaded S3 files if anything fails
        await Promise.all(
            uploadedObjects.map((object) =>
                deleteS3Object(object.key)
            )
        );

        throw error;
    }
};

/**
 * Delete Gym Image
 */
const deleteGymImage = async ({ gymId, imageId, userId }) => {

    const gym = await prisma.gym.findUnique({
        where: {
            id: gymId,
        },
    });

    if (!gym) {
        throw new Error("Gym not found.");
    }

    if (gym.ownerId !== userId) {
        throw new Error("Unauthorized.");
    }

    const image = await prisma.gymImage.findUnique({
        where: {
            id: imageId,
        },
    });

    if (!image || image.gymId !== gymId) {
        throw new Error("Image not found.");
    }

    // Delete from S3
    await deleteS3Object(image.imageKey);

    // Delete from DB
    await prisma.gymImage.delete({
        where: {
            id: imageId,
        },
    });

    // If deleted image was primary,
    // assign another image as primary
    if (image.isPrimary) {

        const nextImage = await prisma.gymImage.findFirst({
            where: {
                gymId,
            },
            orderBy: {
                displayOrder: "asc",
            },
        });

        if (nextImage) {

            await prisma.gymImage.update({
                where: {
                    id: nextImage.id,
                },
                data: {
                    isPrimary: true,
                },
            });

        }
    }

    return true;
};
const setPrimaryImage = async ({ gymId, imageId, userId }) => {

    // Verify gym exists
    const gym = await prisma.gym.findUnique({
        where: {
            id: gymId,
        },
    });

    if (!gym) {
        throw new Error("Gym not found.");
    }

    // Verify ownership
    if (gym.ownerId !== userId) {
        throw new Error("Unauthorized.");
    }

    // Verify image belongs to gym
    const image = await prisma.gymImage.findUnique({
        where: {
            id: imageId,
        },
    });

    if (!image || image.gymId !== gymId) {
        throw new Error("Image not found.");
    }

    await prisma.$transaction(async (tx) => {

        // Remove existing primary
        await tx.gymImage.updateMany({
            where: {
                gymId,
            },
            data: {
                isPrimary: false,
            },
        });

        // Set selected image as primary
        await tx.gymImage.update({
            where: {
                id: imageId,
            },
            data: {
                isPrimary: true,
            },
        });

    });

    return {
        message: "Primary image updated successfully.",
    };
};
const reorderGymImages = async ({ gymId, userId, images }) => {

    // Verify gym exists
    const gym = await prisma.gym.findUnique({
        where: {
            id: gymId,
        },
    });

    if (!gym) {
        throw new Error("Gym not found.");
    }

    // Verify ownership
    if (gym.ownerId !== userId) {
        throw new Error("Unauthorized.");
    }

    // Get all images for this gym
    const gymImages = await prisma.gymImage.findMany({
        where: {
            gymId,
        },
        select: {
            id: true,
        },
    });

    const validImageIds = new Set(
        gymImages.map((image) => image.id)
    );

    // Validate all image IDs
    for (const image of images) {
        if (!validImageIds.has(image.id)) {
            throw new Error(
                `Image ${image.id} does not belong to this gym.`
            );
        }
    }

    // Update display order in a transaction
    await prisma.$transaction(
        images.map((image) =>
            prisma.gymImage.update({
                where: {
                    id: image.id,
                },
                data: {
                    displayOrder: image.displayOrder,
                },
            })
        )
    );

    return {
        message: "Images reordered successfully.",
    };
};

module.exports = {
    uploadGymImages,
    deleteGymImage,
    setPrimaryImage,
    reorderGymImages,
};