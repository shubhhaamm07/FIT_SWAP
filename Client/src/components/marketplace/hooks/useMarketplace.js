import { useCallback, useEffect, useMemo, useState } from "react";
import { getMarketplaceListings } from "../../../api/marketplace.api";

const defaultFilters = {
    search: "",
    gym: "all",
    state: "",
    city: "",
    minPrice: "",
    maxPrice: "",
    duration: "all",
    distance: "all",
    verifiedOnly: false,
    featuredOnly: false,
    sortBy: "newest",
};
const ITEMS_PER_PAGE = 6;

const distanceInKilometres = (first, second) => {
    const earthRadius = 6371;
    const radians = (degrees) => degrees * (Math.PI / 180);
    const latitudeDelta = radians(second.latitude - first.latitude);
    const longitudeDelta = radians(second.longitude - first.longitude);
    const firstLatitude = radians(first.latitude);
    const secondLatitude = radians(second.latitude);
    const a = Math.sin(latitudeDelta / 2) ** 2
        + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;
    return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const useMarketplace = () => {
    const [filters, setFilters] = useState(defaultFilters);
    const [currentPage, setCurrentPage] = useState(1);
    const [allListings, setAllListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [userLocation, setUserLocation] = useState(null);
    const [locationStatus, setLocationStatus] = useState({ state: "idle", message: "" });

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
            ...(key === "state" ? { city: "" } : {}),
        }));
    };

    const resetFilters = () => {
        setCurrentPage(1);
        setFilters(defaultFilters);
    };

    const requestUserLocation = () => {
        if (!navigator.geolocation) {
            setLocationStatus({ state: "error", message: "Location is not supported by this browser." });
            return;
        }

        setLocationStatus({ state: "loading", message: "Finding your location…" });
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });
                setCurrentPage(1);
                setFilters((current) => ({
                    ...current,
                    distance: current.distance === "all" ? "25" : current.distance,
                    sortBy: "nearest",
                }));
                setLocationStatus({ state: "ready", message: "Location added. Distance filtering is active." });
            },
            (locationError) => {
                setLocationStatus({
                    state: "error",
                    message: locationError.code === locationError.PERMISSION_DENIED
                        ? "Location permission was denied. Choose a state and city instead."
                        : "Your location could not be detected. Try again or use the location fields.",
                });
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
        );
    };

    const clearUserLocation = () => {
        setUserLocation(null);
        setCurrentPage(1);
        setFilters((current) => ({ ...current, distance: "all" }));
        setLocationStatus({ state: "idle", message: "" });
    };

    const locationOptions = useMemo(() => {
        const states = [...new Set(allListings.map((listing) => listing.state).filter(Boolean))]
            .sort((first, second) => first.localeCompare(second));
        const selectedState = filters.state.trim().toLowerCase();
        const cities = [...new Set(allListings
            .filter((listing) => !selectedState || listing.state.toLowerCase().includes(selectedState))
            .map((listing) => listing.city)
            .filter(Boolean))]
            .sort((first, second) => first.localeCompare(second));
        return { states, cities };
    }, [allListings, filters.state]);

    const listings = useMemo(() => {
        let data = [...allListings];

        data = data.map((listing) => {
            const hasCoordinates = listing.latitude !== null && listing.longitude !== null;
            return {
                ...listing,
                distanceKm: userLocation && hasCoordinates
                    ? distanceInKilometres(userLocation, listing)
                    : null,
            };
        });

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

        // State and city/district values come from current marketplace data,
        // so the UI never needs a hardcoded list of Indian locations.
        if (filters.state.trim()) {
            const state = filters.state.trim().toLowerCase();
            data = data.filter((listing) => listing.state.toLowerCase().includes(state));
        }

        if (filters.city.trim()) {
            const city = filters.city.trim().toLowerCase();
            data = data.filter(
                (listing) => listing.city.toLowerCase().includes(city)
            );
        }

        if (userLocation && filters.distance !== "all") {
            const maximumDistance = Number(filters.distance);
            data = data.filter((listing) => (
                listing.distanceKm !== null && listing.distanceKm <= maximumDistance
            ));
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
            case "nearest":
                data.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
                break;
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
    }, [allListings, filters, userLocation]);

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
        locationOptions,
        userLocation,
        locationStatus,
        requestUserLocation,
        clearUserLocation,
    };
};

export default useMarketplace;
