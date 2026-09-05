// Safe metadata for owner/admin views. Storage identifiers never leave the server.
const verificationDocumentSelect = {
    id: true, fileName: true, byteSize: true, pageCount: true,
    status: true, createdAt: true, reviewedAt: true, reviewNote: true
};
module.exports = { verificationDocumentSelect };
