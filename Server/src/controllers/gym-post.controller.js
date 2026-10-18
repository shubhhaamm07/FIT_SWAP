const { pipeline } = require('node:stream/promises');
const service = require('../services/gym-post.service');

const respond = (work) => async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    try {
        const result = await work(req);
        return res.status(result.status || 200).json({ success: true, data: result.data });
    } catch (error) {
        const status = error.status || error.statusCode || 500;
        if (status >= 500) console.error('Gym update request failed', error);
        return res.status(status).json({
            success: false,
            message: status >= 500 ? 'Unable to save gym updates right now.' : error.message,
        });
    }
};

const listMember = respond(async (req) => ({ data: await service.listMember(req.params.id, req.user.userId) }));
const listOwner = respond(async (req) => ({ data: await service.listOwner(req.params.id, req.user.userId) }));
const create = respond(async (req) => ({
    status: 201,
    data: await service.create(req.params.id, req.user.userId, req.body || {}, req.file),
}));
const update = respond(async (req) => ({
    data: await service.update(req.params.id, req.params.postId, req.user.userId, req.body || {}, req.file),
}));
const remove = respond(async (req) => {
    await service.remove(req.params.id, req.params.postId, req.user.userId);
    return { data: { removed: true } };
});

const poster = (owner = false) => async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    try {
        const object = await service.getPoster(req.params.id, req.params.postId,
            owner ? { ownerId: req.user.userId } : { userId: req.user.userId });
        res.set({
            'Content-Type': 'image/webp',
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': 'private, no-store',
        });
        if (object.ContentLength) res.set('Content-Length', String(object.ContentLength));
        await pipeline(object.Body, res);
    } catch (error) {
        if (res.headersSent) return res.destroy(error);
        const status = error.status || error.statusCode || (error.name === 'NoSuchKey' ? 404 : 500);
        if (status >= 500) console.error('Gym poster request failed', error);
        return res.status(status).json({ success: false, message: status >= 500 ? 'Poster unavailable.' : error.message });
    }
};

module.exports = { listMember, listOwner, create, update, remove, memberPoster: poster(), ownerPoster: poster(true) };
