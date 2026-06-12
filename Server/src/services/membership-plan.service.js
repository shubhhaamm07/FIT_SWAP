const prisma = require('../lib/prisma');

const createMembershipPlan = async (
    gymId,
    planData
) => {
    const plan = await prisma.membershipPlan.create({
        data: {
            ...planData,
            gymId
        }
    });

    return plan;
};
const getPlansByGym = async (gymId) => {
    return prisma.membershipPlan.findMany({
        where: {
            gymId
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
};
const getPlanById = async (planId) => {
    return prisma.membershipPlan.findUnique({
        where: {
            id: planId
        }
    });
};
module.exports = {
    createMembershipPlan,
    getPlansByGym,
    getPlanById
};