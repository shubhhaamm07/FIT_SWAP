import { getMyMemberships } from "./membership.api";
import { getMarketplaceListings } from "./marketplace.api";
import { getAllGyms } from "./gym.api";
import { getNotifications } from "./notification.api";
import { getMyTransferRequests } from "./transfer.api";

const buildActivities = (
    memberships,
    notifications,
    transferRequests
) => {
    const activities = [];

    memberships.forEach((membership) => {
        activities.push({
            id: membership.id,
            title: `Purchased ${membership.plan.name}`,
            description: "Membership Purchased",
            date: membership.createdAt,
            type: "membership",
        });
    });

    transferRequests.forEach((request) => {
        activities.push({
            id: request.id,
            title: "Transfer Request",
            description: request.status,
            date: request.createdAt,
            type: "transfer",
        });
    });

    notifications.forEach((notification) => {
        activities.push({
            id: notification.id,
            title: notification.title,
            description: notification.message,
            date: notification.createdAt,
            type: "notification",
        });
    });

    return activities.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
    );
};

export const loadDashboard = async () => {
    const [
        memberships,
        listings,
        gyms,
        notifications,
        transferRequests,
    ] = await Promise.all([
        getMyMemberships(),
        getMarketplaceListings(),
        getAllGyms(),
        getNotifications(),
        getMyTransferRequests(),
    ]);

    return {
        memberships,
        listings,
        gyms,
        notifications,
        transferRequests,
        activities: buildActivities(
            memberships,
            notifications,
            transferRequests
        ),
    };
};