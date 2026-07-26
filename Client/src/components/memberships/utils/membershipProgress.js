export const calculateMembershipProgress = (
    startDate,
    endDate
) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();

    const totalDuration =
        end.getTime() - start.getTime();

    const elapsedDuration =
        today.getTime() - start.getTime();

    const percentage = Math.min(
        100,
        Math.max(
            0,
            Math.round(
                (elapsedDuration / totalDuration) * 100
            )
        )
    );

    return percentage;
};

export const getDaysRemaining = (
    endDate
) => {
    const today = new Date();
    const expiry = new Date(endDate);

    const remaining = Math.ceil(
        (expiry.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return Math.max(0, remaining);
};

export const getDaysUsed = (
    startDate,
    endDate
) => {
    const start = new Date(startDate);
    const expiry = new Date(endDate);

    const totalDays = Math.ceil(
        (expiry.getTime() - start.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return (
        totalDays -
        getDaysRemaining(endDate)
    );
};

export const getMembershipDuration = (
    startDate,
    endDate
) => {
    const start = new Date(startDate);
    const expiry = new Date(endDate);

    return Math.ceil(
        (expiry.getTime() - start.getTime()) /
        (1000 * 60 * 60 * 24)
    );
};