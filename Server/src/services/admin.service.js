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
        recentListings,
        completedPlatformFees
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
        }),
        prisma.platformPaymentRequest.aggregate({
            where: { status: 'COMPLETED' },
            _sum: { amount: true }
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
            pendingTransfers,
            // Platform fees are stored in paise; dashboard values are returned
            // in rupees to match the rest of the admin UI.
            platformRevenue: Number(completedPlatformFees._sum.amount || 0) / 100
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

const getPlatformAnalytics = async ({ months } = {}) => {
    const periodMonths = [3, 6, 12].includes(Number(months)) ? Number(months) : 6;
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const previousMonthStart = addMonths(currentMonthStart, -1);
    const periodStart = addMonths(currentMonthStart, -(periodMonths - 1));

    const [memberships, totalUsers, newRegistrations, activeMemberships, totalListings, soldListings] = await Promise.all([
        prisma.userMembership.findMany({
            where: { createdAt: { gte: periodStart } },
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

    const revenueTrend = Array.from({ length: periodMonths }, (_, index) => {
        const start = addMonths(currentMonthStart, index - (periodMonths - 1));
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
        periodMonths,
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

const getAuditLogs = async ({ action, search = '' } = {}) => {
    const validActions = ['ANNOUNCEMENT_SENT', 'GYM_STATUS_UPDATED', 'LISTING_STATUS_UPDATED', 'USER_ROLE_UPDATED', 'USER_ACCESS_UPDATED', 'TRANSFER_RESOLVED'];
    const cleanSearch = String(search || '').trim();
    const where = {};

    if (validActions.includes(action)) where.action = action;
    if (cleanSearch) {
        where.OR = [
            { summary: { contains: cleanSearch, mode: 'insensitive' } },
            { targetType: { contains: cleanSearch, mode: 'insensitive' } },
            {
                admin: {
                    is: {
                        OR: [
                            { firstName: { contains: cleanSearch, mode: 'insensitive' } },
                            { lastName: { contains: cleanSearch, mode: 'insensitive' } },
                            { email: { contains: cleanSearch, mode: 'insensitive' } }
                        ]
                    }
                }
            }
        ];
    }

    return prisma.adminAuditLog.findMany({
        where,
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: { admin: { select: { firstName: true, lastName: true, email: true } } }
    });
};

const userDirectorySelect = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    phone: true,
    role: true,
    isActive: true,
    createdAt: true,
    _count: {
        select: {
            memberships: true,
            listings: true,
            gyms: true,
            payments: true
        }
    }
};

const getUsers = async ({ search = '', role, status } = {}) => {
    const where = {};
    const cleanSearch = String(search || '').trim();

    if (cleanSearch) {
        where.OR = [
            { firstName: { contains: cleanSearch, mode: 'insensitive' } },
            { lastName: { contains: cleanSearch, mode: 'insensitive' } },
            { email: { contains: cleanSearch, mode: 'insensitive' } },
            { phone: { contains: cleanSearch, mode: 'insensitive' } }
        ];
    }

    if (['USER', 'GYM_OWNER', 'GYM_STAFF', 'ADMIN'].includes(role)) {
        where.role = role;
    }

    if (status === 'ACTIVE') where.isActive = true;
    if (status === 'SUSPENDED') where.isActive = false;

    return prisma.user.findMany({
        where,
        select: userDirectorySelect,
        orderBy: { createdAt: 'desc' },
        take: 250
    });
};

const getActiveAdminCount = () =>
    prisma.user.count({ where: { role: 'ADMIN', isActive: true } });

const updateUserRole = async ({ adminId, userId, role }) => {
    const validRoles = ['USER', 'GYM_OWNER', 'GYM_STAFF', 'ADMIN'];
    if (!validRoles.includes(role)) throw new Error('Invalid user role');
    if (adminId === userId) throw new Error('You cannot change your own administrator role');

    const target = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, firstName: true, lastName: true, role: true, isActive: true, _count: { select: { gyms: true } } }
    });
    if (!target) throw new Error('User not found');
    if (target.role === role) return target;

    if (target.role === 'ADMIN' && target.isActive && role !== 'ADMIN' && await getActiveAdminCount() <= 1) {
        throw new Error('FitSwap must keep at least one active administrator');
    }

    if (target._count.gyms > 0 && role !== 'GYM_OWNER') {
        throw new Error('Transfer or close this user’s gyms before removing the Gym Owner role');
    }

    return prisma.$transaction(async (transaction) => {
        const updated = await transaction.user.update({
            where: { id: userId },
            data: { role },
            select: userDirectorySelect
        });

        await transaction.adminAuditLog.create({
            data: {
                adminId,
                action: 'USER_ROLE_UPDATED',
                targetType: 'USER',
                targetId: userId,
                summary: `${target.firstName} ${target.lastName} role changed from ${target.role} to ${role}`,
                metadata: { previousRole: target.role, nextRole: role }
            }
        });

        return updated;
    });
};

const updateUserAccess = async ({ adminId, userId, isActive }) => {
    if (typeof isActive !== 'boolean') throw new Error('Account access must be true or false');
    if (adminId === userId) throw new Error('You cannot change your own account access');

    const target = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, firstName: true, lastName: true, role: true, isActive: true }
    });
    if (!target) throw new Error('User not found');
    if (target.isActive === isActive) return prisma.user.findUnique({ where: { id: userId }, select: userDirectorySelect });

    if (!isActive && target.role === 'ADMIN' && await getActiveAdminCount() <= 1) {
        throw new Error('FitSwap must keep at least one active administrator');
    }

    return prisma.$transaction(async (transaction) => {
        const updated = await transaction.user.update({
            where: { id: userId },
            data: { isActive },
            select: userDirectorySelect
        });

        await transaction.adminAuditLog.create({
            data: {
                adminId,
                action: 'USER_ACCESS_UPDATED',
                targetType: 'USER',
                targetId: userId,
                summary: `${target.firstName} ${target.lastName} account ${isActive ? 'restored' : 'suspended'}`,
                metadata: { isActive }
            }
        });

        return updated;
    });
};

const getPayments = async ({ status } = {}) => {
    const legacyWhere = ['CREATED', 'PAID', 'FAILED'].includes(status) ? { status } : {};
    const upiWhere = ['AWAITING_PAYMENT', 'BUYER_MARKED_PAID', 'AWAITING_GYM_APPROVAL', 'COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED'].includes(status)
        ? { status }
        : {};

    const [legacyPayments, upiPayments, platformPayments] = await Promise.all([
        prisma.payment.findMany({
        where: legacyWhere,
        take: 250,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            type: true,
            createdAt: true,
            verifiedAt: true,
            razorpayPaymentId: true,
            buyer: { select: { id: true, firstName: true, lastName: true, email: true } },
            listing: {
                select: {
                    id: true,
                    askingPrice: true,
                    status: true,
                    membership: { select: { plan: { select: { name: true, gym: { select: { name: true } } } } } }
                }
            },
            plan: {
                select: {
                    id: true,
                    name: true,
                    gym: { select: { name: true } }
                }
            },
        }
        }),
        prisma.upiPaymentRequest.findMany({
            where: upiWhere,
            take: 250,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                amount: true,
                currency: true,
                status: true,
                kind: true,
                createdAt: true,
                buyerMarkedPaidAt: true,
                recipientConfirmedAt: true,
                gymApprovedAt: true,
                completedAt: true,
                paymentRef: true,
                utr: true,
                buyer: { select: { id: true, firstName: true, lastName: true, email: true } },
                listing: {
                    select: {
                        id: true,
                        askingPrice: true,
                        status: true,
                        membership: { select: { plan: { select: { name: true, gym: { select: { name: true } } } } } },
                    },
                },
                plan: {
                    select: {
                        id: true,
                        name: true,
                        gym: { select: { name: true } },
                    },
                },
            },
        }),
        prisma.platformPaymentRequest.findMany({
            take: 250,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                amount: true,
                currency: true,
                status: true,
                kind: true,
                planCode: true,
                paymentRef: true,
                utr: true,
                createdAt: true,
                buyerMarkedPaidAt: true,
                adminConfirmedAt: true,
                completedAt: true,
                buyer: { select: { id: true, firstName: true, lastName: true, email: true } },
                listing: {
                    select: {
                        id: true,
                        askingPrice: true,
                        status: true,
                        membership: { select: { plan: { select: { name: true, gym: { select: { name: true } } } } } },
                    },
                },
            },
        }),
    ]);

    return [
        ...legacyPayments.map((payment) => ({ ...payment, provider: 'RAZORPAY_LEGACY' })),
        ...upiPayments.map((payment) => ({
            ...payment,
            id: `upi-${payment.id}`,
            type: payment.kind,
            provider: 'MANUAL_UPI',
            verifiedAt: payment.completedAt || payment.gymApprovedAt || payment.recipientConfirmedAt || payment.buyerMarkedPaidAt,
        })),
        ...platformPayments.map((payment) => ({
            ...payment,
            id: `platform-${payment.id}`,
            sourcePaymentId: payment.id,
            type: payment.kind,
            provider: 'PLATFORM_UPI',
            plan: payment.listing ? null : { name: payment.planCode, gym: { name: 'FitSwap platform' } },
            verifiedAt: payment.completedAt || payment.adminConfirmedAt || payment.buyerMarkedPaidAt,
        })),
    ]
        .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
        .slice(0, 250);
};

const getSecurityOverview = async () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [suspendedAccounts, failedPayments, pendingTransfers, recentAdminActions] = await Promise.all([
        prisma.user.count({ where: { isActive: false } }),
        prisma.payment.count({ where: { status: 'FAILED' } }),
        prisma.transferRequest.count({ where: { status: 'PENDING' } }),
        prisma.adminAuditLog.count({ where: { createdAt: { gte: oneDayAgo } } })
    ]);

    return { suspendedAccounts, failedPayments, pendingTransfers, recentAdminActions };
};

module.exports = {
    getAdminDashboard,
    getPendingGyms,
    getPlatformAnalytics,
    getAnnouncementRecipients,
    sendAnnouncement,
    getAnnouncements,
    getAuditLogs,
    createAuditLog,
    getUsers,
    updateUserRole,
    updateUserAccess,
    getPayments,
    getSecurityOverview
};
