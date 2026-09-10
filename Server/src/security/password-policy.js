const crypto = require('crypto');

const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;
const COMMON_PASSWORDS = new Set([
    '12345678',
    '123456789',
    '1234567890',
    'password',
    'password1',
    'password123',
    'qwerty123',
    'admin123',
    'letmein',
    'welcome123',
    'fitswap123',
]);

const passwordError = (message) => {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
};

const assertStrongPassword = (password, identity = {}) => {
    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
        throw passwordError(`Password must contain at least ${MIN_PASSWORD_LENGTH} characters.`);
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
        throw passwordError(`Password must contain no more than ${MAX_PASSWORD_LENGTH} characters.`);
    }

    const characterGroups = [
        /[a-z]/.test(password),
        /[A-Z]/.test(password),
        /\d/.test(password),
        /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length;
    if (characterGroups < 3) {
        throw passwordError('Use at least three of these: lowercase letters, uppercase letters, numbers, and symbols.');
    }

    const normalized = password.toLowerCase();
    if (COMMON_PASSWORDS.has(normalized)) {
        throw passwordError('This password is too common. Choose a unique password.');
    }

    const identityParts = [
        String(identity.email || '').split('@')[0],
        identity.firstName,
        identity.lastName,
        identity.username,
    ]
        .map((value) => String(value || '').trim().toLowerCase())
        .filter((value) => value.length >= 3);
    if (identityParts.some((value) => normalized.includes(value))) {
        throw passwordError('Your password must not contain your name, username, or email address.');
    }
};

// Pwned Passwords uses k-anonymity: only the first five characters of the
// SHA-1 hash leave this server. The full password and full hash stay local.
const assertPasswordNotBreached = async (password) => {
    if (String(process.env.BREACHED_PASSWORD_CHECK_ENABLED || 'true').toLowerCase() === 'false') {
        return;
    }

    const hash = crypto.createHash('sha1').update(password, 'utf8').digest('hex').toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    try {
        const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
            headers: {
                'Add-Padding': 'true',
                'User-Agent': 'FitSwap-Password-Security',
            },
            signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Pwned Passwords returned ${response.status}`);

        const entries = (await response.text()).split(/\r?\n/);
        const match = entries.find((entry) => entry.startsWith(`${suffix}:`));
        if (match && Number(match.split(':')[1]) > 0) {
            throw passwordError('This password has appeared in a known data breach. Choose a different password.');
        }
    } catch (error) {
        if (error.statusCode === 400) throw error;
        // An external outage must not lock every user out of registration or
        // recovery. The local strength and common-password rules still apply.
        console.warn('Breached-password check unavailable', { name: error.name });
    } finally {
        clearTimeout(timeout);
    }
};

const validateNewPassword = async (password, identity) => {
    assertStrongPassword(password, identity);
    await assertPasswordNotBreached(password);
};

const passwordHashRounds = () => {
    const requested = Number(process.env.BCRYPT_ROUNDS || 12);
    return Number.isInteger(requested) ? Math.min(14, Math.max(10, requested)) : 12;
};

module.exports = {
    MIN_PASSWORD_LENGTH,
    validateNewPassword,
    passwordHashRounds,
};
