import { useCallback, useEffect, useMemo, useState } from "react";

import {
    getMyMemberships,
    purchaseMembership,
    freezeMembership,
    unfreezeMembership,
} from "../../../api/membership.api";

function useMembership() {
    const [memberships, setMemberships] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [search, setSearch] = useState("");

    const [activeTab, setActiveTab] = useState("ALL");

    const [sortBy, setSortBy] = useState("NEWEST");

    const fetchMemberships = useCallback(async () => {
        try {
            setLoading(true);

            const response = await getMyMemberships();

            setMemberships(response.data);

            setError("");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to load memberships."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Schedule the initial request after mount so it cannot synchronously
        // trigger a render from within the effect itself.
        const timer = setTimeout(() => {
            void fetchMemberships();
        }, 0);

        return () => clearTimeout(timer);
    }, [fetchMemberships]);

    const handlePurchaseMembership = async (planId) => {
        try {
            const response = await purchaseMembership(planId);

            await fetchMemberships();

            return {
                success: true,
                message:
                    response.message ||
                    "Membership purchased successfully.",
            };
        } catch (err) {
            return {
                success: false,
                message:
                    err.response?.data?.message ||
                    "Unable to purchase membership.",
            };
        }
    };

    const handleFreezeMembership = async (membershipId) => {
        try {
            const response = await freezeMembership(
                membershipId
            );

            await fetchMemberships();

            return {
                success: true,
                message:
                    response.message ||
                    "Membership frozen successfully.",
            };
        } catch (err) {
            return {
                success: false,
                message:
                    err.response?.data?.message ||
                    "Unable to freeze membership.",
            };
        }
    };

    const handleUnfreezeMembership = async (
        membershipId
    ) => {
        try {
            const response =
                await unfreezeMembership(membershipId);

            await fetchMemberships();

            return {
                success: true,
                message:
                    response.message ||
                    "Membership resumed successfully.",
            };
        } catch (err) {
            return {
                success: false,
                message:
                    err.response?.data?.message ||
                    "Unable to resume membership.",
            };
        }
    };

    const counts = useMemo(() => {
        return {
            all: memberships.length,

            active: memberships.filter(
                (membership) =>
                    membership.status === "ACTIVE"
            ).length,

            frozen: memberships.filter(
                (membership) =>
                    membership.status === "FROZEN"
            ).length,

            expired: memberships.filter(
                (membership) =>
                    membership.status === "EXPIRED"
            ).length,
        };
    }, [memberships]);

    const filteredMemberships = useMemo(() => {
        let data = [...memberships];

        if (activeTab !== "ALL") {
            data = data.filter(
                (membership) =>
                    membership.status === activeTab
            );
        }

        if (search.trim()) {
            const keyword = search.toLowerCase();

            data = data.filter(
                (membership) =>
                    membership.plan?.name
                        ?.toLowerCase()
                        .includes(keyword) ||
                    membership.plan?.gym?.name
                        ?.toLowerCase()
                        .includes(keyword) ||
                    membership.plan?.gym?.city
                        ?.toLowerCase()
                        .includes(keyword)
            );
        }

        switch (sortBy) {
            case "PRICE_HIGH":
                data.sort(
                    (a, b) =>
                        b.plan.price - a.plan.price
                );
                break;

            case "PRICE_LOW":
                data.sort(
                    (a, b) =>
                        a.plan.price - b.plan.price
                );
                break;

            case "EXPIRING":
                data.sort(
                    (a, b) =>
                        new Date(a.endDate) -
                        new Date(b.endDate)
                );
                break;

            case "OLDEST":
                data.sort(
                    (a, b) =>
                        new Date(a.createdAt) -
                        new Date(b.createdAt)
                );
                break;

            default:
                data.sort(
                    (a, b) =>
                        new Date(b.createdAt) -
                        new Date(a.createdAt)
                );
        }

        return data;
    }, [
        memberships,
        search,
        activeTab,
        sortBy,
    ]);

    return {
        memberships: filteredMemberships,

        allMemberships: memberships,

        loading,

        error,

        counts,

        search,
        setSearch,

        activeTab,
        setActiveTab,

        sortBy,
        setSortBy,

        refreshMemberships: fetchMemberships,

        purchaseMembership:
            handlePurchaseMembership,

        freezeMembership:
            handleFreezeMembership,

        unfreezeMembership:
            handleUnfreezeMembership,
    };
}

export default useMembership;
