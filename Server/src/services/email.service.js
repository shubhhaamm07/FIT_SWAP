const nodemailer = require('nodemailer');
const { Resend } = require('resend');

const emailError = (message, statusCode = 503) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const getResendApiKey = () => String(process.env.RESEND_API_KEY || '').trim();
const getEmailFrom = () => String(process.env.EMAIL_FROM || process.env.SMTP_FROM || '').trim();
const getResendFrom = () => String(process.env.EMAIL_FROM || '').trim();
const isResendEnabled = () => Boolean(getResendApiKey());

const getResendClient = () => new Resend(getResendApiKey());

const assertResendConfigured = () => {
    if (!getResendApiKey() || !getResendFrom()) {
        throw emailError('Email delivery is not configured. Add RESEND_API_KEY and EMAIL_FROM to the server environment.');
    }
};

const getEmailAddress = (value = '') => {
    const match = String(value).match(/<\s*([^>\s]+)\s*>/);
    return (match?.[1] || value).trim().toLowerCase();
};

const assertCompatibleSender = () => {
    const smtpHost = String(process.env.SMTP_HOST || '').trim().toLowerCase();
    const smtpUser = getEmailAddress(process.env.SMTP_USER);
    const smtpFrom = getEmailAddress(process.env.SMTP_FROM);

    // Gmail only permits the authenticated account or a separately verified
    // "Send mail as" alias. Catch the most common deployment mistake before
    // attempting delivery so the Render log explains the real issue.
    if (smtpHost === 'smtp.gmail.com' && smtpUser && smtpFrom && smtpUser !== smtpFrom) {
        throw emailError(
            'Gmail rejected the sender configuration. Set SMTP_FROM to the same address as SMTP_USER, or use a verified Gmail "Send mail as" alias.',
            503
        );
    }
};

const getTransport = () => {
    const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM'];
    if (required.some((key) => !process.env[key])) {
        throw emailError('Email delivery is not configured. Add SMTP settings to the server environment.');
    }

    assertCompatibleSender();

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        // Do not leave web requests waiting indefinitely if SMTP is blocked,
        // configured with placeholders, or temporarily unavailable.
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        }
    });
};

const assertEmailConfigured = () => {
    if (isResendEnabled()) {
        assertResendConfigured();
        return;
    }

    getTransport();
};

const sendWithResend = async ({ to, subject, html, text }) => {
    try {
        const { data, error } = await getResendClient().emails.send({
            from: getResendFrom(),
            to: [to],
            subject,
            text,
            html
        });

        if (error) {
            console.error('Resend email delivery failed', {
                name: error.name,
                statusCode: error.statusCode,
                message: error.message
            });
            throw emailError('FitSwap could not send the email. Check the Resend configuration and try again.', 502);
        }

        return data;
    } catch (error) {
        if (error.statusCode) throw error;

        // Logs contain delivery diagnostics only—never API keys, email bodies,
        // verification tokens, or recipient addresses.
        console.error('Resend email delivery failed', {
            name: error.name,
            statusCode: error.statusCode,
            message: error.message
        });
        throw emailError('FitSwap could not send the email. Check the Resend configuration and try again.', 502);
    }
};

const sendEmail = async ({ to, subject, html, text }) => {
    if (isResendEnabled()) {
        assertResendConfigured();
        return sendWithResend({ to, subject, html, text });
    }

    try {
        await getTransport().sendMail({
            from: getEmailFrom(),
            to,
            subject,
            text,
            html
        });
    } catch (error) {
        if (error.statusCode) throw error;

        // Keep enough context in Render logs to diagnose SMTP failures while
        // never printing credentials, email bodies, tokens, or recipients.
        console.error('SMTP delivery failed', {
            code: error.code || 'SMTP_ERROR',
            responseCode: error.responseCode,
            command: error.command,
            message: error.message
        });
        throw emailError('FitSwap could not send the email. Check the SMTP configuration and try again.', 502);
    }
};

module.exports = { sendEmail, assertEmailConfigured };
