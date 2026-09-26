const { S3Client } = require("@aws-sdk/client-s3");

let s3;

function getS3Client() {
    if (s3) return s3;

    const region = process.env.AWS_REGION?.trim();
    if (!region) {
        throw new Error('AWS_REGION must be configured before using S3 storage.');
    }

    const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
    if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) {
        throw new Error('Both AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be configured together.');
    }

    // When no static keys are supplied, the SDK can use an IAM role instead.
    s3 = new S3Client({
        region,
        ...(accessKeyId ? { credentials: { accessKeyId, secretAccessKey } } : {}),
    });
    return s3;
}

// S3 is optional for local development and CI. Do not require credentials (or
// even a region) just to load the API; validate configuration on first use.
module.exports = {
    send(command) {
        try {
            return getS3Client().send(command);
        } catch (error) {
            return Promise.reject(error);
        }
    },
};
