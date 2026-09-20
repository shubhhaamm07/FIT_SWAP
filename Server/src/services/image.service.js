const {
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { fileTypeFromBuffer } = require("file-type");
const sharp = require('sharp');
const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
];
const { v4: uuid } = require("uuid");

const prisma = require("../lib/prisma");
const s3 = require("../config/aws");

const defaultBucket = () => process.env.AWS_BUCKET_NAME;
const gymImageBucket = () => process.env.AWS_GYM_IMAGE_BUCKET_NAME || defaultBucket();
const profileImageBucket = () => process.env.AWS_PROFILE_IMAGE_BUCKET_NAME || defaultBucket();

// A valid MIME type does not guarantee a safe image. These bounds stop image
// bombs before libvips allocates a very large decoded bitmap.
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 20_000_000;
const MAX_IMAGE_DIMENSION = 8_000;
const DISPLAY_IMAGE_SIZE = 1_920;
const THUMBNAIL_IMAGE_SIZE = 480;
const fail = (statusCode, message) => {
    throw Object.assign(new Error(message), { statusCode });
};

const publicImageUrl = (bucket, key) =>
    `${String(process.env.AWS_GYM_IMAGE_BASE_URL || `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com`).replace(/\/$/, '')}/${key}`;

const companionKeys = (imageKey) => {
    if (!String(imageKey || '').endsWith('.webp')) return [imageKey].filter(Boolean);
    const base = imageKey.slice(0, -'.webp'.length);
    return [imageKey, `${base}.thumb.webp`, `${base}.avif`];
};

const inspectAndRenderImage = async (file, { maxWidth = DISPLAY_IMAGE_SIZE, maxHeight = DISPLAY_IMAGE_SIZE } = {}) => {
    if (!file?.buffer?.length) fail(400, 'Choose an image to upload.');
    if (file.buffer.length > MAX_IMAGE_BYTES) fail(413, 'Each image must be 5 MB or smaller.');

    const detectedType = await fileTypeFromBuffer(file.buffer);
    if (!detectedType || !ALLOWED_IMAGE_TYPES.includes(detectedType.mime)) {
        fail(400, 'Only genuine JPEG, PNG, and WEBP images are allowed.');
    }

    let metadata;
    try {
        metadata = await sharp(file.buffer, { limitInputPixels: MAX_IMAGE_PIXELS, failOn: 'error' }).metadata();
    } catch (_error) {
        fail(400, 'This image is damaged or exceeds the safe image-size limit.');
    }
    const width = Number(metadata.width);
    const height = Number(metadata.height);
    const pageCount = Number(metadata.pages || 1);
    if (!width || !height || width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION || (width * height * pageCount) > MAX_IMAGE_PIXELS) {
        fail(413, 'Use an image no larger than 8,000 pixels per side or 20 megapixels.');
    }

    try {
        const source = sharp(file.buffer, { limitInputPixels: MAX_IMAGE_PIXELS, failOn: 'error' }).rotate();
        const [webp, avif, thumbnail] = await Promise.all([
            source.clone().resize({ width: maxWidth, height: maxHeight, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82, effort: 4 }).toBuffer(),
            source.clone().resize({ width: maxWidth, height: maxHeight, fit: 'inside', withoutEnlargement: true }).avif({ quality: 52, effort: 4 }).toBuffer(),
            source.clone().resize({ width: THUMBNAIL_IMAGE_SIZE, height: THUMBNAIL_IMAGE_SIZE, fit: 'cover', position: 'attention', withoutEnlargement: true }).webp({ quality: 72, effort: 4 }).toBuffer(),
        ]);
        return { width, height, webp, avif, thumbnail };
    } catch (_error) {
        fail(400, 'This image could not be safely processed. Try another JPEG, PNG, or WEBP image.');
    }
};

/**
 * Delete an object from S3
 */
const deleteS3Object = async (key, bucket = defaultBucket()) => {
    await s3.send(
        new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
        })
    );
};

const deleteS3Objects = async (keys, bucket) => {
    await Promise.all(keys.filter(Boolean).map((key) => deleteS3Object(key, bucket)));
};

const uploadImageVariants = async ({ bucket, baseKey, rendered }) => {
    const objects = [
        { key: `${baseKey}.webp`, body: rendered.webp, contentType: 'image/webp' },
        { key: `${baseKey}.thumb.webp`, body: rendered.thumbnail, contentType: 'image/webp' },
        { key: `${baseKey}.avif`, body: rendered.avif, contentType: 'image/avif' },
    ];
    const createdKeys = [];
    try {
        for (const object of objects) {
            await s3.send(new PutObjectCommand({
                Bucket: bucket,
                Key: object.key,
                Body: object.body,
                ContentType: object.contentType,
                CacheControl: 'public, max-age=31536000, immutable',
                ServerSideEncryption: 'AES256',
            }));
            createdKeys.push(object.key);
        }
        return { key: objects[0].key, thumbnailKey: objects[1].key, avifKey: objects[2].key };
    } catch (error) {
        await Promise.allSettled(createdKeys.map((key) => deleteS3Object(key, bucket)));
        throw error;
    }
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

            const rendered = await inspectAndRenderImage(file);
            const baseKey = `gyms/${gymId}/${uuid()}`;
            const uploaded = await uploadImageVariants({
                bucket: gymImageBucket(), baseKey, rendered,
            });

            uploadedObjects.push({
                ...uploaded,
                url: publicImageUrl(gymImageBucket(), uploaded.key),
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
            uploadedObjects.flatMap((object) => companionKeys(object.key)).map((key) => deleteS3Object(key, gymImageBucket()))
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

    // Commit the database change first. If object cleanup later fails, the
    // result is an orphan that can be safely retried—not a broken image row
    // visible to members.
    await prisma.$transaction(async (tx) => {
        await tx.gymImage.delete({ where: { id: imageId } });
        if (!image.isPrimary) return;
        const nextImage = await tx.gymImage.findFirst({ where: { gymId }, orderBy: { displayOrder: 'asc' } });
        if (nextImage) await tx.gymImage.update({ where: { id: nextImage.id }, data: { isPrimary: true } });
    });

    try {
        await deleteS3Objects(companionKeys(image.imageKey), gymImageBucket());
    } catch (error) {
        console.error('Gym image object cleanup failed after database deletion', { imageId, message: error.message });
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

    if (!Array.isArray(images) || images.length !== gymImages.length) {
        fail(400, 'Include every current gym image exactly once when changing their order.');
    }
    const validImageIds = new Set(gymImages.map((image) => image.id));
    const submittedIds = images.map((image) => image?.id);
    const submittedOrders = images.map((image) => image?.displayOrder);
    if (new Set(submittedIds).size !== gymImages.length || submittedIds.some((id) => !validImageIds.has(id))) {
        fail(400, 'Each gym image must appear exactly once in the reorder request.');
    }
    if (new Set(submittedOrders).size !== gymImages.length || submittedOrders.some((order) => !Number.isInteger(order) || order < 0 || order >= gymImages.length)) {
        fail(400, 'Use one unique display order from 0 through the number of images minus one.');
    }

    // Update display order in a transaction
    await prisma.$transaction(async (tx) => {
        const currentIds = (await tx.gymImage.findMany({ where: { gymId }, select: { id: true } })).map((image) => image.id);
        if (currentIds.length !== gymImages.length || currentIds.some((id) => !validImageIds.has(id))) {
            fail(409, 'The gym images changed. Refresh before setting their order.');
        }
        await Promise.all(images.map((image) => tx.gymImage.update({ where: { id: image.id }, data: { displayOrder: image.displayOrder } })));
    });

    return {
        message: "Images reordered successfully.",
    };
};

const uploadProfileImage = async ({ userId, file, type }) => {
    if (!file) {
        throw new Error('Please select an image to upload.');
    }

    if (!['avatar', 'cover'].includes(type)) {
        throw new Error('Invalid profile image type.');
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            avatarKey: true,
            coverKey: true
        }
    });

    if (!user) {
        throw new Error('User not found.');
    }

    const rendered = await inspectAndRenderImage(file, {
        maxWidth: type === 'avatar' ? 1_024 : 1_920,
        maxHeight: type === 'avatar' ? 1_024 : 1_080,
    });
    const baseKey = `profile-media/${userId}/${type}/${uuid()}`;
    const keyField = type === 'avatar' ? 'avatarKey' : 'coverKey';
    const previousKey = type === 'avatar' ? user.avatarKey : user.coverKey;

    try {
        const uploaded = await uploadImageVariants({ bucket: profileImageBucket(), baseKey, rendered });
        const key = uploaded.key;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                [keyField]: key,
            },
            select: {
                avatarKey: true,
                coverKey: true
            }
        });

        if (previousKey) {
            try {
                await deleteS3Objects(companionKeys(previousKey), profileImageBucket());
            } catch (error) {
                console.error('Unable to remove the previous profile image', error.message);
            }
        }

        return updatedUser;
    } catch (error) {
        try {
            await deleteS3Objects(companionKeys(`${baseKey}.webp`), profileImageBucket());
        } catch (_) {
            // The upload did not complete, so there may be no object to remove.
        }
        throw error;
    }
};

const getProfileImage = async ({ userId, type, variant = 'default' }) => {
    if (!['avatar', 'cover'].includes(type)) {
        throw new Error('Invalid profile image type.');
    }
    if (!['default', 'thumbnail', 'avif'].includes(variant)) {
        fail(400, 'Invalid profile image variant.');
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            avatarKey: true,
            coverKey: true,
        }
    });

    const sourceKey = type === 'avatar' ? user?.avatarKey : user?.coverKey;
    const key = variant === 'thumbnail' && String(sourceKey || '').endsWith('.webp')
        ? `${sourceKey.slice(0, -'.webp'.length)}.thumb.webp`
        : variant === 'avif' && String(sourceKey || '').endsWith('.webp')
            ? `${sourceKey.slice(0, -'.webp'.length)}.avif`
            : sourceKey;
    if (!key) {
        throw new Error('Profile image not found.');
    }

    return s3.send(new GetObjectCommand({
        Bucket: profileImageBucket(),
        Key: key,
    }));
};

module.exports = {
    uploadGymImages,
    deleteGymImage,
    setPrimaryImage,
    reorderGymImages,
    uploadProfileImage,
    getProfileImage,
};
