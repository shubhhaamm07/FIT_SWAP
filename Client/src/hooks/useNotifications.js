import { useEffect, useState } from "react";

import { getNotifications } from "../api/notification.api";

export function useNotifications(interval = 30000) {
    const [notifications, setNotifications] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    useEffect(() => {
        let timer;

        const fetchNotifications = async () => {
            try {
                const data = await getNotifications();

                setNotifications(data);

                setError("");
            } catch (err) {
                setError(
                    err?.response?.data?.message ||
                    "Failed to load notifications."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();

        timer = setInterval(
            fetchNotifications,
            interval
        );

        return () => clearInterval(timer);
    }, [interval]);

    return {
        notifications,
        loading,
        error,
    };
}