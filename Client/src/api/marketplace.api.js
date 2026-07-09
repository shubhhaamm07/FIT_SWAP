import axios from "./axios";

export const getMarketplaceListings =
    async () => {
        const { data } = await axios.get(
            "/listings"
        );

        return data.data;
    };

export const getListingById = async (
    listingId
) => {
    const { data } = await axios.get(
        `/listings/${listingId}`
    );

    return data.data;
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

export const cancelListing = async (
    listingId
) => {
    const { data } = await axios.patch(
        `/listings/${listingId}/cancel`
    );

    return data.data;
};