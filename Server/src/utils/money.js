const MONEY_PATTERN = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/;

// Convert an INR amount to paise without multiplying a JavaScript float.
// Prisma Decimal values expose a lossless string through toString(), while
// request values are deliberately limited to two decimal places.
const toPaise = (amount) => {
    const normalized = String(amount ?? '').trim();
    const match = MONEY_PATTERN.exec(normalized);
    if (!match) return null;

    const rupees = Number(match[1]);
    const paisaPart = (match[2] || '').padEnd(2, '0');
    const paise = (rupees * 100) + Number(paisaPart || 0);
    return Number.isSafeInteger(paise) ? paise : null;
};

const fromPaise = (paise) => {
    if (!Number.isSafeInteger(paise)) return null;
    return `${Math.trunc(paise / 100)}.${String(Math.abs(paise % 100)).padStart(2, '0')}`;
};

module.exports = { toPaise, fromPaise };
