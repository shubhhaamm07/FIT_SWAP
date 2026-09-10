import { useCallback, useState } from "react";

import { getNotifications } from "../api/notification.api";
import { isRequestCancelled, useVisibilityPolling } from "./useVisibilityPolling";

export function useNotifications(interval = 30000) {
    const [notifications, setNotifications] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const fetchNotifications = useCallback(async ({ signal } = {}) => {
            try {
                const data = await getNotifications({ signal });

                if (signal?.aborted) return;
                setNotifications(data);

                setError("");
            } catch (err) {
                if (isRequestCancelled(err)) return;
                setError(
                    err?.response?.data?.message ||
                    "Failed to load notifications."
                );
                throw err;
            } finally {
                if (!signal?.aborted) setLoading(false);
            }
    }, []);

    useVisibilityPolling(fetchNotifications, { interval });

    return {
        notifications,
        loading,
        error,
    };
}
