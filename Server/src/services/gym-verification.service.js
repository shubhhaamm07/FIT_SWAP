const { randomUUID, createHash } = require('node:crypto');
const { PDFDocument } = require('pdf-lib');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const prisma = require('../lib/prisma');
const s3 = require('../config/aws');
const { suspendFutureTrialOperations } = require('./gym.service');
const { verificationDocumentSelect } = require('./gym-verification-fields');

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_PDF_PAGES = 25;
const fail = (statusCode, message) => {
    throw Object.assign(new Error(message), { statusCode });
};

const validatePdf = async (file) => {
    if (!file?.buffer?.length) fail(400, 'Choose a PDF containing photos of your gym.');
    if (file.buffer.length > MAX_PDF_BYTES) fail(413, 'The PDF must be 10 MB or smaller.');
    if (!/\.pdf$/i.test(file.originalname || '') || file.buffer.subarray(0, 5).toString() !== '%PDF-') {
        fail(400, 'Upload a genuine PDF file with a .pdf extension.');
    }
    let pdf;
    try {
        pdf = await PDFDocument.load(file.buffer, { updateMetadata: false, throwOnInvalidObject: true });
    } catch (_error) {
        fail(400, 'This PDF is damaged or password-protected. Export an unlocked PDF and try again.');
    }
    const pageCount = pdf.getPageCount();
    if (pageCount < 1 || pageCount > MAX_PDF_PAGES) fail(400, 'The PDF must contain between 1 and 25 pages.');
    return {
        pageCount,
        byteSize: file.buffer.length,
        sha256: createHash('sha256').update(file.buffer).digest('hex'),
        fileName: String(file.originalname).split(/[\\/]/).pop()
            .replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 180) || 'gym-photos.pdf'
    };
};

const transact = async (database, action) => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
        try { return await database.$transaction(action, { isolationLevel: 'Serializable' }); }
        catch (error) {
            if (error.code !== 'P2034') throw error;
            if (attempt === 2) fail(409, 'The gym changed during this request. Refresh and try again.');
        }
    }
};

// Dependency injection allows upload/authorization/rollback tests without AWS.
const createGymVerificationService = ({
    database = prisma, storage = s3,
    getBucket = () => process.env.AWS_GYM_DOCUMENT_BUCKET_NAME || process.env.AWS_BUCKET_NAME
} = {}) => {
    const submit = async ({ gymId, ownerId, file }) => {
        const ownedGym = await database.gym.findFirst({ where: { id: gymId, ownerId }, select: { id: true } });
        if (!ownedGym) fail(404, 'Gym not found or you do not own this gym.');
        const metadata = await validatePdf(file);
        const bucket = getBucket();
        if (!bucket) fail(503, 'Document storage is not configured. Contact the administrator.');
        const id = randomUUID();
        const fileKey = `gym-verification/${gymId}/${id}.pdf`;
        await storage.send(new PutObjectCommand({
            Bucket: bucket, Key: fileKey, Body: file.buffer,
            ContentType: 'application/pdf',
            ContentDisposition: `attachment; filename="gym-verification-${id}.pdf"`,
            ServerSideEncryption: 'AES256'
        }));
        try {
            return await transact(database, async (tx) => {
                const gym = await tx.gym.findFirst({ where: { id: gymId, ownerId } });
                if (!gym) fail(404, 'Gym ownership changed. Refresh and try again.');
                await tx.gym.update({ where: { id: gymId }, data: { status: 'PENDING' } });
                await tx.gymVerificationDocument.updateMany({
                    where: { gymId, status: 'SUBMITTED' }, data: { status: 'SUPERSEDED' }
                });
                const document = await tx.gymVerificationDocument.create({
                    data: { id, gymId, bucket, fileKey, ...metadata },
                    select: verificationDocumentSelect
                });
                const affectedUsers = await suspendFutureTrialOperations(tx, gymId, {
                    reason: 'The gym submitted new verification photos and is awaiting approval',
                    actorId: ownerId
                });
                const admins = await tx.user.findMany({
                    where: { role: 'ADMIN', isActive: true }, select: { id: true }
                });
                await tx.notification.createMany({ data: [
                    ...admins.map((admin) => ({
                        userId: admin.id, title: 'Gym photos ready for review',
                        message: `${gym.name} submitted a gym-photo PDF. Review it in Gym Approvals.`
                    })),
                    ...affectedUsers.map((userId) => ({
                        userId, title: 'Gym trial cancelled',
                        message: `Your upcoming trial at ${gym.name} was cancelled while the gym awaits verification. Please choose another session.`
                    }))
                ] });
                return document;
            });
        } catch (error) {
            // The upload is unusable if its metadata/notifications did not commit.
            try { await storage.send(new DeleteObjectCommand({ Bucket: bucket, Key: fileKey })); }
            catch (cleanupError) { console.error('Uncommitted gym PDF cleanup failed', { documentId: id, code: cleanupError.name }); }
            throw error;
        }
    };

    const download = async ({ gymId, documentId, user }) => {
        const document = await database.gymVerificationDocument.findFirst({
            where: {
                id: documentId, gymId,
                ...(user.role === 'ADMIN' ? {} : { gym: { ownerId: user.id } })
            }
        });
        if (!document) fail(404, 'Verification document not found.');
        const object = await storage.send(new GetObjectCommand({
            Bucket: document.bucket, Key: document.fileKey
        }));
        if (!object.Body) fail(502, 'The document could not be downloaded.');
        return { body: object.Body, byteSize: document.byteSize };
    };

    const review = async ({ gymId, adminId, status, documentId, expectedUpdatedAt, reviewNote }) => {
        if (!['APPROVED', 'REJECTED'].includes(status)) fail(400, 'Choose approve or reject.');
        const note = typeof reviewNote === 'string' ? reviewNote.trim() : '';
        if (status === 'REJECTED' && !note) fail(400, 'Explain why the gym was rejected so the owner can correct it.');
        if (note.length > 1000) fail(400, 'The review note must be 1,000 characters or fewer.');
        if (!expectedUpdatedAt || Number.isNaN(new Date(expectedUpdatedAt).getTime())) {
            fail(400, 'Refresh the gym application before reviewing it.');
        }
        return transact(database, async (tx) => {
            const gym = await tx.gym.findUnique({ where: { id: gymId } });
            if (!gym) fail(404, 'Gym not found.');
            if (gym.status !== 'PENDING' || gym.updatedAt.getTime() !== new Date(expectedUpdatedAt).getTime()) {
                fail(409, 'This gym application changed or was already reviewed. Refresh before deciding.');
            }
            const document = await tx.gymVerificationDocument.findFirst({
                where: { gymId }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
            });
            if (!document || document.status !== 'SUBMITTED' || document.id !== documentId) {
                fail(409, 'A current gym-photo PDF is required. Ask the owner to submit it and refresh the queue.');
            }
            const reviewedAt = new Date();
            await tx.gymVerificationDocument.update({
                where: { id: document.id },
                data: { status, reviewedById: adminId, reviewedAt, reviewNote: note || null }
            });
            const updatedGym = await tx.gym.update({ where: { id: gymId }, data: { status } });
            if (status === 'REJECTED') {
                await suspendFutureTrialOperations(tx, gymId, { reason: note, actorId: adminId });
            }
            await tx.adminAuditLog.create({ data: {
                adminId, action: 'GYM_STATUS_UPDATED', targetType: 'GYM', targetId: gymId,
                summary: `${gym.name} was ${status.toLowerCase()} after PDF review`,
                metadata: { status, documentId: document.id, sha256: document.sha256, reviewNote: note }
            } });
            await tx.notification.create({ data: {
                userId: gym.ownerId, title: status === 'APPROVED' ? 'Gym approved' : 'Gym needs changes',
                message: status === 'APPROVED'
                    ? `${gym.name} is approved and visible to members.${note ? ` Admin note: ${note}` : ''}`
                    : `${gym.name} was rejected. Reason: ${note} Update the details and submit a new PDF from My Gyms.`
            } });
            return updatedGym;
        });
    };

    return { submit, download, review };
};

module.exports = { ...createGymVerificationService(), createGymVerificationService, validatePdf, MAX_PDF_BYTES };
