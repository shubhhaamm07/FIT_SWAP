const express = require('express');
const multer = require('multer');
const { pipeline } = require('node:stream/promises');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { uploadLimiter } = require('../middlewares/rateLimiter.middleware');
const service = require('../services/gym-verification.service');
const prisma = require('../lib/prisma');

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: service.MAX_PDF_BYTES, files: 1, fields: 0 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['application/pdf', 'application/octet-stream'].includes(file.mimetype);
        cb(allowed ? null : Object.assign(new Error('Only PDF documents are allowed.'), { statusCode: 400 }), allowed);
    }
}).single('document');

const uploadPdf = (req, res, next) => upload(req, res, (error) => {
    if (!error) return next();
    return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
        success: false,
        message: error.code === 'LIMIT_FILE_SIZE' ? 'The PDF must be 10 MB or smaller.' : 'Choose one PDF file, up to 10 MB.'
    });
});

const sendError = (res, error) => {
    if (res.headersSent) return res.destroy(error);
    if (!error.statusCode) console.error('Gym verification request failed', { code: error.name });
    return res.status(error.statusCode || 503).json({
        success: false,
        message: error.statusCode ? error.message : 'Document storage is unavailable. Please try again or contact the administrator.'
    });
};

router.post('/gyms/:gymId/verification-documents', protect, authorize('GYM_OWNER'), uploadLimiter,
    async (req, res, next) => {
        // Check ownership before buffering a potentially large multipart body.
        try {
            const gym = await prisma.gym.findFirst({
                where: { id: req.params.gymId, ownerId: req.user.id }, select: { id: true }
            });
            if (!gym) return res.status(404).json({ success: false, message: 'Gym not found.' });
            return next();
        } catch (error) { return sendError(res, error); }
    },
    uploadPdf,
    async (req, res) => {
        try {
            const data = await service.submit({ gymId: req.params.gymId, ownerId: req.user.id, file: req.file });
            return res.status(201).json({ success: true, message: 'PDF submitted for admin review.', data });
        } catch (error) { return sendError(res, error); }
    }
);

router.get('/gyms/:gymId/verification-documents/:documentId', protect, authorize('GYM_OWNER', 'ADMIN'),
    async (req, res) => {
        try {
            const result = await service.download({ ...req.params, user: req.user });
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Length': String(result.byteSize),
                'Content-Disposition': 'attachment; filename="gym-verification.pdf"',
                'Cache-Control': 'private, no-store',
                'X-Content-Type-Options': 'nosniff',
                'Content-Security-Policy': "default-src 'none'; sandbox"
            });
            await pipeline(result.body, res);
        } catch (error) { return sendError(res, error); }
    }
);
module.exports = router;
