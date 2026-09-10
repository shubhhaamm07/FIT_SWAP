import { useEffect, useState } from "react";

import {
    getDashboard,
    getDashboardCharts,
} from "../api/dashboard.api";
import { isRequestCancelled } from "./useVisibilityPolling";

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
        const controller = new AbortController();
        const fetchDashboard = async () => {
            try {
                setLoading(true);

                const [dashboardData, chartData] = await Promise.all([
                    getDashboard({ signal: controller.signal }),
                    getDashboardCharts({ signal: controller.signal }),
                ]);

                if (controller.signal.aborted) return;

                setDashboard({
                    ...dashboardData,
                    charts: chartData,
                });

                setError("");
            } catch (err) {
                if (isRequestCancelled(err)) return;
                console.error(err);

                setError(
                    err?.response?.data?.message ||
                    "Failed to load dashboard."
                );
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };

        void fetchDashboard();
        return () => controller.abort();
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
