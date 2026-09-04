const prisma = require('../lib/prisma');
const {
    normaliseTransferPolicyInput,
    normaliseBoolean,
    policyError,
    writeTransferAudit,
} = require('./transfer-policy.service');

const normaliseNumber = (value, field, { integer = false, minimum = 0 } = {}) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || (integer && !Number.isInteger(parsed)) || parsed < minimum) {
        throw policyError(`${field} is invalid.`);
    }
    return parsed;
};

const planFields = (input = {}, { partial = false } = {}) => {
    const data = {};
    const has = (field) => Object.prototype.hasOwnProperty.call(input, field);

    if (!partial || has('name')) {
        const name = String(input.name || '').trim();
        if (!name) throw policyError('Plan name is required.');
        data.name = name.slice(0, 120);
    }
    if (!partial || has('description')) {
        data.description = input.description == null || input.description === '' ? null : String(input.description).trim().slice(0, 1000);
    }
    if (!partial || has('durationInDays')) data.durationInDays = normaliseNumber(input.durationInDays, 'Duration', { integer: true, minimum: 1 });
    if (!partial || has('price')) data.price = normaliseNumber(input.price, 'Price', { minimum: 1 });
    if (!partial || has('freezeAllowed')) data.freezeAllowed = normaliseBoolean(input.freezeAllowed, false);
    if (has('transferFee')) {
        data.transferFee = input.transferFee === null || input.transferFee === ''
            ? null
            : normaliseNumber(input.transferFee, 'Transfer fee', { minimum: 0 });
    }

    return { ...data, ...normaliseTransferPolicyInput(input, { partial }) };
};

const validatePolicyAgainstPlan = (plan) => {
    if (plan.minimumTransferDays > plan.durationInDays) {
        throw policyError('Minimum remaining days cannot be longer than the plan duration.');
    }
    if (plan.transferable && !plan.allowOnlinePayment && !plan.allowCashTransfer) {
        throw policyError('Enable online payment or cash transfer for a transferable plan.');
    }
};

const createMembershipPlan = async (gymId, planData, actorId) => {
    const data = planFields(planData);
    validatePolicyAgainstPlan(data);

    return prisma.$transaction(async (tx) => {
        const plan = await tx.membershipPlan.create({ data: { ...data, gymId } });
        await writeTransferAudit(tx, {
            membershipId: `plan:${plan.id}`,
            actorId,
            actorRole: 'GYM_OWNER',
            action: 'TRANSFER_POLICY_CREATED',
            summary: `Created transfer policy for ${plan.name}.`,
            metadata: { gymId, policy: normaliseTransferPolicyInput(planData) },
        });
        return plan;
    });
};

const getPlansByGym = async (gymId) => prisma.membershipPlan.findMany({
    where: { gymId },
    orderBy: { createdAt: 'desc' },
});

const getPlanById = async (planId) => prisma.membershipPlan.findUnique({ where: { id: planId } });

const getPlanWithGym = async (planId) => prisma.membershipPlan.findUnique({
    where: { id: planId },
    include: { gym: true },
});

const deletePlan = async (planId) => prisma.membershipPlan.delete({ where: { id: planId } });

const updatePlan = async (planId, updateData, actorId) => {
    const existing = await prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (!existing) throw policyError('Plan not found.', 404);

    const data = planFields(updateData, { partial: true });
    validatePolicyAgainstPlan({ ...existing, ...data });

    return prisma.$transaction(async (tx) => {
        const plan = await tx.membershipPlan.update({ where: { id: planId }, data });
        await writeTransferAudit(tx, {
            membershipId: `plan:${planId}`,
            actorId,
            actorRole: 'GYM_OWNER',
            action: 'TRANSFER_POLICY_UPDATED',
            summary: `Updated transfer policy for ${plan.name}.`,
            metadata: { policy: normaliseTransferPolicyInput(updateData, { partial: true }) },
        });
        return plan;
    });
};

module.exports = {
    createMembershipPlan,
    getPlansByGym,
    getPlanById,
    deletePlan,
    getPlanWithGym,
    updatePlan,
};
