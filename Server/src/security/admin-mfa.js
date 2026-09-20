const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const QRCode = require('qrcode');

const prisma = require('../lib/prisma');

const MFA_CHALLENGE_TTL_MS = 5 * 60 * 1000;
const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;
const RECOVERY_CODE_COUNT = 10;
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const mfaError = (message, statusCode = 400, code) =>
    Object.assign(new Error(message), { statusCode, code });

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const mfaEnforced = () => process.env.NODE_ENV === 'production'
    || String(process.env.ADMIN_MFA_REQUIRED || '').toLowerCase() === 'true';

const encryptionKey = () => {
    const configured = String(process.env.MFA_ENCRYPTION_KEY || '').trim();
    let key = null;
    if (/^[a-f0-9]{64}$/i.test(configured)) key = Buffer.from(configured, 'hex');
    else if (configured) {
        try { key = Buffer.from(configured, 'base64'); } catch (_) { key = null; }
    }
    if (!key || key.length !== 32) {
        throw mfaError('Administrator MFA is unavailable. Contact the deployment owner.', 503, 'MFA_CONFIGURATION_REQUIRED');
    }
    return key;
};

const encrypt = (plainText) => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `v1.${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
};

const decrypt = (value) => {
    try {
        const [version, ivValue, tagValue, cipherValue] = String(value || '').split('.');
        if (version !== 'v1' || !ivValue || !tagValue || !cipherValue) throw new Error('Malformed encrypted secret');
        const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivValue, 'base64url'));
        decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
        return Buffer.concat([decipher.update(Buffer.from(cipherValue, 'base64url')), decipher.final()]).toString('utf8');
    } catch (error) {
        if (error?.code === 'MFA_CONFIGURATION_REQUIRED') throw error;
        throw mfaError('Administrator MFA is unavailable. Contact the deployment owner.', 503, 'MFA_SECRET_UNAVAILABLE');
    }
};

const base32Encode = (buffer) => {
    let bits = '';
    for (const byte of buffer) bits += byte.toString(2).padStart(8, '0');
    let output = '';
    for (let offset = 0; offset < bits.length; offset += 5) {
        const chunk = bits.slice(offset, offset + 5).padEnd(5, '0');
        output += BASE32_ALPHABET[Number.parseInt(chunk, 2)];
    }
    return output;
};

const base32Decode = (value) => {
    const normalized = String(value || '').toUpperCase().replace(/[\s=-]/g, '');
    if (!normalized || /[^A-Z2-7]/.test(normalized)) throw mfaError('The authenticator secret is invalid.', 500);
    let bits = '';
    for (const character of normalized) bits += BASE32_ALPHABET.indexOf(character).toString(2).padStart(5, '0');
    const output = [];
    for (let offset = 0; offset + 8 <= bits.length; offset += 8) output.push(Number.parseInt(bits.slice(offset, offset + 8), 2));
    return Buffer.from(output);
};

const generateSecret = () => base32Encode(crypto.randomBytes(20));
const totpStep = (time = Date.now()) => Math.floor(time / 1000 / TOTP_STEP_SECONDS);
const totpForStep = (secret, step) => {
    const counter = Buffer.alloc(8);
    counter.writeBigUInt64BE(BigInt(step));
    const digest = crypto.createHmac('sha1', base32Decode(secret)).update(counter).digest();
    const offset = digest[digest.length - 1] & 0x0f;
    const number = (digest.readUInt32BE(offset) & 0x7fffffff) % (10 ** TOTP_DIGITS);
    return String(number).padStart(TOTP_DIGITS, '0');
};

const verifyTotp = (secret, code, time = Date.now()) => {
    const normalized = String(code || '').replace(/\s/g, '');
    if (!/^\d{6}$/.test(normalized)) return null;
    const currentStep = totpStep(time);
    for (const step of [currentStep - 1, currentStep, currentStep + 1]) {
        const expected = Buffer.from(totpForStep(secret, step));
        const provided = Buffer.from(normalized);
        if (crypto.timingSafeEqual(expected, provided)) return step;
    }
    return null;
};

const recoveryCode = () => crypto.randomBytes(8).toString('hex').toUpperCase().match(/.{1,4}/g).join('-');
const normalizeRecoveryCode = (code) => String(code || '').trim().toUpperCase();
const keyUri = (user, secret) => `otpauth://totp/${encodeURIComponent(`FitSwap:${user.email}`)}?secret=${secret}&issuer=${encodeURIComponent('FitSwap')}&algorithm=SHA1&digits=6&period=${TOTP_STEP_SECONDS}`;

const findMfaChallenge = async (challengeToken) => {
    if (typeof challengeToken !== 'string' || !/^[a-f0-9]{64}$/i.test(challengeToken)) {
        throw mfaError('Your MFA sign-in window has expired. Sign in again.', 401, 'MFA_CHALLENGE_INVALID');
    }
    const challenge = await prisma.authToken.findFirst({
        where: {
            tokenHash: hashToken(challengeToken),
            type: 'ADMIN_MFA_CHALLENGE',
            usedAt: null,
            expiresAt: { gt: new Date() },
        },
        include: { user: true },
    });
    if (!challenge || challenge.user.role !== 'ADMIN' || !challenge.user.isActive) {
        throw mfaError('Your MFA sign-in window has expired. Sign in again.', 401, 'MFA_CHALLENGE_INVALID');
    }
    return challenge;
};

const beginAdminMfa = async (user, authMethod) => {
    const setupRequired = !user.adminMfaSecretEncrypted || !user.adminMfaEnabledAt;
    if (user.role !== 'ADMIN' || (!setupRequired && !user.adminMfaSecretEncrypted)) return null;
    if (setupRequired && !mfaEnforced()) return null;
    encryptionKey();
    const token = crypto.randomBytes(32).toString('hex');
    await prisma.$transaction([
        prisma.authToken.deleteMany({ where: { userId: user.id, type: 'ADMIN_MFA_CHALLENGE' } }),
        prisma.authToken.create({
            data: {
                userId: user.id,
                tokenHash: hashToken(token),
                type: 'ADMIN_MFA_CHALLENGE',
                authMethod,
                expiresAt: new Date(Date.now() + MFA_CHALLENGE_TTL_MS),
            },
        }),
    ]);
    return { token, setupRequired };
};

const getEnrollment = async (challengeToken) => {
    const challenge = await findMfaChallenge(challengeToken);
    if (challenge.user.adminMfaSecretEncrypted && challenge.user.adminMfaEnabledAt) {
        return { setupRequired: false, email: challenge.user.email };
    }
    encryptionKey();
    const secret = challenge.user.adminMfaPendingSecretEncrypted
        ? decrypt(challenge.user.adminMfaPendingSecretEncrypted)
        : generateSecret();
    if (!challenge.user.adminMfaPendingSecretEncrypted) {
        await prisma.user.update({
            where: { id: challenge.user.id },
            data: { adminMfaPendingSecretEncrypted: encrypt(secret) },
        });
    }
    const otpauthUrl = keyUri(challenge.user, secret);
    return {
        setupRequired: true,
        email: challenge.user.email,
        manualEntryKey: secret,
        qrCodeDataUrl: await QRCode.toDataURL(otpauthUrl, { errorCorrectionLevel: 'M', margin: 1, width: 256 }),
    };
};

const verifyAdminMfa = async ({ challengeToken, code }) => {
    const challenge = await findMfaChallenge(challengeToken);
    const user = challenge.user;
    const enabled = user.adminMfaSecretEncrypted && user.adminMfaEnabledAt;
    const secret = decrypt(enabled ? user.adminMfaSecretEncrypted : user.adminMfaPendingSecretEncrypted);
    const matchedStep = verifyTotp(secret, code);
    let recoveryHash = null;

    if (!matchedStep && enabled) {
        const normalizedRecovery = normalizeRecoveryCode(code);
        for (const candidateHash of user.adminMfaRecoveryCodeHashes || []) {
            if (await bcrypt.compare(normalizedRecovery, candidateHash)) {
                recoveryHash = candidateHash;
                break;
            }
        }
    }
    if (!matchedStep && !recoveryHash) {
        throw mfaError('Enter a valid six-digit authenticator code or an unused recovery code.', 401, 'MFA_CODE_INVALID');
    }

    const recoveryCodes = enabled ? null : Array.from({ length: RECOVERY_CODE_COUNT }, recoveryCode);
    const recoveryHashes = recoveryCodes ? await Promise.all(recoveryCodes.map((item) => bcrypt.hash(item, 12))) : null;
    await prisma.$transaction(async (tx) => {
        const tokenClaim = await tx.authToken.updateMany({
            where: { id: challenge.id, usedAt: null, expiresAt: { gt: new Date() } },
            data: { usedAt: new Date() },
        });
        if (!tokenClaim.count) throw mfaError('Your MFA sign-in window has expired. Sign in again.', 401, 'MFA_CHALLENGE_INVALID');

        if (!enabled) {
            const setup = await tx.user.updateMany({
                where: { id: user.id, adminMfaPendingSecretEncrypted: { not: null }, adminMfaSecretEncrypted: null },
                data: {
                    adminMfaSecretEncrypted: user.adminMfaPendingSecretEncrypted,
                    adminMfaPendingSecretEncrypted: null,
                    adminMfaEnabledAt: new Date(),
                    adminMfaRecoveryCodeHashes: recoveryHashes,
                    ...(matchedStep ? { adminMfaLastUsedStep: BigInt(matchedStep) } : {}),
                },
            });
            if (!setup.count) throw mfaError('MFA setup changed. Sign in again to continue.', 409, 'MFA_SETUP_CHANGED');
            return;
        }

        if (matchedStep) {
            const replayGuard = await tx.user.updateMany({
                where: {
                    id: user.id,
                    OR: [{ adminMfaLastUsedStep: null }, { adminMfaLastUsedStep: { lt: BigInt(matchedStep) } }],
                },
                data: { adminMfaLastUsedStep: BigInt(matchedStep) },
            });
            if (!replayGuard.count) throw mfaError('That authenticator code was already used. Wait for a new code and try again.', 409, 'MFA_CODE_REPLAYED');
        } else {
            const consumed = await tx.user.updateMany({
                where: { id: user.id, adminMfaRecoveryCodeHashes: { has: recoveryHash } },
                data: { adminMfaRecoveryCodeHashes: { set: user.adminMfaRecoveryCodeHashes.filter((hash) => hash !== recoveryHash) } },
            });
            if (!consumed.count) throw mfaError('That recovery code has already been used. Try another code.', 409, 'MFA_RECOVERY_USED');
        }
    });

    return {
        user,
        authMethod: challenge.authMethod || 'PASSWORD',
        recoveryCodes,
    };
};

module.exports = {
    beginAdminMfa,
    getEnrollment,
    verifyAdminMfa,
    mfaEnforced,
    totpForStep,
    verifyTotp,
};
