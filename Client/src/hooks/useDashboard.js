import { useEffect, useState } from "react";

import {
    getDashboard,
    getDashboardCharts,
} from "../api/dashboard.api";

export function useDashboard() {
    const [dashboard, setDashboard] = useState({
        stats: {
            memberships: {
                total: 0,
                active: 0,
            },

            marketplace: {
                total: 0,
            },

            notifications: {
                total: 0,
                unread: 0,
            },

            transfers: {
                total: 0,
                pending: 0,
            },

            gyms: {
                total: 0,
            },
        },

        memberships: [],

        listings: [],

        gyms: [],

        notifications: [],

        transferRequests: [],

        activities: [],

        charts: {
            labels: [],
            memberships: [],
            listings: [],
        },
    });

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setLoading(true);

                const [dashboardData, chartData] = await Promise.all([
                    getDashboard(),
                    getDashboardCharts(),
                ]);

                setDashboard({
                    ...dashboardData,
                    charts: chartData,
                });

                setError("");
            } catch (err) {
                console.error(err);

                setError(
                    err?.response?.data?.message ||
                    "Failed to load dashboard."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    return {
        stats: dashboard.stats,

        memberships: dashboard.memberships,

        listings: dashboard.listings,

        gyms: dashboard.gyms,

        notifications: dashboard.notifications,

        transferRequests: dashboard.transferRequests,

        activities: dashboard.activities,

        charts: dashboard.charts,

        loading,

        error,
    };
}