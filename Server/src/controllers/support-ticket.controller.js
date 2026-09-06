const { pipeline } = require('node:stream/promises');
const supportTicketService = require('../services/support-ticket.service');

const sendError = (res, error, fallback = 'Unable to complete the support request.') => {
    const status = Number(error.statusCode) || 500;
    if (status >= 500) {
        console.error('Support ticket request failed', { name: error.name, message: error.message });
    }
    return res.status(status).json({
        success: false,
        message: error.statusCode ? error.message : fallback
    });
};

const createTicket = async (req, res) => {
    try {
        const data = await supportTicketService.createTicket({ actor: req.user, input: req.body });
        return res.status(201).json({ success: true, message: 'Support ticket created.', data });
    } catch (error) {
        return sendError(res, error, 'Unable to create the support ticket.');
    }
};

const listTickets = async (req, res) => {
    try {
        const data = await supportTicketService.listTickets({ actor: req.user, filters: req.query });
        return res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        return sendError(res, error, 'Unable to load support tickets.');
    }
};

const getTicket = async (req, res) => {
    try {
        const data = await supportTicketService.findAccessibleTicket(req.params.ticketId, req.user);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return sendError(res, error, 'Unable to load this support ticket.');
    }
};

const addMessage = async (req, res) => {
    try {
        const data = await supportTicketService.addMessage({
            ticketId: req.params.ticketId,
            actor: req.user,
            body: req.body.body,
            files: req.files || []
        });
        return res.status(201).json({ success: true, message: 'Reply sent.', data });
    } catch (error) {
        return sendError(res, error, 'Unable to send the reply.');
    }
};

const updateTicket = async (req, res) => {
    try {
        const data = await supportTicketService.updateTicket({
            ticketId: req.params.ticketId,
            actor: req.user,
            input: req.body
        });
        return res.status(200).json({ success: true, message: 'Support ticket updated.', data });
    } catch (error) {
        return sendError(res, error, 'Unable to update this support ticket.');
    }
};

const reopenTicket = async (req, res) => {
    try {
        const data = await supportTicketService.reopenTicket({ ticketId: req.params.ticketId, actor: req.user });
        return res.status(200).json({ success: true, message: 'Support ticket reopened.', data });
    } catch (error) {
        return sendError(res, error, 'Unable to reopen this support ticket.');
    }
};

const downloadAttachment = async (req, res) => {
    try {
        const { attachment, body } = await supportTicketService.downloadAttachment({
            ticketId: req.params.ticketId,
            attachmentId: req.params.attachmentId,
            actor: req.user
        });
        const safeName = attachment.fileName.replace(/[\\\r\n"]/g, '_');
        res.set({
            'Content-Type': attachment.contentType,
            'Content-Length': String(attachment.byteSize),
            'Content-Disposition': `attachment; filename="${safeName}"`,
            'Cache-Control': 'private, no-store',
            'X-Content-Type-Options': 'nosniff',
            'Content-Security-Policy': "default-src 'none'; sandbox"
        });
        await pipeline(body, res);
    } catch (error) {
        return sendError(res, error, 'Unable to download the attachment.');
    }
};

module.exports = {
    createTicket,
    listTickets,
    getTicket,
    addMessage,
    updateTicket,
    reopenTicket,
    downloadAttachment
};
