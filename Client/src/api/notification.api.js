import axios from "./axios";

export const getNotifications =
    async (config = {}) => {
        const { data } = await axios.get(
            "/notifications",
            config
        );

        return data.data;
    };

export const markNotificationRead =
    async (notificationId) => {
        const { data } = await axios.patch(
            `/notifications/${notificationId}/read`
        );

        return data.data;
    };

export const markAllNotificationsRead =
    async () => {
        const { data } = await axios.patch(
            "/notifications/read-all"
        );

        return data.data;
    };
