const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new Error("Only JPG, JPEG, PNG and WEBP images are allowed."));
    }

    cb(null, true);
};

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
    },
    fileFilter,
});

module.exports = upload;