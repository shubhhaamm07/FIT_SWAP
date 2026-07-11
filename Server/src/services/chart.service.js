const prisma = require("../lib/prisma");

const getDashboardCharts = async (userId) => {
    const memberships = await prisma.userMembership.findMany({
        where: {
            userId,
        },
        select: {
            createdAt: true,
            status: true,
        },
        orderBy: {
            createdAt: "asc",
        },
    });

    const listings = await prisma.marketplaceListing.findMany({
        select: {
            createdAt: true,
            status: true,
        },
        orderBy: {
            createdAt: "asc",
        },
    });

    const monthlyMemberships = Array(12).fill(0);
    const monthlyListings = Array(12).fill(0);

    memberships.forEach((membership) => {
        const month = new Date(
            membership.createdAt
        ).getMonth();

        monthlyMemberships[month]++;
    });

    listings.forEach((listing) => {
        const month = new Date(
            listing.createdAt
        ).getMonth();

        monthlyListings[month]++;
    });

    return {
        labels: [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ],

        memberships: monthlyMemberships,

        listings: monthlyListings,
    };
};

module.exports = {
    getDashboardCharts,
};