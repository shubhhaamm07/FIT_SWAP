export const getMembershipStatus = (status) => {
    switch (status) {
        case "ACTIVE":
            return {
                label: "Active",
                color: "green",
                bg: "bg-green-500/10",
                text: "text-green-400",
                border: "border-green-500/20",
            };

        case "FROZEN":
            return {
                label: "Frozen",
                color: "blue",
                bg: "bg-sky-500/10",
                text: "text-sky-400",
                border: "border-sky-500/20",
            };

        case "EXPIRED":
            return {
                label: "Expired",
                color: "red",
                bg: "bg-red-500/10",
                text: "text-red-400",
                border: "border-red-500/20",
            };

        case "PENDING":
            return {
                label: "Pending",
                color: "yellow",
                bg: "bg-yellow-500/10",
                text: "text-yellow-400",
                border: "border-yellow-500/20",
            };

        default:
            return {
                label: "Unknown",
                color: "gray",
                bg: "bg-zinc-700/10",
                text: "text-zinc-400",
                border: "border-zinc-600/20",
            };
    }
};