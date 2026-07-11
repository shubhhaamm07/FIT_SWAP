const prisma = require("../lib/prisma");

const getDashboard = async (userId) => {
    const [
        memberships,
        listings,
        notifications,
        transferRequests,
        gyms,
    ] = await Promise.all([
        prisma.userMembership.findMany({
            where: {
                userId,
            },
            include: {
                plan: {
                    include: {
                        gym: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        }),

        prisma.marketplaceListing.findMany({
            where: {
                status: "ACTIVE",
            },
            include: {
                membership: {
                    include: {
                        plan: {
                            include: {
                                gym: true,
                            },
                        },
                    },
                },
                seller: true,
            },
            take: 6,
            orderBy: {
                createdAt: "desc",
            },
        }),

        prisma.notification.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 10,
        }),

        prisma.transferRequest.findMany({
            where: {
                buyerId: userId,
            },
            include: {
                listing: {
                    include: {
                        membership: {
                            include: {
                                plan: {
                                    include: {
                                        gym: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        }),

        prisma.gym.findMany({
            where: {
                status: "APPROVED",
            },
            take: 6,
            orderBy: {
                createdAt: "desc",
            },
        }),
    ]);

    const stats = {
        memberships: {
            total: memberships.length,
            active: memberships.filter(
                (membership) => membership.status === "ACTIVE"
            ).length,
        },

        marketplace: {
            total: listings.length,
        },

        notifications: {
            total: notifications.length,
            unread: notifications.filter(
                (notification) => !notification.isRead
            ).length,
        },

        transfers: {
            total: transferRequests.length,
            pending: transferRequests.filter(
                (request) => request.status === "PENDING"
            ).length,
        },

        gyms: {
            total: gyms.length,
        },
    };

    const activities = [];

    memberships.forEach((membership) => {
        activities.push({
            id: membership.id,
            title: `Purchased ${membership.plan.name}`,
            description: membership.plan.gym.name,
            type: "membership",
            createdAt: membership.createdAt,
        });
    });

    transferRequests.forEach((request) => {
        activities.push({
            id: request.id,
            title: "Transfer Request",
            description: request.status,
            type: "transfer",
            createdAt: request.createdAt,
        });
    });

    notifications.forEach((notification) => {
        activities.push({
            id: notification.id,
            title: notification.title,
            description: notification.message,
            type: "notification",
            createdAt: notification.createdAt,
        });
    });

    activities.sort(
        (a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
    );

    return {
        stats,
        memberships,
        listings,
        notifications,
        transferRequests,
        gyms,
        activities: activities.slice(0, 8),
    };
};

module.exports = {
    getDashboard,
};