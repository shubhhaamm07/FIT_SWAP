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
const getPlanWithGym = async (planId) => {
    return prisma.membershipPlan.findUnique({
        where: {
            id: planId
        },
        include: {
            gym: true
        }
    });
};
const deletePlan = async (planId) => {
    return prisma.membershipPlan.delete({
        where: {
            id: planId
        }
    });
};
const updatePlan = async (
    planId,
    updateData
) => {
    return prisma.membershipPlan.update({
        where: {
            id: planId
        },
        data: updateData
    });
};
module.exports = {
    createMembershipPlan,
    getPlansByGym,
    getPlanById,
    deletePlan,
    getPlanWithGym,
    updatePlan
};