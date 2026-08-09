const prisma = require('../lib/prisma');

const startOfMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date, count) =>
    new Date(date.getFullYear(), date.getMonth() + count, 1);

const monthKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const membershipRevenue = (membership) =>
    Number(membership.purchasePrice ?? membership.plan.price);

const buildRevenueTrend = (memberships, months = 6) => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const trendStart = addMonths(currentMonthStart, -(months - 1));
    const trendBuckets = Array.from({ length: months }, (_, index) => {
        const date = addMonths(trendStart, index);
        return {
            key: monthKey(date),
            label: new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(date),
            revenue: 0,
            sales: 0
        };
    });
    const trendByMonth = new Map(trendBuckets.map((item) => [item.key, item]));

    memberships.forEach((membership) => {
        const bucket = trendByMonth.get(monthKey(new Date(membership.createdAt)));
        if (bucket) {
            bucket.revenue += membershipRevenue(membership);
            bucket.sales += 1;
        }
    });

    return trendBuckets;
};

const buildSalesSummary = (memberships) => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const previousMonthStart = addMonths(currentMonthStart, -1);
    const totalRevenue = memberships.reduce(
        (total, membership) => total + membershipRevenue(membership),
        0
    );
    const currentMonthMemberships = memberships.filter(
        (membership) => new Date(membership.createdAt) >= currentMonthStart
    );
    const previousMonthMemberships = memberships.filter((membership) => {
        const createdAt = new Date(membership.createdAt);
        return createdAt >= previousMonthStart && createdAt < currentMonthStart;
    });
    const currentMonthRevenue = currentMonthMemberships.reduce(
        (total, membership) => total + membershipRevenue(membership),
        0
    );
    const previousMonthRevenue = previousMonthMemberships.reduce(
        (total, membership) => total + membershipRevenue(membership),
        0
    );
    const monthlyGrowth = previousMonthRevenue
        ? Number((((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100).toFixed(1))
        : currentMonthRevenue > 0
            ? 100
            : 0;

    return {
        totalRevenue,
        totalSales: memberships.length,
        currentMonthRevenue,
        currentMonthSales: currentMonthMemberships.length,
        monthlyGrowth,
        averageSaleValue: memberships.length
            ? Math.round(totalRevenue / memberships.length)
            : 0
    };
};

const buildRevenueByGym = (memberships) => {
    const gyms = new Map();

    memberships.forEach((membership) => {
        const gym = membership.plan.gym;
        const current = gyms.get(gym.id) || {
            id: gym.id,
            name: gym.name,
            city: gym.city,
            revenue: 0,
            sales: 0
        };
        current.revenue += membershipRevenue(membership);
        current.sales += 1;
        gyms.set(gym.id, current);
    });

    return Array.from(gyms.values()).sort((first, second) => second.revenue - first.revenue);
};

const getGymOwnerDashboard = async (ownerId) => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const previousMonthStart = addMonths(currentMonthStart, -1);
    const expiringDate = new Date(now);
    expiringDate.setDate(expiringDate.getDate() + 30);

    const [gyms, memberships, pendingTransfers] = await Promise.all([
        prisma.gym.findMany({
            where: { ownerId },
            select: {
                id: true,
                name: true,
                city: true,
                status: true,
                _count: { select: { plans: true } }
            },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.userMembership.findMany({
            where: {
                plan: {
                    gym: { ownerId }
                }
            },
            select: {
                id: true,
                createdAt: true,
                purchasePrice: true,
                endDate: true,
                status: true,
                plan: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        gym: { select: { id: true, name: true } }
                    }
                },
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.transferRequest.count({
            where: {
                status: 'PENDING',
                listing: {
                    membership: {
                        plan: {
                            gym: { ownerId }
                        }
                    }
                }
            }
        })
    ]);

    const activeMemberships = memberships.filter(
        (membership) =>
            membership.status === 'ACTIVE' && new Date(membership.endDate) > now
    );
    const expiringMemberships = activeMemberships.filter(
        (membership) => new Date(membership.endDate) <= expiringDate
    );
    const revenue = memberships.reduce(
        (total, membership) => total + membershipRevenue(membership),
        0
    );
    const currentMonthMemberships = memberships.filter(
        (membership) => new Date(membership.createdAt) >= currentMonthStart
    );
    const previousMonthMemberships = memberships.filter((membership) => {
        const createdAt = new Date(membership.createdAt);
        return createdAt >= previousMonthStart && createdAt < currentMonthStart;
    });
    const currentMonthRevenue = currentMonthMemberships.reduce(
        (total, membership) => total + membershipRevenue(membership),
        0
    );
    const previousMonthRevenue = previousMonthMemberships.reduce(
        (total, membership) => total + membershipRevenue(membership),
        0
    );
    const monthlyGrowth = previousMonthRevenue
        ? Number((((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100).toFixed(1))
        : currentMonthRevenue > 0
            ? 100
            : 0;

    return {
        overview: {
            totalRevenue: revenue,
            activeMembers: activeMemberships.length,
            membershipSales: memberships.length,
            monthlyGrowth,
            currentMonthRevenue,
            currentMonthSales: currentMonthMemberships.length,
            expiringMembershipCount: expiringMemberships.length,
            pendingTransferCount: pendingTransfers
        },
        revenueTrend: buildRevenueTrend(memberships),
        expiringMemberships: expiringMemberships
            .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
            .slice(0, 5)
            .map((membership) => ({
                id: membership.id,
                memberName: `${membership.user.firstName} ${membership.user.lastName}`.trim(),
                email: membership.user.email,
                gymName: membership.plan.gym.name,
                planName: membership.plan.name,
                endDate: membership.endDate
            })),
        recentSales: memberships.slice(0, 6).map((membership) => ({
            id: membership.id,
            memberName: `${membership.user.firstName} ${membership.user.lastName}`.trim(),
            gymName: membership.plan.gym.name,
            planName: membership.plan.name,
            price: membershipRevenue(membership),
            createdAt: membership.createdAt
        })),
        gyms: gyms.map((gym) => ({
            ...gym,
            planCount: gym._count.plans
        }))
    };
};

const ownerMembershipSelect = {
    id: true,
    status: true,
    createdAt: true,
    purchasePrice: true,
    startDate: true,
    endDate: true,
    user: {
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
        }
    },
    plan: {
        select: {
            id: true,
            name: true,
            price: true,
            durationInDays: true,
            gym: { select: { id: true, name: true, city: true } }
        }
    }
};

const getGymOwnerMembers = async (ownerId) => {
    const memberships = await prisma.userMembership.findMany({
        where: { plan: { gym: { ownerId } } },
        select: ownerMembershipSelect,
        orderBy: { endDate: 'asc' }
    });

    const members = new Map();

    memberships.forEach((membership) => {
        const currentMember = members.get(membership.user.id) || {
            id: membership.user.id,
            firstName: membership.user.firstName,
            lastName: membership.user.lastName,
            email: membership.user.email,
            phone: membership.user.phone,
            memberships: []
        };

        currentMember.memberships.push({
            id: membership.id,
            status: membership.status,
            startDate: membership.startDate,
            endDate: membership.endDate,
            plan: membership.plan
        });
        members.set(membership.user.id, currentMember);
    });

    return Array.from(members.values()).sort((first, second) => {
        const firstName = `${first.firstName} ${first.lastName}`;
        const secondName = `${second.firstName} ${second.lastName}`;
        return firstName.localeCompare(secondName);
    });
};

const getGymOwnerSales = async (ownerId) => {
    const memberships = await prisma.userMembership.findMany({
        where: { plan: { gym: { ownerId } } },
        select: ownerMembershipSelect,
        orderBy: { createdAt: 'desc' }
    });

    return {
        summary: buildSalesSummary(memberships),
        revenueTrend: buildRevenueTrend(memberships),
        revenueByGym: buildRevenueByGym(memberships),
        sales: memberships.map((membership) => ({
            id: membership.id,
            createdAt: membership.createdAt,
            amount: membershipRevenue(membership),
            member: membership.user,
            plan: membership.plan
        }))
    };
};

const getGymOwnerTransfers = async (ownerId) => {
    return prisma.transferRequest.findMany({
        where: {
            listing: {
                membership: {
                    plan: { gym: { ownerId } }
                }
            }
        },
        select: {
            id: true,
            status: true,
            createdAt: true,
            buyer: {
                select: { firstName: true, lastName: true, email: true }
            },
            listing: {
                select: {
                    askingPrice: true,
                    status: true,
                    seller: {
                        select: { firstName: true, lastName: true, email: true }
                    },
                    membership: {
                        select: {
                            plan: {
                                select: {
                                    name: true,
                                    gym: { select: { name: true, city: true } }
                                }
                            }
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};

module.exports = {
    getGymOwnerDashboard,
    getGymOwnerMembers,
    getGymOwnerSales,
    getGymOwnerTransfers
};
