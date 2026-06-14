const prisma = require('../lib/prisma');

const purchaseMembership = async (
    userId,
    planId
) => {
    const plan = await prisma.membershipPlan.findUnique({
        where: {
            id: planId
        },
        include: {
            gym: true
        }
    });

    // Check 1: Plan exists
    if (!plan) {
        throw new Error('Plan not found');
    }

    // Check 2: Gym is approved
    if (plan.gym.status !== 'APPROVED') {
        throw new Error(
            'Cannot purchase membership from unapproved gym'
        );
    }

    // Check 3: User doesn't already have an active membership
    const existingMembership =
        await prisma.userMembership.findFirst({
            where: {
                userId,
                planId,
                status: 'ACTIVE'
            }
        });

    if (existingMembership) {
        throw new Error(
            'You already have an active membership for this plan'
        );
    }

    const startDate = new Date();

    const endDate = new Date();

    endDate.setDate(
        endDate.getDate() + plan.durationInDays
    );

    return prisma.userMembership.create({
        data: {
            userId,
            planId,
            startDate,
            endDate
        }
    });
};
const getMyMemberships = async (
    userId
) => {
    return prisma.userMembership.findMany({
        where: {
            userId
        },
        include: {
            plan: {
                select: {
                    id: true,
                    name: true,
                    price: true,
                    durationInDays: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
};
const getMembershipById = async (
    membershipId
) => {
    return prisma.userMembership.findUnique({
        where: {
            id: membershipId
        },
        include: {
            plan: {
                select: {
                    id: true,
                    name: true,
                    price: true,
                    durationInDays: true
                }
            }
        }
    });
};
module.exports = {
    purchaseMembership,
    getMyMemberships,
    getMembershipById
};