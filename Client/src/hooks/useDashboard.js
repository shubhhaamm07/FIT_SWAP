import { useCallback, useEffect, useState } from "react";

import { loadDashboard } from "../api/dashboard.api";

export function useDashboard() {
    const [memberships, setMemberships] = useState([]);
    const [listings, setListings] = useState([]);
    const [gyms, setGyms] = useState([]);
    const [notifications, setNotifications] =
        useState([]);
    const [transferRequests, setTransferRequests] =
        useState([]);

    const [activities, setActivities] = useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] = useState(null);

    const refreshDashboard = useCallback(
        async () => {
            try {
                setLoading(true);

                const data =
                    await loadDashboard();

                setMemberships(data.memberships);

                setListings(data.listings);

                setGyms(data.gyms);

                setNotifications(
                    data.notifications
                );

                setTransferRequests(
                    data.transferRequests
                );

                setActivities(data.activities);

                setError(null);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    err.message
                );
            } finally {
                setLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        refreshDashboard();
    }, [refreshDashboard]);

    return {
        memberships,
        listings,
        gyms,
        notifications,
        transferRequests,
        activities,
        loading,
        error,

        refreshDashboard,
    };
}