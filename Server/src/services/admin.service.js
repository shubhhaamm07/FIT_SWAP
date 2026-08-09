const prisma = require('../lib/prisma');

const startOfMonth = (value = new Date()) =>
    new Date(value.getFullYear(), value.getMonth(), 1);

const addMonths = (value, amount) =>
    new Date(value.getFullYear(), value.getMonth() + amount, 1);

const monthLabel = (value) =>
    value.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

const membershipRevenue = (membership) =>
    Number(membership.purchasePrice ?? membership.plan?.price ?? 0);

const createAuditLog = async ({ adminId, action, targetType, targetId, summary, metadata }) =>
    prisma.adminAuditLog.create({
        data: {
            adminId,
            action,
            targetType,
            targetId,
            summary,
            metadata
        }
    });

const getAdminDashboard = async () => {
    const [
        totalUsers,
        totalGymOwners,
        pendingGyms,
        approvedGyms,
        activeListings,
        totalListings,
        pendingTransfers,
        recentGyms,
        recentListings
    ] = await Promise.all([
        prisma.user.count({ where: { role: 'USER' } }),
        prisma.user.count({ where: { role: 'GYM_OWNER' } }),
        prisma.gym.count({ where: { status: 'PENDING' } }),
        prisma.gym.count({ where: { status: 'APPROVED' } }),
        prisma.marketplaceListing.count({ where: { status: 'ACTIVE', deletedAt: null } }),
        prisma.marketplaceListing.count({ where: { deletedAt: null } }),
        prisma.transferRequest.count({ where: { status: 'PENDING' } }),
        prisma.gym.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                city: true,
                status: true,
                createdAt: true,
                owner: { select: { firstName: true, lastName: true } }
            }
        }),
        prisma.marketplaceListing.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            where: { deletedAt: null },
            select: {
                id: true,
                status: true,
                askingPrice: true,
                createdAt: true,
                seller: { select: { firstName: true, lastName: true } },
                membership: {
                    select: {
                        plan: { select: { name: true, gym: { select: { name: true } } } }
                    }
                }
            }
        })
    ]);

    return {
        overview: {
            totalUsers,
            totalGymOwners,
            pendingGyms,
            approvedGyms,
            activeListings,
            totalListings,
            pendingTransfers
        },
        recentGyms,
        recentListings
    };
};

const getPendingGyms = async () => {
    return prisma.gym.findMany({
        where: {
            status: 'PENDING'
        },
        include: {
            owner: {
                select: {
                    firstName: true,
                    lastName: true,
                    email: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
};

const getPlatformAnalytics = async () => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const previousMonthStart = addMonths(currentMonthStart, -1);
    const sixMonthStart = addMonths(currentMonthStart, -5);

    const [memberships, totalUsers, newRegistrations, activeMemberships, totalListings, soldListings] = await Promise.all([
        prisma.userMembership.findMany({
            where: { createdAt: { gte: sixMonthStart } },
            select: {
                id: true,
                userId: true,
                createdAt: true,
                purchasePrice: true,
                plan: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        gym: { select: { id: true, name: true } }
                    }
                }
            }
        }),
        prisma.user.count({ where: { role: { in: ['USER', 'GYM_OWNER'] } } }),
        prisma.user.count({ where: { createdAt: { gte: currentMonthStart } } }),
        prisma.userMembership.findMany({
            where: { status: 'ACTIVE', endDate: { gt: now } },
            select: { userId: true }
        }),
        prisma.marketplaceListing.count({ where: { deletedAt: null } }),
        prisma.marketplaceListing.count({ where: { status: 'SOLD', deletedAt: null } })
    ]);

    const revenueTrend = Array.from({ length: 6 }, (_, index) => {
        const start = addMonths(currentMonthStart, index - 5);
        const end = addMonths(start, 1);
        const monthMemberships = memberships.filter((membership) =>
            membership.createdAt >= start && membership.createdAt < end
        );

        return {
            label: monthLabel(start),
            revenue: monthMemberships.reduce((total, membership) => total + membershipRevenue(membership), 0),
            sales: monthMemberships.length
        };
    });

    const currentMonth = revenueTrend.at(-1);
    const previousMonth = revenueTrend.at(-2);
    const monthlyGrowth = previousMonth?.revenue
        ? Number((((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100).toFixed(1))
        : currentMonth?.revenue ? 100 : 0;

    const gymTotals = new Map();
    const planTotals = new Map();
    memberships.forEach((membership) => {
        const revenue = membershipRevenue(membership);
        const gym = membership.plan.gym;
        const plan = membership.plan;
        const gymEntry = gymTotals.get(gym.id) || { id: gym.id, name: gym.name, revenue: 0, sales: 0 };
        gymEntry.revenue += revenue;
        gymEntry.sales += 1;
        gymTotals.set(gym.id, gymEntry);

        const planEntry = planTotals.get(plan.id) || { id: plan.id, name: plan.name, gymName: gym.name, revenue: 0, sales: 0 };
        planEntry.revenue += revenue;
        planEntry.sales += 1;
        planTotals.set(plan.id, planEntry);
    });

    return {
        overview: {
            platformRevenue: revenueTrend.reduce((total, month) => total + month.revenue, 0),
            activeUsers: new Set(activeMemberships.map((membership) => membership.userId)).size,
            registeredUsers: totalUsers,
            newRegistrations,
            membershipSales: memberships.length,
            listingConversion: totalListings ? Number(((soldListings / totalListings) * 100).toFixed(1)) : 0,
            monthlyGrowth,
            currentMonthRevenue: currentMonth?.revenue || 0
        },
        revenueTrend,
        topGyms: Array.from(gymTotals.values()).sort((first, second) => second.revenue - first.revenue).slice(0, 5),
        topPlans: Array.from(planTotals.values()).sort((first, second) => second.sales - first.sales || second.revenue - first.revenue).slice(0, 5)
    };
};

const getAnnouncementRecipients = async () =>
    prisma.user.findMany({
        where: { role: { in: ['USER', 'GYM_OWNER'] } },
        select: { id: true, firstName: true, lastName: true, email: true, role: true },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        take: 250
    });

const sendAnnouncement = async ({ adminId, title, message, audience, recipientIds = [] }) => {
    const cleanTitle = String(title || '').trim();
    const cleanMessage = String(message || '').trim();
    const validAudiences = ['ALL_USERS', 'MEMBERS', 'GYM_OWNERS', 'SELECTED_USERS'];

    if (!cleanTitle || cleanTitle.length > 100) throw new Error('Title must be between 1 and 100 characters');
    if (!cleanMessage || cleanMessage.length > 1000) throw new Error('Message must be between 1 and 1000 characters');
    if (!validAudiences.includes(audience)) throw new Error('Invalid announcement audience');
    if (audience === 'SELECTED_USERS' && (!Array.isArray(recipientIds) || !recipientIds.length)) {
        throw new Error('Select at least one recipient');
    }
    if (Array.isArray(recipientIds) && recipientIds.length > 250) throw new Error('You can select up to 250 recipients at once');

    const audienceWhere = audience === 'ALL_USERS'
        ? { role: { in: ['USER', 'GYM_OWNER'] } }
        : audience === 'MEMBERS'
            ? { role: 'USER' }
            : audience === 'GYM_OWNERS'
                ? { role: 'GYM_OWNER' }
                : { id: { in: [...new Set(recipientIds)] } };

    const recipients = await prisma.user.findMany({
        where: audienceWhere,
        select: { id: true }
    });
    if (!recipients.length) throw new Error('No eligible recipients found');

    return prisma.$transaction(async (transaction) => {
        const announcement = await transaction.announcement.create({
            data: { adminId, title: cleanTitle, message: cleanMessage, audience, recipientCount: recipients.length }
        });

        await transaction.notification.createMany({
            data: recipients.map((recipient) => ({ userId: recipient.id, title: cleanTitle, message: cleanMessage }))
        });

        await transaction.adminAuditLog.create({
            data: {
                adminId,
                action: 'ANNOUNCEMENT_SENT',
                targetType: 'ANNOUNCEMENT',
                targetId: announcement.id,
                summary: `Sent “${cleanTitle}” to ${recipients.length} recipient${recipients.length === 1 ? '' : 's'}`,
                metadata: { audience, recipientCount: recipients.length }
            }
        });

        return announcement;
    });
};

const getAnnouncements = async () =>
    prisma.announcement.findMany({
        take: 25,
        orderBy: { createdAt: 'desc' },
        include: { admin: { select: { firstName: true, lastName: true } } }
    });

const getAuditLogs = async () =>
    prisma.adminAuditLog.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: { admin: { select: { firstName: true, lastName: true, email: true } } }
    });

module.exports = {
    getAdminDashboard,
    getPendingGyms,
    getPlatformAnalytics,
    getAnnouncementRecipients,
    sendAnnouncement,
    getAnnouncements,
    getAuditLogs,
    createAuditLog
};
