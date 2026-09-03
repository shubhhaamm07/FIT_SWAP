import axios from "./axios";

const fallbackImage =
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200";

export const mapMarketplaceListing = (listing) => {
    const membership = listing.membership || {};
    const plan = membership.plan || {};
    const gym = plan.gym || {};
    const seller = listing.seller || membership.user || {};
    const endDate = membership.endDate ? new Date(membership.endDate) : null;
    const remainingDays = endDate
        ? Math.max(0, Math.ceil((endDate - new Date()) / 86_400_000))
        : 0;
    const primaryImage = gym.images?.find((image) => image.isPrimary);

    return {
        id: listing.id,
        gym: gym.name || "FitSwap Partner Gym",
        membership: plan.name || "Gym Membership",
        seller: [seller.firstName, seller.lastName].filter(Boolean).join(" ") || "FitSwap Member",
        location: gym.city || gym.state || "Location pending",
        price: Number(listing.askingPrice || 0),
        originalPrice: Number(plan.price || listing.askingPrice || 0),
        remainingDays,
        transferFee: Number(plan.transferFee || 0),
        verified: gym.status === "APPROVED",
        featured:
            Boolean(listing.boostedUntil) &&
            new Date(listing.boostedUntil).getTime() > Date.now(),
        boostedUntil: listing.boostedUntil || null,
        status: listing.status || "ACTIVE",
        image: primaryImage?.imageUrl || gym.images?.[0]?.imageUrl || fallbackImage,
        validTill: endDate
            ? new Intl.DateTimeFormat("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }).format(endDate)
            : "Not available",
        raw: listing,
    };
};

export const getMarketplaceListings =
    async () => {
        const { data } = await axios.get(
            "/listings"
        );

        return data.data.map(mapMarketplaceListing);
    };

export const getListingById = async (
    listingId
) => {
    const { data } = await axios.get(
        `/listings/${listingId}`
    );

    return mapMarketplaceListing(data.data);
};

export const createListing = async (
    membershipId,
    askingPrice
) => {
    const { data } = await axios.post(
        "/listings",
        {
            membershipId,
            askingPrice,
        }
    );

    return data.data;
};

export const getListingPriceSuggestion = async (membershipId) => {
    const { data } = await axios.get(
        `/listings/price-suggestion/${membershipId}`,
    );

    return data.data;
};

export const cancelListing = async (
    listingId
) => {
    const { data } = await axios.patch(
        `/listings/${listingId}/cancel`
    );

    return data.data;
};

export const getMyListings = async () => {
    const { data } = await axios.get("/listings/my");
    return data.data.map(mapMarketplaceListing);
};

export const pauseListing = async (listingId) => {
    const { data } = await axios.patch(`/listings/${listingId}/pause`);
    return data.data;
};

export const activateListing = async (listingId) => {
    const { data } = await axios.patch(`/listings/${listingId}/activate`);
    return data.data;
};

export const getSavedListings = async () => {
    const { data } = await axios.get("/saved-listings");
    return data.data.map(({ listing }) => mapMarketplaceListing(listing));
};

export const saveListing = async (listingId) => {
    const { data } = await axios.post("/saved-listings", { listingId });
    return data.data;
};

export const removeSavedListing = async (listingId) => {
    const { data } = await axios.delete(`/saved-listings/${listingId}`);
    return data.data;
};
