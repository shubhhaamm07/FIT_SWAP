const nodemailer = require('nodemailer');

const emailError = (message, statusCode = 503) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const getBrevoApiKey = () => String(process.env.BREVO_API_KEY || '').trim();
const getEmailFrom = () => String(process.env.EMAIL_FROM || process.env.SMTP_FROM || '').trim();
const isBrevoEnabled = () => Boolean(getBrevoApiKey());

const assertBrevoConfigured = () => {
    if (!getBrevoApiKey() || !getEmailFrom()) {
        throw emailError('Email delivery is not configured. Add BREVO_API_KEY and EMAIL_FROM to the server environment.');
    }
};

const getEmailAddress = (value = '') => {
    const match = String(value).match(/<\s*([^>\s]+)\s*>/);
    return (match?.[1] || value).trim().toLowerCase();
};

const getEmailName = (value = '') => String(value)
    .replace(/<\s*[^>\s]+\s*>/, '')
    .replace(/^['"]|['"]$/g, '')
    .trim();

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
    if (isBrevoEnabled()) {
        assertBrevoConfigured();
        return;
    }

    getTransport();
};

const sendWithBrevo = async ({ to, subject, html, text }) => {
    try {
        const from = getEmailFrom();
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'api-key': getBrevoApiKey(),
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    email: getEmailAddress(from),
                    name: getEmailName(from) || 'FitSwap'
                },
                to: [{ email: to }],
                subject,
                textContent: text,
                htmlContent: html
            })
        });

        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            console.error('Brevo email delivery failed', {
                statusCode: response.status,
                code: body.code,
                message: body.message
            });
            throw emailError('FitSwap could not send the email. Check the Brevo configuration and try again.', 502);
        }

        return response.json();
    } catch (error) {
        if (error.statusCode) throw error;

        // Logs contain delivery diagnostics only—never API keys, email bodies,
        // verification tokens, or recipient addresses.
        console.error('Brevo email delivery failed', {
            name: error.name,
            statusCode: error.statusCode,
            message: error.message
        });
        throw emailError('FitSwap could not send the email. Check the Brevo configuration and try again.', 502);
    }
};

const sendEmail = async ({ to, subject, html, text }) => {
    if (isBrevoEnabled()) {
        assertBrevoConfigured();
        return sendWithBrevo({ to, subject, html, text });
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
