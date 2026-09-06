const { randomUUID } = require('node:crypto');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { fileTypeFromBuffer } = require('file-type');

const prisma = require('../lib/prisma');
const s3 = require('../config/aws');

const MAX_SUBJECT_LENGTH = 140;
const MAX_MESSAGE_LENGTH = 5000;
const MAX_ATTACHMENTS = 3;
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const MAX_ATTACHMENTS_TOTAL_BYTES = 10 * 1024 * 1024;

const CATEGORIES = new Set(['TRANSFER', 'PAYMENT', 'MEMBERSHIP', 'GYM', 'LISTING', 'ACCOUNT', 'TECHNICAL', 'OTHER']);
const PRIORITIES = new Set(['LOW', 'NORMAL', 'HIGH', 'URGENT']);
const STATUSES = new Set(['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED']);
const RELATED_TYPES = new Set(['NONE', 'MEMBERSHIP', 'TRANSFER', 'PAYMENT', 'LISTING', 'GYM', 'TRIAL']);
const ALLOWED_ATTACHMENTS = new Map([
    ['image/jpeg', 'jpg'],
    ['image/png', 'png'],
    ['image/webp', 'webp'],
    ['application/pdf', 'pdf']
]);

const fail = (statusCode, message) => {
    throw Object.assign(new Error(message), { statusCode });
};

const userSelect = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    role: true
};

const ticketListInclude = {
    creator: { select: userSelect },
    assignedTo: { select: userSelect },
    messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        select: { id: true, body: true, createdAt: true, senderId: true }
    },
    _count: { select: { messages: true } }
};

const ticketDetailInclude = {
    creator: { select: userSelect },
    assignedTo: { select: userSelect },
    messages: {
        orderBy: { createdAt: 'asc' },
        include: {
            sender: { select: userSelect },
            attachments: {
                select: {
                    id: true,
                    fileName: true,
                    contentType: true,
                    byteSize: true,
                    createdAt: true
                }
            }
        }
    },
    auditLogs: {
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            actorId: true,
            actorRole: true,
            action: true,
            fromStatus: true,
            toStatus: true,
            detail: true,
            createdAt: true
        }
    }
};

const normalizeText = (value, { field, min = 1, max }) => {
    const result = typeof value === 'string' ? value.trim().replace(/\r\n/g, '\n') : '';
    if (result.length < min) fail(400, `${field} must be at least ${min} character${min === 1 ? '' : 's'}.`);
    if (result.length > max) fail(400, `${field} must be ${max} characters or fewer.`);
    return result;
};

const displayName = (person) =>
    [person?.firstName, person?.lastName].filter(Boolean).join(' ') || 'FitSwap member';

const makeTicketNumber = () => `FS-SUP-${randomUUID().slice(0, 8).toUpperCase()}`;

const userScope = (actor, ownerWhere) =>
    actor.role === 'ADMIN' ? {} : ownerWhere(actor.id);

async function resolveRelatedEntity({ relatedType, relatedEntityId, actor, database = prisma }) {
    const type = relatedType || 'NONE';
    if (!RELATED_TYPES.has(type)) fail(400, 'Choose a valid related record type.');
    if (type === 'NONE' && relatedEntityId) fail(400, 'Choose a related record type for this reference.');
    if (type === 'NONE') return { relatedType: type, relatedEntityId: null, relatedLabel: null };

    const id = typeof relatedEntityId === 'string' ? relatedEntityId.trim() : '';
    if (!id) fail(400, 'Choose the record this ticket is about, or remove the related type.');

    let record;
    if (type === 'MEMBERSHIP') {
        record = await database.userMembership.findFirst({
            where: {
                id,
                ...userScope(actor, (userId) => ({
                    OR: [
                        { userId },
                        { plan: { gym: { ownerId: userId } } }
                    ]
                }))
            },
            select: { id: true, plan: { select: { name: true, gym: { select: { name: true } } } } }
        });
        if (!record) fail(404, 'That membership was not found or is not available to your account.');
        return { relatedType: type, relatedEntityId: record.id, relatedLabel: `${record.plan.name} at ${record.plan.gym.name}` };
    }

    if (type === 'TRANSFER') {
        record = await database.transferRequest.findFirst({
            where: {
                id,
                ...userScope(actor, (userId) => ({
                    OR: [
                        { buyerId: userId },
                        { listing: { sellerId: userId } },
                        { listing: { membership: { plan: { gym: { ownerId: userId } } } } }
                    ]
                }))
            },
            select: { id: true, listing: { select: { membership: { select: { plan: { select: { gym: { select: { name: true } } } } } } } } }
        });
        if (!record) fail(404, 'That transfer was not found or is not available to your account.');
        return { relatedType: type, relatedEntityId: record.id, relatedLabel: `Transfer for ${record.listing.membership.plan.gym.name}` };
    }

    if (type === 'PAYMENT') {
        record = await database.payment.findFirst({
            where: {
                id,
                ...userScope(actor, (userId) => ({
                    OR: [
                        { buyerId: userId },
                        { plan: { gym: { ownerId: userId } } },
                        { listing: { membership: { plan: { gym: { ownerId: userId } } } } }
                    ]
                }))
            },
            select: {
                id: true,
                amount: true,
                currency: true,
                plan: { select: { gym: { select: { name: true } } } },
                listing: { select: { membership: { select: { plan: { select: { gym: { select: { name: true } } } } } } } }
            }
        });
        if (!record) fail(404, 'That payment was not found or is not available to your account.');
        const gymName = record.plan?.gym?.name || record.listing?.membership?.plan?.gym?.name;
        return { relatedType: type, relatedEntityId: record.id, relatedLabel: `Payment${gymName ? ` for ${gymName}` : ''}` };
    }

    if (type === 'LISTING') {
        record = await database.marketplaceListing.findFirst({
            where: {
                id,
                ...userScope(actor, (userId) => ({
                    OR: [
                        { sellerId: userId },
                        { membership: { plan: { gym: { ownerId: userId } } } }
                    ]
                }))
            },
            select: { id: true, membership: { select: { plan: { select: { name: true, gym: { select: { name: true } } } } } } }
        });
        if (!record) fail(404, 'That listing was not found or is not available to your account.');
        return { relatedType: type, relatedEntityId: record.id, relatedLabel: `${record.membership.plan.name} at ${record.membership.plan.gym.name}` };
    }

    if (type === 'GYM') {
        record = await database.gym.findFirst({
            where: {
                id,
                ...userScope(actor, (userId) => actor.role === 'GYM_OWNER'
                    ? { ownerId: userId }
                    : { status: 'APPROVED' })
            },
            select: { id: true, name: true }
        });
        if (!record) fail(404, 'That gym was not found or is not available to your account.');
        return { relatedType: type, relatedEntityId: record.id, relatedLabel: record.name };
    }

    record = await database.gymTrialBooking.findFirst({
        where: {
            id,
            ...userScope(actor, (userId) => ({
                OR: [
                    { userId },
                    { slot: { gym: { ownerId: userId } } }
                ]
            }))
        },
        select: { id: true, bookingReference: true, slot: { select: { gym: { select: { name: true } } } } }
    });
    if (!record) fail(404, 'That trial booking was not found or is not available to your account.');
    return { relatedType: type, relatedEntityId: record.id, relatedLabel: `Trial at ${record.slot.gym.name} (${record.bookingReference})` };
}

async function findAccessibleTicket(ticketId, actor, { include = ticketDetailInclude, select, database = prisma } = {}) {
    const query = {
        where: {
            id: ticketId,
            ...(actor.role === 'ADMIN' ? {} : { creatorId: actor.id })
        }
    };
    // Prisma uses `select` for scalar fields such as `id`; `include` is only
    // for relations. The upload preflight intentionally selects just the ID.
    if (select) query.select = select;
    else query.include = include;
    const ticket = await database.supportTicket.findFirst(query);
    if (!ticket) fail(404, 'Support ticket not found.');
    return ticket;
}

const validateAttachments = async (files = []) => {
    if (files.length > MAX_ATTACHMENTS) fail(400, `Attach up to ${MAX_ATTACHMENTS} files at a time.`);
    const total = files.reduce((sum, file) => sum + Number(file?.size || 0), 0);
    if (total > MAX_ATTACHMENTS_TOTAL_BYTES) fail(413, 'Attachments must total 10 MB or less.');
    const output = [];
    for (const file of files) {
        if (!file?.buffer?.length) fail(400, 'An attachment could not be read.');
        if (file.buffer.length > MAX_ATTACHMENT_BYTES) fail(413, 'Each attachment must be 5 MB or smaller.');
        const detected = await fileTypeFromBuffer(file.buffer);
        const mime = detected?.mime || (file.buffer.subarray(0, 5).toString() === '%PDF-' ? 'application/pdf' : null);
        if (!mime || !ALLOWED_ATTACHMENTS.has(mime)) {
            fail(400, 'Only PDF, JPEG, PNG, and WEBP attachments are allowed.');
        }
        const extension = ALLOWED_ATTACHMENTS.get(mime);
        const fileName = String(file.originalname || `attachment.${extension}`)
            .split(/[\\/]/).pop().replace(/[\u0000-\u001f\u007f"]/g, '').slice(0, 180) || `attachment.${extension}`;
        output.push({ buffer: file.buffer, contentType: mime, extension, fileName, byteSize: file.buffer.length });
    }
    return output;
};

async function uploadAttachments({ ticketId, files, storage = s3, bucket = process.env.AWS_SUPPORT_ATTACHMENT_BUCKET_NAME || process.env.AWS_BUCKET_NAME }) {
    if (!files.length) return [];
    if (!bucket) fail(503, 'Support attachment storage is not configured. You can still send this message without files.');
    const uploaded = [];
    try {
        for (const file of files) {
            const key = `support/tickets/${ticketId}/${randomUUID()}.${file.extension}`;
            await storage.send(new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: file.buffer,
                ContentType: file.contentType,
                ContentDisposition: `attachment; filename="${file.fileName}"`,
                ServerSideEncryption: 'AES256'
            }));
            uploaded.push({ bucket, fileKey: key, fileName: file.fileName, contentType: file.contentType, byteSize: file.byteSize });
        }
        return uploaded;
    } catch (error) {
        await Promise.allSettled(uploaded.map((file) => storage.send(new DeleteObjectCommand({ Bucket: file.bucket, Key: file.fileKey }))));
        throw error;
    }
}

const cleanupUploadedAttachments = async (files, storage = s3) => {
    await Promise.allSettled(files.map((file) => storage.send(new DeleteObjectCommand({ Bucket: file.bucket, Key: file.fileKey }))));
};

async function createTicket({ actor, input, database = prisma }) {
    const subject = normalizeText(input.subject, { field: 'Subject', min: 3, max: MAX_SUBJECT_LENGTH });
    const description = normalizeText(input.description, { field: 'Description', min: 10, max: MAX_MESSAGE_LENGTH });
    const category = String(input.category || '').toUpperCase();
    const priority = String(input.priority || 'NORMAL').toUpperCase();
    if (!CATEGORIES.has(category)) fail(400, 'Choose a valid support category.');
    if (!PRIORITIES.has(priority)) fail(400, 'Choose a valid priority.');
    const related = await resolveRelatedEntity({
        relatedType: String(input.relatedType || 'NONE').toUpperCase(),
        relatedEntityId: input.relatedEntityId,
        actor,
        database
    });
    const ticketNumber = makeTicketNumber();
    const created = await database.$transaction(async (tx) => {
        const ticket = await tx.supportTicket.create({
            data: {
                ticketNumber,
                creatorId: actor.id,
                category,
                priority,
                subject,
                ...related
            }
        });
        await tx.supportMessage.create({ data: { ticketId: ticket.id, senderId: actor.id, body: description } });
        await tx.supportTicketAuditLog.create({
            data: {
                ticketId: ticket.id,
                actorId: actor.id,
                actorRole: actor.role,
                action: 'CREATED',
                toStatus: 'OPEN',
                detail: 'Ticket created'
            }
        });
        const admins = await tx.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { id: true } });
        if (admins.length) {
            await tx.notification.createMany({
                data: admins.map((admin) => ({
                    userId: admin.id,
                    title: 'New support ticket',
                    message: `${ticketNumber}: ${subject}`
                }))
            });
        }
        return ticket;
    });
    return findAccessibleTicket(created.id, actor, { database });
}

async function listTickets({ actor, filters = {}, database = prisma }) {
    const requestedStatus = String(filters.status || '').toUpperCase();
    const requestedPriority = String(filters.priority || '').toUpperCase();
    const requestedCategory = String(filters.category || '').toUpperCase();
    if (requestedStatus && !STATUSES.has(requestedStatus)) fail(400, 'Invalid ticket status filter.');
    if (requestedPriority && !PRIORITIES.has(requestedPriority)) fail(400, 'Invalid ticket priority filter.');
    if (requestedCategory && !CATEGORIES.has(requestedCategory)) fail(400, 'Invalid ticket category filter.');
    const search = typeof filters.search === 'string' ? filters.search.trim().slice(0, 100) : '';
    const where = {
        ...(actor.role === 'ADMIN' ? {} : { creatorId: actor.id }),
        ...(requestedStatus ? { status: requestedStatus } : {}),
        ...(requestedPriority ? { priority: requestedPriority } : {}),
        ...(requestedCategory ? { category: requestedCategory } : {}),
        ...(actor.role === 'ADMIN' && filters.assigned === 'me' ? { assignedToId: actor.id } : {}),
        ...(search ? {
            OR: [
                { ticketNumber: { contains: search, mode: 'insensitive' } },
                { subject: { contains: search, mode: 'insensitive' } },
                ...(actor.role === 'ADMIN' ? [
                    { creator: { firstName: { contains: search, mode: 'insensitive' } } },
                    { creator: { lastName: { contains: search, mode: 'insensitive' } } },
                    { creator: { email: { contains: search, mode: 'insensitive' } } }
                ] : [])
            ]
        } : {})
    };
    const tickets = await database.supportTicket.findMany({
        where,
        include: ticketListInclude,
        orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
        take: Math.min(Math.max(Number(filters.limit) || 100, 1), 100)
    });
    return tickets.map((ticket) => ({
        ...ticket,
        latestMessage: ticket.messages[0] || null,
        messages: undefined
    }));
}

async function addMessage({ ticketId, actor, body, files = [], database = prisma, storage = s3 }) {
    const ticket = await findAccessibleTicket(ticketId, actor, { select: { id: true, creatorId: true, assignedToId: true, status: true }, database });
    if (ticket.status === 'CLOSED') fail(409, 'This ticket is closed. Reopen it before sending a reply.');
    if (ticket.status === 'RESOLVED') fail(409, 'This ticket is resolved. Reopen it before sending a reply.');
    const message = typeof body === 'string' ? body.trim().replace(/\r\n/g, '\n') : '';
    const attachmentMetadata = await validateAttachments(files);
    if (!message && !attachmentMetadata.length) fail(400, 'Write a reply or attach a file.');
    if (message.length > MAX_MESSAGE_LENGTH) fail(400, `Reply must be ${MAX_MESSAGE_LENGTH} characters or fewer.`);
    const uploaded = await uploadAttachments({ ticketId, files: attachmentMetadata, storage });
    const messageId = randomUUID();
    const nextStatus = actor.role === 'ADMIN'
        ? 'WAITING_FOR_USER'
        : ticket.status === 'WAITING_FOR_USER' ? 'IN_PROGRESS' : ticket.status;
    try {
        await database.$transaction(async (tx) => {
            await tx.supportMessage.create({
                data: {
                    id: messageId,
                    ticketId,
                    senderId: actor.id,
                    body: message || 'Attachment added.',
                    attachments: {
                        create: uploaded.map((file) => ({
                            bucket: file.bucket,
                            fileKey: file.fileKey,
                            fileName: file.fileName,
                            contentType: file.contentType,
                            byteSize: file.byteSize
                        }))
                    }
                }
            });
            await tx.supportTicket.update({
                where: { id: ticketId },
                data: { status: nextStatus, lastMessageAt: new Date() }
            });
            await tx.supportTicketAuditLog.create({
                data: {
                    ticketId,
                    actorId: actor.id,
                    actorRole: actor.role,
                    action: 'MESSAGE_ADDED',
                    fromStatus: ticket.status,
                    toStatus: nextStatus,
                    detail: uploaded.length ? `Reply with ${uploaded.length} attachment${uploaded.length === 1 ? '' : 's'}` : 'Reply added'
                }
            });
            const recipients = actor.role === 'ADMIN'
                ? [ticket.creatorId]
                : (await tx.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { id: true } })).map((admin) => admin.id);
            const uniqueRecipients = [...new Set(recipients)].filter((id) => id !== actor.id);
            if (uniqueRecipients.length) {
                await tx.notification.createMany({
                    data: uniqueRecipients.map((userId) => ({
                        userId,
                        title: actor.role === 'ADMIN' ? 'Support replied to your ticket' : 'New support reply',
                        message: `A new reply was added to your support ticket.`
                    }))
                });
            }
        });
    } catch (error) {
        await cleanupUploadedAttachments(uploaded, storage);
        throw error;
    }
    return findAccessibleTicket(ticketId, actor, { database });
}

async function updateTicket({ ticketId, actor, input, database = prisma }) {
    if (actor.role !== 'ADMIN') fail(403, 'Only administrators can manage support tickets.');
    const ticket = await findAccessibleTicket(ticketId, actor, { select: { id: true, creatorId: true, status: true, priority: true, assignedToId: true }, database });
    const data = {};
    const changes = [];
    if (input.status !== undefined) {
        const status = String(input.status).toUpperCase();
        if (!STATUSES.has(status)) fail(400, 'Choose a valid ticket status.');
        if (status !== ticket.status) {
            data.status = status;
            data.resolvedAt = status === 'RESOLVED' ? new Date() : null;
            data.closedAt = status === 'CLOSED' ? new Date() : null;
            changes.push({ action: 'STATUS_CHANGED', fromStatus: ticket.status, toStatus: status, detail: `Status changed to ${status.replaceAll('_', ' ').toLowerCase()}` });
        }
    }
    if (input.priority !== undefined) {
        const priority = String(input.priority).toUpperCase();
        if (!PRIORITIES.has(priority)) fail(400, 'Choose a valid ticket priority.');
        if (priority !== ticket.priority) {
            data.priority = priority;
            changes.push({ action: 'PRIORITY_CHANGED', detail: `Priority changed to ${priority.toLowerCase()}` });
        }
    }
    if (input.assignedToId !== undefined) {
        const assignedToId = input.assignedToId || null;
        if (assignedToId) {
            const assignee = await database.user.findFirst({ where: { id: assignedToId, role: 'ADMIN', isActive: true }, select: { id: true, firstName: true, lastName: true } });
            if (!assignee) fail(400, 'Choose an active administrator as the assignee.');
            if (assignedToId !== ticket.assignedToId) {
                data.assignedToId = assignedToId;
                changes.push({ action: 'ASSIGNED', detail: `Assigned to ${displayName(assignee)}` });
            }
        } else if (ticket.assignedToId) {
            data.assignedToId = null;
            changes.push({ action: 'UNASSIGNED', detail: 'Ticket assignment removed' });
        }
    }
    if (!changes.length) return findAccessibleTicket(ticketId, actor, { database });
    await database.$transaction(async (tx) => {
        await tx.supportTicket.update({ where: { id: ticketId }, data });
        await tx.supportTicketAuditLog.createMany({
            data: changes.map((change) => ({
                ticketId,
                actorId: actor.id,
                actorRole: actor.role,
                ...change
            }))
        });
        await tx.notification.create({
            data: {
                userId: ticket.creatorId,
                title: 'Support ticket updated',
                message: changes.map((change) => change.detail).join('. ')
            }
        });
    });
    return findAccessibleTicket(ticketId, actor, { database });
}

async function reopenTicket({ ticketId, actor, database = prisma }) {
    const ticket = await findAccessibleTicket(ticketId, actor, { select: { id: true, creatorId: true, assignedToId: true, status: true }, database });
    if (!['RESOLVED', 'CLOSED'].includes(ticket.status)) fail(409, 'Only resolved or closed tickets can be reopened.');
    await database.$transaction(async (tx) => {
        await tx.supportTicket.update({
            where: { id: ticketId },
            data: { status: 'OPEN', resolvedAt: null, closedAt: null, lastMessageAt: new Date() }
        });
        await tx.supportTicketAuditLog.create({
            data: {
                ticketId,
                actorId: actor.id,
                actorRole: actor.role,
                action: 'REOPENED',
                fromStatus: ticket.status,
                toStatus: 'OPEN',
                detail: 'Ticket reopened'
            }
        });
        const admins = await tx.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { id: true } });
        const recipients = actor.role === 'ADMIN'
            ? [ticket.creatorId]
            : [...new Set([ticket.assignedToId, ...admins.map((admin) => admin.id)].filter(Boolean))];
        if (recipients.length) {
            await tx.notification.createMany({
                data: recipients.filter((id) => id !== actor.id).map((userId) => ({
                    userId,
                    title: 'Support ticket reopened',
                    message: 'A support ticket needs another review.'
                }))
            });
        }
    });
    return findAccessibleTicket(ticketId, actor, { database });
}

async function downloadAttachment({ ticketId, attachmentId, actor, database = prisma, storage = s3 }) {
    await findAccessibleTicket(ticketId, actor, { select: { id: true }, database });
    const attachment = await database.supportAttachment.findFirst({
        where: { id: attachmentId, message: { ticketId } }
    });
    if (!attachment) fail(404, 'Attachment not found.');
    const response = await storage.send(new GetObjectCommand({ Bucket: attachment.bucket, Key: attachment.fileKey }));
    if (!response.Body) fail(502, 'The attachment could not be downloaded.');
    return { attachment, body: response.Body };
}

module.exports = {
    MAX_ATTACHMENTS,
    MAX_ATTACHMENT_BYTES,
    createTicket,
    listTickets,
    findAccessibleTicket,
    addMessage,
    updateTicket,
    reopenTicket,
    downloadAttachment,
    resolveRelatedEntity,
    validateAttachments
};
