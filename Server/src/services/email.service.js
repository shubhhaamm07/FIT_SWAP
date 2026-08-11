const nodemailer = require('nodemailer');

const emailError = (message, statusCode = 503) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const getTransport = () => {
    const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM'];
    if (required.some((key) => !process.env[key])) {
        throw emailError('Email delivery is not configured. Add SMTP settings to the server environment.');
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        }
    });
};

const assertEmailConfigured = () => {
    getTransport();
};

const sendEmail = async ({ to, subject, html, text }) => {
    try {
        await getTransport().sendMail({
            from: process.env.SMTP_FROM,
            to,
            subject,
            text,
            html
        });
    } catch (error) {
        if (error.statusCode) throw error;
        throw emailError('FitSwap could not send the email. Check the SMTP configuration and try again.', 502);
    }
};

module.exports = { sendEmail, assertEmailConfigured };
