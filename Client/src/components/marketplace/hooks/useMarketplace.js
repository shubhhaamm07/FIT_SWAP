import { useCallback, useEffect, useMemo, useState } from "react";
import { getMarketplaceListings } from "../../../api/marketplace.api";

const defaultFilters = {
    search: "",
    gym: "all",
    city: "all",
    minPrice: "",
    maxPrice: "",
    duration: "all",
    distance: "10",
    verifiedOnly: false,
    featuredOnly: false,
    sortBy: "newest",
};
const ITEMS_PER_PAGE = 6;
const useMarketplace = () => {
    const [filters, setFilters] = useState(defaultFilters);
    const [currentPage, setCurrentPage] = useState(1);
    const [allListings, setAllListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const refreshListings = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getMarketplaceListings();
            setAllListings(data);
            setError("");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to load marketplace listings. Please try again.",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const loadListings = async () => {
            await refreshListings();
        };

        void loadListings();
    }, [refreshListings]);

    const updateFilter = (key, value) => {
        setCurrentPage(1);
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const resetFilters = () => {
        setCurrentPage(1);
        setFilters(defaultFilters);
    };

    const listings = useMemo(() => {
        let data = [...allListings];

        // Search
        if (filters.search.trim()) {
            const keyword = filters.search.toLowerCase();

            data = data.filter(
                (listing) =>
                    listing.gym.toLowerCase().includes(keyword) ||
                    listing.membership.toLowerCase().includes(keyword) ||
                    listing.location.toLowerCase().includes(keyword)
            );
        }

        // Gym
        if (filters.gym !== "all") {
            data = data.filter(
                (listing) => listing.gym === filters.gym
            );
        }

        // City
        if (filters.city !== "all") {
            data = data.filter(
                (listing) => listing.location === filters.city
            );
        }

        // Min Price
        if (filters.minPrice !== "") {
            data = data.filter(
                (listing) =>
                    listing.price >= Number(filters.minPrice)
            );
        }

        // Max Price
        if (filters.maxPrice !== "") {
            data = data.filter(
                (listing) =>
                    listing.price <= Number(filters.maxPrice)
            );
        }

        // Remaining Days
        if (filters.duration !== "all") {
            data = data.filter(
                (listing) =>
                    listing.remainingDays >= Number(filters.duration)
            );
        }

        // Verified
        if (filters.verifiedOnly) {
            data = data.filter(
                (listing) => listing.verified
            );
        }

        // Featured
        if (filters.featuredOnly) {
            data = data.filter(
                (listing) => listing.featured
            );
        }

        switch (filters.sortBy) {
            case "price-low":
                data.sort((a, b) => a.price - b.price);
                break;

            case "price-high":
                data.sort((a, b) => b.price - a.price);
                break;

            case "remaining-days":
                data.sort(
                    (a, b) =>
                        b.remainingDays - a.remainingDays
                );
                break;

            default:
                break;
        }

        return data;
    }, [allListings, filters]);

    const totalPages = Math.ceil(
        listings.length / ITEMS_PER_PAGE
    );

    const paginatedListings = listings.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return {
        listings: paginatedListings,
        totalListings: listings.length,
        currentPage,
        totalPages,
        setCurrentPage,
        filters,
        updateFilter,
        resetFilters,
        loading,
        error,
        refreshListings,
    };
};

export default useMarketplace;
