export const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) {
        return "₹0";
    }

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
};

export const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

export const formatDateTime = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const getDurationLabel = (days) => {
    if (!days) return "-";

    if (days === 30) return "1 Month";

    if (days === 90) return "3 Months";

    if (days === 180) return "6 Months";

    if (days === 365) return "1 Year";

    if (days > 365) {
        return `${Math.round(days / 365)} Years`;
    }

    return `${days} Days`;
};

export const capitalize = (text = "") => {
    return text
        .toLowerCase()
        .replace(/\b\w/g, (char) =>
            char.toUpperCase()
        );
};

export const getGymLocation = (gym) => {
    if (!gym) return "";

    return [gym.city, gym.state]
        .filter(Boolean)
        .join(", ");
};

export const getMembershipValidity = (
    startDate,
    endDate
) => {
    return `${formatDate(
        startDate
    )} - ${formatDate(endDate)}`;
};

export const isExpired = (endDate) => {
    return (
        new Date(endDate).getTime() <
        Date.now()
    );
};

export const isActive = (
    status,
    endDate
) => {
    return (
        status === "ACTIVE" &&
        !isExpired(endDate)
    );
};

export const canFreeze = (
    membership
) => {
    return (
        membership?.status === "ACTIVE" &&
        membership?.plan?.freezeAllowed
    );
};

export const canTransfer = (
    membership
) => {
    return (
        membership?.status === "ACTIVE" &&
        membership?.plan?.transferable
    );
};