const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuid } = require('uuid');
const prisma = require('../lib/prisma');
const s3 = require('../config/aws');
const {
    gymImageBucket,
    inspectAndRenderImage,
    uploadImageVariants,
    companionKeys,
    deleteS3Objects,
} = require('./image.service');

const KINDS = new Set(['UPDATE', 'OFFER', 'EVENT', 'WINNER']);
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const text = (value) => String(value ?? '').trim();

const readDate = (value, label) => {
    if (!text(value)) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) fail(400, `${label} must be a valid date.`);
    return date;
};

const validatePost = (input) => {
    const kind = text(input.kind).toUpperCase();
    const title = text(input.title);
    const body = text(input.body) || null;
    const winnerName = text(input.winnerName) || null;
    const price = text(input.offerPrice);
    const startsAt = readDate(input.startsAt, 'Start date');
    const endsAt = readDate(input.endsAt, 'End date');
    const publishedValue = input.isPublished;

    if (!KINDS.has(kind)) fail(400, 'Choose a valid update type.');
    if (title.length < 3 || title.length > 100) fail(400, 'Title must be 3–100 characters.');
    if (body?.length > 1000) fail(400, 'Description must be 1,000 characters or fewer.');
    if (winnerName?.length > 80) fail(400, 'Winner name must be 80 characters or fewer.');
    if (kind === 'WINNER' && !winnerName) fail(400, 'Add a winner display name.');
    if (kind === 'OFFER' && (!/^\d{1,8}(?:\.\d{1,2})?$/.test(price) || Number(price) <= 0)) {
        fail(400, 'Offer price must be a positive amount in rupees with up to two decimal places.');
    }
    if (kind === 'OFFER' && (!body || body.length < 10)) {
        fail(400, 'Describe the offer and its terms in at least 10 characters.');
    }
    if (kind === 'OFFER' && !endsAt) fail(400, 'Offers need an end date.');
    if (startsAt && endsAt && endsAt <= startsAt) fail(400, 'End date must be after start date.');
    if (endsAt && endsAt <= new Date()) fail(400, 'End date must be in the future.');
    if (publishedValue !== undefined && ![true, false, 'true', 'false'].includes(publishedValue)) {
        fail(400, 'Publish setting must be true or false.');
    }
    if (kind === 'WINNER' && (publishedValue === true || publishedValue === 'true')
        && input.winnerConsent !== true && input.winnerConsent !== 'true') {
        fail(400, 'Confirm that the winner agreed to their display name being published.');
    }

    return {
        kind,
        title,
        body,
        winnerName: kind === 'WINNER' ? winnerName : null,
        offerPrice: kind === 'OFFER' ? price : null,
        startsAt,
        endsAt,
        isPublished: publishedValue === true || publishedValue === 'true',
    };
};

const serialize = (post, { owner = false } = {}) => {
    const { posterKey, ...data } = post;
    return {
        ...data,
        offerPrice: data.offerPrice?.toString() ?? null,
        posterUrl: posterKey
            ? `/api/gyms/${post.gymId}/${owner ? 'my-posts' : 'posts'}/${post.id}/poster`
            : null,
    };
};

const ownerGym = async (gymId, ownerId) => {
    const gym = await prisma.gym.findUnique({ where: { id: gymId }, select: { id: true, ownerId: true } });
    if (!gym) fail(404, 'Gym not found.');
    if (gym.ownerId !== ownerId) fail(403, 'You do not manage this gym.');
    return gym;
};

const requireCurrentMember = async (gymId, userId) => {
    if (!userId) fail(401, 'Sign in to view gym updates.');
    const now = new Date();
    const membership = await prisma.userMembership.findFirst({
        where: {
            userId,
            status: 'ACTIVE',
            startDate: { lte: now },
            endDate: { gt: now },
            plan: { gymId },
        },
        select: { id: true },
    });
    if (!membership) fail(403, 'An active membership at this gym is required.');
};

const publicWhere = (gymId, now = new Date()) => ({
    gymId,
    isPublished: true,
    gym: { status: 'APPROVED' },
    AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
    ],
});

const listMember = async (gymId, userId) => {
    await requireCurrentMember(gymId, userId);
    const posts = await prisma.gymPost.findMany({
        where: publicWhere(gymId),
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 12,
    });
    return posts.map((post) => serialize(post));
};

const listOwner = async (gymId, ownerId) => {
    await ownerGym(gymId, ownerId);
    const posts = await prisma.gymPost.findMany({
        where: { gymId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 40,
    });
    return posts.map((post) => serialize(post, { owner: true }));
};

const uploadPoster = async (gymId, file) => {
    if (!file) return null;
    const rendered = await inspectAndRenderImage(file);
    return uploadImageVariants({
        bucket: gymImageBucket(),
        baseKey: `gyms/${gymId}/posts/${uuid()}`,
        rendered,
    });
};

const discardPoster = async (key) => {
    if (!key) return;
    await deleteS3Objects(companionKeys(key), gymImageBucket());
};

const create = async (gymId, ownerId, input, file) => {
    await ownerGym(gymId, ownerId);
    const data = validatePost(input);
    if (await prisma.gymPost.count({ where: { gymId } }) >= 40) {
        fail(409, 'This gym has reached the 40-update limit. Remove an older update first.');
    }
    const poster = await uploadPoster(gymId, file);
    try {
        const post = await prisma.gymPost.create({ data: { gymId, ...data, posterKey: poster?.key || null } });
        return serialize(post, { owner: true });
    } catch (error) {
        if (poster) await discardPoster(poster.key).catch(() => {});
        throw error;
    }
};

const update = async (gymId, postId, ownerId, input, file) => {
    await ownerGym(gymId, ownerId);
    const existing = await prisma.gymPost.findFirst({ where: { id: postId, gymId } });
    if (!existing) fail(404, 'Gym update not found.');
    const data = validatePost(input);
    const removePoster = input.removePoster === true || input.removePoster === 'true';
    if (file && removePoster) fail(400, 'Choose either a replacement poster or removal.');
    const poster = await uploadPoster(gymId, file);
    try {
        const post = await prisma.gymPost.update({
            where: { id: postId, gymId },
            data: {
                ...data,
                ...((poster || removePoster) ? { posterKey: poster?.key || null } : {}),
            },
        });
        if ((poster || removePoster) && existing.posterKey) {
            await discardPoster(existing.posterKey).catch((error) => console.error('Gym poster cleanup failed', error));
        }
        return serialize(post, { owner: true });
    } catch (error) {
        if (poster) await discardPoster(poster.key).catch(() => {});
        throw error;
    }
};

const remove = async (gymId, postId, ownerId) => {
    await ownerGym(gymId, ownerId);
    const existing = await prisma.gymPost.findFirst({ where: { id: postId, gymId } });
    if (!existing) fail(404, 'Gym update not found.');
    await prisma.gymPost.delete({ where: { id: postId, gymId } });
    if (existing.posterKey) {
        await discardPoster(existing.posterKey).catch((error) => console.error('Gym poster cleanup failed', error));
    }
};

const getPoster = async (gymId, postId, { ownerId = null, userId = null } = {}) => {
    if (ownerId) await ownerGym(gymId, ownerId);
    else await requireCurrentMember(gymId, userId);
    const post = await prisma.gymPost.findFirst({
        where: ownerId ? { id: postId, gymId } : { id: postId, ...publicWhere(gymId) },
        select: { posterKey: true },
    });
    if (!post?.posterKey) fail(404, 'Poster not found.');
    return s3.send(new GetObjectCommand({ Bucket: gymImageBucket(), Key: post.posterKey }));
};

module.exports = { validatePost, listMember, listOwner, create, update, remove, getPoster };
