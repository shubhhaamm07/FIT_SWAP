const express = require('express');
const multer = require('multer');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { uploadLimiter } = require('../middlewares/rateLimiter.middleware');
const supportTicketController = require('../controllers/support-ticket.controller');
const supportTicketService = require('../services/support-ticket.service');
const { MAX_ATTACHMENTS, MAX_ATTACHMENT_BYTES } = supportTicketService;

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_ATTACHMENT_BYTES, files: MAX_ATTACHMENTS, fields: 8 },
    fileFilter: (_req, file, callback) => {
        const declaredTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        callback(declaredTypes.includes(file.mimetype)
            ? null
            : Object.assign(new Error('Only PDF, JPEG, PNG, and WEBP attachments are allowed.'), { statusCode: 400 }),
        declaredTypes.includes(file.mimetype));
    }
}).array('attachments', MAX_ATTACHMENTS);

const uploadAttachments = (req, res, next) => upload(req, res, (error) => {
    if (!error) return next();
    const isOversized = error.code === 'LIMIT_FILE_SIZE';
    return res.status(isOversized ? 413 : 400).json({
        success: false,
        message: isOversized
            ? 'Each attachment must be 5 MB or smaller.'
            : `Attach up to ${MAX_ATTACHMENTS} PDF or image files.`
    });
});

// Verify the ticket before Multer accepts multipart bytes. This keeps an
// unauthorised requester from using another ticket ID as an upload target.
const verifyTicketAccess = async (req, res, next) => {
    try {
        await supportTicketService.findAccessibleTicket(req.params.ticketId, req.user, {
            select: { id: true }
        });
        return next();
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode ? error.message : 'Unable to access this support ticket.'
        });
    }
};

router.use(protect);
router.get('/support/tickets', supportTicketController.listTickets);
router.post('/support/tickets', supportTicketController.createTicket);
router.get('/support/tickets/:ticketId', supportTicketController.getTicket);
router.get('/support/tickets/:ticketId/attachments/:attachmentId', supportTicketController.downloadAttachment);
router.post('/support/tickets/:ticketId/messages', uploadLimiter, verifyTicketAccess, uploadAttachments, supportTicketController.addMessage);
router.patch('/support/tickets/:ticketId', authorize('ADMIN'), supportTicketController.updateTicket);
router.post('/support/tickets/:ticketId/reopen', supportTicketController.reopenTicket);

module.exports = router;
