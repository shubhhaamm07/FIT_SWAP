import { useCallback, useEffect, useMemo, useState } from "react";
import { getMarketplaceListingPage } from "../../../api/marketplace.api";
import { isRequestCancelled } from "../../../hooks/useVisibilityPolling";

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
    const [pagination, setPagination] = useState({ page: 1, limit: ITEMS_PER_PAGE, total: 0, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [userLocation, setUserLocation] = useState(null);
    const [locationStatus, setLocationStatus] = useState({ state: "idle", message: "" });

    const requestQuery = useMemo(() => ({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: filters.search.trim() || undefined,
        gym: filters.gym !== "all" ? filters.gym : undefined,
        state: filters.state.trim() || undefined,
        city: filters.city.trim() || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        duration: filters.duration !== "all" ? filters.duration : undefined,
        featuredOnly: filters.featuredOnly || undefined,
        sortBy: filters.sortBy === "nearest" ? "newest" : filters.sortBy,
    }), [currentPage, filters]);

    const refreshListings = useCallback(async ({ signal } = {}) => {
        try {
            setLoading(true);
            const data = await getMarketplaceListingPage(requestQuery, { signal });
            if (signal?.aborted) return;
            setAllListings(data.items);
            setPagination(data.pagination);
            setError("");
        } catch (err) {
            if (isRequestCancelled(err)) return;
            setError(
                err.response?.data?.message ||
                "Unable to load marketplace listings. Please try again.",
            );
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, [requestQuery]);

    useEffect(() => {
        const controller = new AbortController();
        const timer = window.setTimeout(() => { void refreshListings({ signal: controller.signal }); }, 0);
        return () => { window.clearTimeout(timer); controller.abort(); };
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

        if (userLocation && filters.distance !== "all") {
            const maximumDistance = Number(filters.distance);
            data = data.filter((listing) => (
                listing.distanceKm !== null && listing.distanceKm <= maximumDistance
            ));
        }

        if (filters.sortBy === "nearest") data.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));

        return data;
    }, [allListings, filters, userLocation]);

    const usingLocalDistanceFilter = Boolean(userLocation && filters.distance !== "all");
    const totalPages = usingLocalDistanceFilter ? 1 : pagination.totalPages;
    const paginatedListings = usingLocalDistanceFilter ? listings : listings;

    return {
        listings: paginatedListings,
        totalListings: usingLocalDistanceFilter ? listings.length : pagination.total,
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
