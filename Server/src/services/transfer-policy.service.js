const prisma = require('../lib/prisma');

const DAY_MS = 24 * 60 * 60 * 1000;
const TERMINAL_LISTING_STATUSES = new Set(['SOLD', 'CANCELLED', 'EXPIRED']);

const policyError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const normaliseBoolean = (value, fallback) => {
    if (value === undefined) return fallback;
    if (value === true || value === false) return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    throw policyError('A transfer policy switch must be true or false.');
};

const normaliseOptionalInteger = (value, field) => {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
        throw policyError(`${field} must be a whole number of at least 1.`);
    }
    return parsed;
};

const normaliseMinimumDays = (value, fallback = 30) => {
    if (value === undefined || value === null || value === '') return fallback;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) {
        throw policyError('Minimum remaining days must be a whole number of 0 or more.');
    }
    return parsed;
};

const getTransferPolicy = (plan = {}) => ({
    transferable: Boolean(plan.transferable),
    minimumTransferDays: Number(plan.minimumTransferDays ?? 30),
    maximumTransfers: plan.maximumTransfers == null ? null : Number(plan.maximumTransfers),
    requiresGymApproval: plan.requiresGymApproval !== false,
    allowOnlinePayment: plan.allowOnlinePayment !== false,
    allowCashTransfer: Boolean(plan.allowCashTransfer),
    transferFee: Number(plan.transferFee || 0),
});

const normaliseTransferPolicyInput = (input = {}, { partial = false } = {}) => {
    const policy = {};
    const has = (field) => Object.prototype.hasOwnProperty.call(input, field);

    if (!partial || has('transferable')) policy.transferable = normaliseBoolean(input.transferable, true);
    if (!partial || has('minimumTransferDays')) policy.minimumTransferDays = normaliseMinimumDays(input.minimumTransferDays);
    if (!partial || has('maximumTransfers')) policy.maximumTransfers = normaliseOptionalInteger(input.maximumTransfers, 'Maximum transfers');
    if (!partial || has('requiresGymApproval')) policy.requiresGymApproval = normaliseBoolean(input.requiresGymApproval, true);
    if (!partial || has('allowOnlinePayment')) policy.allowOnlinePayment = normaliseBoolean(input.allowOnlinePayment, true);
    if (!partial || has('allowCashTransfer')) policy.allowCashTransfer = normaliseBoolean(input.allowCashTransfer, false);

    if (policy.allowOnlinePayment === false && policy.allowCashTransfer === false && policy.transferable !== false) {
        throw policyError('Enable online payment or cash transfer for a transferable plan.');
    }

    return policy;
};

const getDaysRemaining = (endDate, now = new Date()) =>
    Math.max(0, Math.ceil((new Date(endDate).getTime() - now.getTime()) / DAY_MS));

const hasBlockingListing = (listing) =>
    Boolean(listing && !listing.deletedAt && !TERMINAL_LISTING_STATUSES.has(listing.status));

const evaluateMembershipEligibility = (membership, { sellerId, allowCurrentListing = false, paymentMethod } = {}) => {
    if (!membership) {
        return { eligible: false, reasons: ['Membership not found.'], checks: {}, policy: null, daysRemaining: 0 };
    }

    const policy = getTransferPolicy(membership.plan);
    const daysRemaining = getDaysRemaining(membership.endDate);
    const checks = {
        owner: !sellerId || membership.userId === sellerId,
        active: membership.status === 'ACTIVE',
        notExpired: new Date(membership.endDate) > new Date(),
        gymApproved: membership.plan?.gym?.status === 'APPROVED',
        transferable: policy.transferable,
        minimumRemainingDays: daysRemaining >= policy.minimumTransferDays,
        transferLimit: policy.maximumTransfers == null || Number(membership.transferCount || 0) < policy.maximumTransfers,
        noActiveListing: allowCurrentListing || !hasBlockingListing(membership.listing),
        paymentMethod: !paymentMethod || (paymentMethod === 'ONLINE' ? policy.allowOnlinePayment : policy.allowCashTransfer),
    };

    const reasons = [];
    if (!checks.owner) reasons.push('You do not own this membership.');
    if (!checks.active) reasons.push('Only active memberships can be transferred.');
    if (!checks.notExpired) reasons.push('Expired memberships cannot be transferred.');
    if (!checks.gymApproved) reasons.push('This gym is not approved for marketplace transfers.');
    if (!checks.transferable) reasons.push('This membership plan does not allow transfers.');
    if (!checks.minimumRemainingDays) reasons.push(`This plan requires at least ${policy.minimumTransferDays} day${policy.minimumTransferDays === 1 ? '' : 's'} remaining.`);
    if (!checks.transferLimit) reasons.push(`This membership has reached the plan limit of ${policy.maximumTransfers} transfer${policy.maximumTransfers === 1 ? '' : 's'}.`);
    if (!checks.noActiveListing) reasons.push('This membership already has an active marketplace listing.');
    if (!checks.paymentMethod) reasons.push(paymentMethod === 'ONLINE' ? 'This plan does not allow online transfer payments.' : 'This plan does not allow cash transfer requests.');

    return { eligible: reasons.length === 0, reasons, checks, policy, daysRemaining };
};

const assertMembershipEligible = (membership, options) => {
    const result = evaluateMembershipEligibility(membership, options);
    if (!result.eligible) throw policyError(result.reasons[0] || 'This membership is not eligible for transfer.', 409);
    return result;
};

const findMembershipForEligibility = (membershipId) => prisma.userMembership.findUnique({
    where: { id: membershipId },
    include: { plan: { include: { gym: true } }, listing: true },
});

const getEligibilityForSeller = async (sellerId, membershipId) => {
    const membership = await findMembershipForEligibility(membershipId);
    return { membershipId, ...evaluateMembershipEligibility(membership, { sellerId }) };
};

const writeTransferAudit = (tx, entry) => tx.transferAuditLog.create({
    data: {
        membershipId: entry.membershipId,
        listingId: entry.listingId || null,
        actorId: entry.actorId || null,
        actorRole: entry.actorRole || null,
        action: entry.action,
        summary: entry.summary,
        metadata: entry.metadata || undefined,
    },
});

module.exports = {
    assertMembershipEligible,
    evaluateMembershipEligibility,
    findMembershipForEligibility,
    getEligibilityForSeller,
    getTransferPolicy,
    getDaysRemaining,
    normaliseBoolean,
    normaliseTransferPolicyInput,
    policyError,
    writeTransferAudit,
};
