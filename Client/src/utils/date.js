export const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

export const formatDateTime = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const getDaysRemaining = (endDate) => {
    const today = new Date();

    const expiry = new Date(endDate);

    const diff =
        expiry.getTime() - today.getTime();

    return Math.ceil(
        diff / (1000 * 60 * 60 * 24)
    );
};