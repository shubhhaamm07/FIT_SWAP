const multer = require("multer");

const storage = multer.memoryStorage();

// Do not trust the browser-provided MIME type here. The image service checks
// magic bytes, decoded dimensions, pixel count, and safely re-encodes the
// content before anything reaches S3.
const fileFilter = (_req, _file, cb) => cb(null, true);

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
    },
    fileFilter,
});

module.exports = upload;
