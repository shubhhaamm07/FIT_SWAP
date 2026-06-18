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
const freezeMembership = async (
    membershipId,
    userId
) => {
    const membership =
        await prisma.userMembership.findUnique({
            where: {
                id: membershipId
            },
            include: {
                plan: true,
                listing: true
            }
        });

    // Membership Exists
    if (!membership) {
        throw new Error(
            'Membership not found'
        );
    }

    // Ownership Check
    if (membership.userId !== userId) {
        throw new Error(
            'You do not own this membership'
        );
    }

    // Membership Active Check
    if (membership.status !== 'ACTIVE') {
        throw new Error(
            'Only active memberships can be frozen'
        );
    }

    // Plan Allows Freeze
    if (!membership.plan.freezeAllowed) {
        throw new Error(
            'This membership cannot be frozen'
        );
    }

    // Active Marketplace Listing Check
    if (
        membership.listing &&
        membership.listing.status === 'ACTIVE'
    ) {
        throw new Error(
            'Cannot freeze a listed membership'
        );
    }

    // Expiry Check
    const daysRemaining = Math.ceil(
        (membership.endDate - new Date()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysRemaining < 7) {
        throw new Error(
            'Membership is too close to expiry'
        );
    }

    return prisma.userMembership.update({
        where: {
            id: membershipId
        },
        data: {
            status: 'FROZEN'
        }
    });
};
const unfreezeMembership = async (
    membershipId,
    userId
) => {
    const membership =
        await prisma.userMembership.findUnique({
            where: {
                id: membershipId
            }
        });

    if (!membership) {
        throw new Error(
            'Membership not found'
        );
    }

    // Ownership Check
    if (membership.userId !== userId) {
        throw new Error(
            'You do not own this membership'
        );
    }

    // Must Be Frozen
    if (membership.status !== 'FROZEN') {
        throw new Error(
            'Only frozen memberships can be unfrozen'
        );
    }

    return prisma.userMembership.update({
        where: {
            id: membershipId
        },
        data: {
            status: 'ACTIVE'
        }
    });
};
module.exports = {
    purchaseMembership,
    getMyMemberships,
    getMembershipById,
    freezeMembership,
    unfreezeMembership
};